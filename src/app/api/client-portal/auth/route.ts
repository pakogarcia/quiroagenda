import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import crypto from 'crypto';
import { startOfToday } from 'date-fns';

function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  return digits;
}

function hashPin(pin: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(pin.trim()).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, pin, clientId } = body;

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

      // El PIN se almacena y consulta EXCLUSIVAMENTE en el documento aislado gabinete_data/client_pins
      const storedHash = clientPins[client.id] || null;

      return NextResponse.json({
        found: true,
        clientId: client.id,
        clientName: client.name,
        lastName: client.lastName || '',
        fullName: `${client.name || ''} ${client.lastName || ''}`.trim() || client.name,
        hasPin: Boolean(storedHash),
        voucher: client.voucher || null,
      });
    }

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

      // Guardar de forma permanente en documento aislado de PINs (inmune a la app de gestión)
      await setDoc(pinsDocRef, { [client.id]: pinHash }, { merge: true });

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

    // 3. LOGIN WITH PIN
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

      const expectedHash = hashPin(pin, client.id);
      if (storedHash !== expectedHash) {
        return NextResponse.json({ error: 'El PIN introducido no es correcto.' }, { status: 401 });
      }

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

    // 4. REFRESH CLIENT SESSION APPOINTMENTS
    if (action === 'refresh') {
      if (!client) {
        return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
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

    // 5. RESET PIN (Admin reset)
    if (action === 'reset_pin') {
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

      // Limpiar cualquier residuo de pinHash en el cliente
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
