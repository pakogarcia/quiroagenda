import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { startOfToday } from 'date-fns';
import { normalizePhone, hashPin, createClientSessionToken, verifyClientSessionToken } from '@/lib/client-auth';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, pin, clientId, token, adminHash } = body;

    const syncDocRef = doc(db, 'gabinete_data', 'main');
    const docSnap = await getDoc(syncDocRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Base de datos no disponible.' }, { status: 500 });
    }

    const data = docSnap.data();
    const clients: any[] = data.clients || [];
    const appointments: any[] = data.appointments || [];

    // Documento aislado e inmutable exclusivo para PINs (inmune a sobreescrituras del admin)
    const pinsDocRef = doc(db, 'gabinete_data', 'client_pins');
    const pinsSnap = await getDoc(pinsDocRef);
    const clientPins: Record<string, string> = pinsSnap.exists() ? (pinsSnap.data() || {}) : {};

    // Helper to find client by phone
    const normalizedTarget = normalizePhone(phone);
    const client = clients.find(c => normalizePhone(c.phone) === normalizedTarget);

    // 1. LOOKUP (Detect if client exists and if they already configured a PIN)
    // Blindaje anti-enumeración: solo devuelve el primer nombre de pila sin apellidos ni datos clínicos
    if (action === 'lookup') {
      if (!normalizedTarget || normalizedTarget.length < 9) {
        return NextResponse.json({ error: 'Introduce un número de teléfono válido (al menos 9 dígitos).' }, { status: 400 });
      }

      if (!client) {
        return NextResponse.json({
          found: false,
          message: 'No encontramos ninguna ficha con este teléfono. Si aún no eres paciente, puedes pedir tu primera cita en el catálogo.'
        });
      }

      const storedHash = clientPins[client.id] || null;
      const firstName = (client.name || '').trim().split(' ')[0] || 'Paciente';

      return NextResponse.json({
        found: true,
        clientId: client.id,
        clientName: firstName,
        hasPin: Boolean(storedHash),
      });
    }

    // Documento de seguridad para control de ataques de fuerza bruta
    const secDocRef = doc(db, 'gabinete_data', 'auth_security');

    // 2. SET PIN (First time registration of their 4-digit confidential PIN)
    if (action === 'set_pin') {
      if (!client) {
        return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
      }

      if (!pin || !/^\d{4}$/.test(pin.trim())) {
        return NextResponse.json({ error: 'El PIN debe ser de exactamente 4 dígitos numéricos (ej. 1234).' }, { status: 400 });
      }

      const existingPin = clientPins[client.id];
      if (existingPin) {
        return NextResponse.json({ error: 'Ya tienes un PIN creado. Por favor introduce tu PIN para acceder.' }, { status: 400 });
      }

      const pinHash = hashPin(pin, client.id);

      // Guardar de forma permanente en documento aislado de PINs
      await setDoc(pinsDocRef, { [client.id]: pinHash }, { merge: true });

      // Generar token criptográfico firmado
      const sessionToken = createClientSessionToken(client.id, client.phone);

      // Gather appointments for this client
      const clientNameFull = `${client.name} ${client.lastName || ''}`.trim().toLowerCase();
      const clientAppointments = appointments.filter((apt: any) => {
        const aptPhoneNorm = normalizePhone(apt.clientPhone);
        const aptNameNorm = (apt.clientName || '').trim().toLowerCase();
        return (apt.clientId && apt.clientId === client.id) || (aptPhoneNorm && aptPhoneNorm === normalizedTarget) || (aptNameNorm && aptNameNorm === clientNameFull);
      });

      const today = startOfToday();
      const upcoming = clientAppointments
        .filter((a: any) => new Date(a.dateTime) >= today && a.status === 'scheduled')
        .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

      const past = clientAppointments
        .filter((a: any) => new Date(a.dateTime) < today || a.status !== 'scheduled')
        .sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

      return NextResponse.json({
        success: true,
        token: sessionToken,
        client: {
          id: client.id,
          name: client.name,
          lastName: client.lastName,
          phone: client.phone,
          voucher: client.voucher,
        },
        upcomingAppointments: upcoming,
        pastAppointments: past,
      });
    }

    // 3. LOGIN WITH PIN (Con protección de Rate Limiting y Bloqueo Anti-Fuerza Bruta)
    if (action === 'login') {
      if (!client) {
        return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
      }

      if (!pin || !/^\d{4}$/.test(pin.trim())) {
        return NextResponse.json({ error: 'El PIN debe tener 4 dígitos numéricos.' }, { status: 400 });
      }

      const storedHash = clientPins[client.id];
      if (!storedHash) {
        return NextResponse.json({ error: 'Aún no has configurado tu PIN personal.', needsPin: true }, { status: 400 });
      }

      // Verificación de bloqueo temporal previo
      const secSnap = await getDoc(secDocRef);
      const secData = secSnap.exists() ? secSnap.data() : {};
      const failedMap = secData.failedAttempts || {};
      const clientSec = failedMap[normalizedTarget];

      if (clientSec && clientSec.lockedUntil && new Date(clientSec.lockedUntil).getTime() > Date.now()) {
        const remainingMins = Math.ceil((new Date(clientSec.lockedUntil).getTime() - Date.now()) / (60 * 1000));
        return NextResponse.json({
          error: `Acceso bloqueado temporalmente por seguridad (${remainingMins} min restantes). Si has olvidado tu PIN, avisa a Pako para que te lo reinicie.`
        }, { status: 429 });
      }

      const expectedHash = hashPin(pin, client.id);
      if (storedHash !== expectedHash) {
        const currentFailed = (clientSec && !clientSec.lockedUntil ? clientSec.count || 0 : 0) + 1;
        let lockedUntil = null;

        if (currentFailed >= MAX_FAILED_ATTEMPTS) {
          lockedUntil = new Date(Date.now() + (LOCKOUT_MINUTES * 60 * 1000)).toISOString();
        }

        await setDoc(secDocRef, {
          failedAttempts: {
            ...failedMap,
            [normalizedTarget]: {
              count: currentFailed >= MAX_FAILED_ATTEMPTS ? 0 : currentFailed,
              lockedUntil,
              lastAttempt: new Date().toISOString(),
            }
          }
        }, { merge: true });

        if (lockedUntil) {
          return NextResponse.json({
            error: `Has superado el número máximo de intentos permitidos (${MAX_FAILED_ATTEMPTS}). Por seguridad, el acceso queda bloqueado durante ${LOCKOUT_MINUTES} minutos.`
          }, { status: 429 });
        }

        const remainingAttempts = MAX_FAILED_ATTEMPTS - currentFailed;
        return NextResponse.json({
          error: `El PIN introducido no es correcto. Te quedan ${remainingAttempts} intento${remainingAttempts === 1 ? '' : 's'}.`
        }, { status: 401 });
      }

      // PIN correcto: limpiar registro de intentos fallidos
      if (clientSec && (clientSec.count > 0 || clientSec.lockedUntil)) {
        const updatedFailed = { ...failedMap };
        delete updatedFailed[normalizedTarget];
        await setDoc(secDocRef, { failedAttempts: updatedFailed }, { merge: true });
      }

      // Generar token criptográfico firmado
      const sessionToken = createClientSessionToken(client.id, client.phone);

      // Gather appointments for this client
      const clientNameFull = `${client.name} ${client.lastName || ''}`.trim().toLowerCase();
      const clientAppointments = appointments.filter((apt: any) => {
        const aptPhoneNorm = normalizePhone(apt.clientPhone);
        const aptNameNorm = (apt.clientName || '').trim().toLowerCase();
        return (apt.clientId && apt.clientId === client.id) || (aptPhoneNorm && aptPhoneNorm === normalizedTarget) || (aptNameNorm && aptNameNorm === clientNameFull);
      });

      const today = startOfToday();
      const upcoming = clientAppointments
        .filter((a: any) => new Date(a.dateTime) >= today && a.status === 'scheduled')
        .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

      const past = clientAppointments
        .filter((a: any) => new Date(a.dateTime) < today || a.status !== 'scheduled')
        .sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

      return NextResponse.json({
        success: true,
        token: sessionToken,
        client: {
          id: client.id,
          name: client.name,
          lastName: client.lastName,
          phone: client.phone,
          voucher: client.voucher,
        },
        upcomingAppointments: upcoming,
        pastAppointments: past,
      });
    }

    // 4. REFRESH CLIENT SESSION APPOINTMENTS (Requiere token criptográfico de sesión)
    if (action === 'refresh') {
      if (!client) {
        return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
      }

      // Verificación de token criptográfico
      const tokenVerification = verifyClientSessionToken(token, client.id, client.phone);
      if (!tokenVerification.valid) {
        return NextResponse.json({
          error: 'Sesión no válida o expirada. Por favor, introduce tu PIN para entrar.'
        }, { status: 401 });
      }

      const storedHash = clientPins[client.id];
      if (!storedHash) {
        return NextResponse.json({
          success: false,
          pinReset: true,
          message: 'Tu PIN ha sido restablecido. Por favor, crea un nuevo PIN para entrar.'
        });
      }

      const clientNameFull = `${client.name} ${client.lastName || ''}`.trim().toLowerCase();
      const clientAppointments = appointments.filter((apt: any) => {
        const aptPhoneNorm = normalizePhone(apt.clientPhone);
        const aptNameNorm = (apt.clientName || '').trim().toLowerCase();
        return (apt.clientId && apt.clientId === client.id) || (aptPhoneNorm && aptPhoneNorm === normalizedTarget) || (aptNameNorm && aptNameNorm === clientNameFull);
      });

      const today = startOfToday();
      const upcoming = clientAppointments
        .filter((a: any) => new Date(a.dateTime) >= today && a.status === 'scheduled')
        .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

      const past = clientAppointments
        .filter((a: any) => new Date(a.dateTime) < today || a.status !== 'scheduled')
        .sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

      return NextResponse.json({
        success: true,
        client: {
          id: client.id,
          name: client.name,
          lastName: client.lastName,
          phone: client.phone,
          voucher: client.voucher,
        },
        upcomingAppointments: upcoming,
        pastAppointments: past,
      });
    }

    // 5. RESET PIN (Exclusivo Administrador: requiere contraseña maestra)
    if (action === 'reset_pin') {
      // Validar credencial del administrador
      const secAdminDoc = doc(db, 'settings', 'security');
      const secAdminSnap = await getDoc(secAdminDoc);
      const storedAdminHash = secAdminSnap.exists() ? secAdminSnap.data()?.passwordHash : null;

      if (!adminHash || !storedAdminHash || adminHash !== storedAdminHash) {
        return NextResponse.json({
          error: 'Acceso denegado. Se requieren permisos de administrador autenticado para restablecer PINs.'
        }, { status: 403 });
      }

      let targetId = clientId;
      if (!targetId && phone) {
        const found = clients.find(c => normalizePhone(c.phone) === normalizePhone(phone));
        if (found) targetId = found.id;
      }
      if (!targetId && client) {
        targetId = client.id;
      }

      if (!targetId) {
        return NextResponse.json({ error: 'Cliente no especificado.' }, { status: 400 });
      }

      // Borrar de forma garantizada del documento de pins
      const updatedPins = { ...clientPins };
      delete updatedPins[targetId];
      await setDoc(pinsDocRef, updatedPins);

      // Limpiar cualquier residuo de pinHash en el cliente si existiera
      const targetClient = clients.find(c => c.id === targetId);
      if (targetClient && targetClient.pinHash) {
        delete targetClient.pinHash;
        await setDoc(syncDocRef, { ...data, clients });
      }

      return NextResponse.json({ success: true, message: 'PIN restablecido correctamente.' });
    }

    return NextResponse.json({ error: 'Acción no soportada.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en API client portal:', error);
    return NextResponse.json({ error: 'Error del servidor: ' + (error.message || 'Desconocido') }, { status: 500 });
  }
}
