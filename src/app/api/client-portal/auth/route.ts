import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import crypto from 'crypto';
import { startOfToday } from 'date-fns';

function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('34') && digits.length >= 11) {
    return digits.slice(2);
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

      return NextResponse.json({
        found: true,
        clientName: client.name,
        hasPin: Boolean(client.pinHash),
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

      // If client already has a PIN, require login instead
      if (client.pinHash) {
        return NextResponse.json({ error: 'Ya tienes un PIN creado. Por favor introduce tu PIN para acceder.' }, { status: 400 });
      }

      const pinHash = hashPin(pin, client.id);
      client.pinHash = pinHash;

      // Persist updated clients array to Firestore
      await setDoc(syncDocRef, { ...data, clients });

      // Gather appointments for this client
      const clientNameFull = `${client.name} ${client.lastName || ''}`.trim().toLowerCase();
      const clientAppointments = appointments.filter((apt: any) => {
        const aptPhoneNorm = normalizePhone(apt.clientPhone);
        const aptNameNorm = (apt.clientName || '').trim().toLowerCase();
        return (aptPhoneNorm && aptPhoneNorm === normalizedTarget) || (aptNameNorm && aptNameNorm === clientNameFull);
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

      if (!client.pinHash) {
        return NextResponse.json({ error: 'Aún no has configurado tu PIN personal.', needsPin: true }, { status: 400 });
      }

      const expectedHash = hashPin(pin, client.id);
      if (client.pinHash !== expectedHash) {
        return NextResponse.json({ error: 'El PIN introducido no es correcto.' }, { status: 401 });
      }

      // Gather appointments for this client
      const clientNameFull = `${client.name} ${client.lastName || ''}`.trim().toLowerCase();
      const clientAppointments = appointments.filter((apt: any) => {
        const aptPhoneNorm = normalizePhone(apt.clientPhone);
        const aptNameNorm = (apt.clientName || '').trim().toLowerCase();
        return (aptPhoneNorm && aptPhoneNorm === normalizedTarget) || (aptNameNorm && aptNameNorm === clientNameFull);
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

    // 4. RESET PIN (Admin reset)
    if (action === 'reset_pin') {
      const targetId = clientId || (client ? client.id : null);
      if (!targetId) {
        return NextResponse.json({ error: 'Cliente no especificado.' }, { status: 400 });
      }

      const targetClient = clients.find(c => c.id === targetId);
      if (!targetClient) {
        return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
      }

      delete targetClient.pinHash;
      await setDoc(syncDocRef, { ...data, clients });

      return NextResponse.json({ success: true, message: 'PIN restablecido correctamente.' });
    }

    return NextResponse.json({ error: 'Acción no soportada.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en API client portal:', error);
    return NextResponse.json({ error: 'Error del servidor: ' + (error.message || 'Desconocido') }, { status: 500 });
  }
}
