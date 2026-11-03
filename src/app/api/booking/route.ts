import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { parseISO, format, set, addMinutes, isSameDay, isBefore, startOfToday } from 'date-fns';
import { calculateAvailableSlots, madridDateTimeToUtc } from '@/lib/availability';

interface BookingRequestBody {
  serviceId: string;
  serviceTitle: string;
  durationMinutes: number;
  price: number;
  dateStr: string;   // 'YYYY-MM-DD'
  timeSlot: string;  // 'HH:mm'
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const body: BookingRequestBody = await request.json();
    const {
      serviceId,
      serviceTitle,
      durationMinutes,
      price,
      dateStr,
      timeSlot,
      clientName,
      clientPhone,
      clientEmail,
      notes,
    } = body;

    // 1. Validaciones básicas obligatorias
    if (!clientName || clientName.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres.' }, { status: 400 });
    }

    const cleanPhone = (clientPhone || '').replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      return NextResponse.json({ error: 'Por favor introduce un teléfono de contacto válido.' }, { status: 400 });
    }

    if (!dateStr || !timeSlot) {
      return NextResponse.json({ error: 'La fecha y hora de la cita son obligatorias.' }, { status: 400 });
    }

    const selectedDate = parseISO(dateStr);
    if (isNaN(selectedDate.getTime()) || isBefore(selectedDate, startOfToday())) {
      return NextResponse.json({ error: 'La fecha seleccionada no es válida.' }, { status: 400 });
    }

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const appointmentDateTime = set(selectedDate, { hours, minutes, seconds: 0, milliseconds: 0 });

    // 2. Comprobar disponibilidad en Firestore para evitar citas duplicadas
    const syncDocRef = doc(db, 'gabinete_data', 'main');
    const docSnap = await getDoc(syncDocRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'El gabinete no está disponible en este momento.' }, { status: 503 });
    }

    const cloudData = docSnap.data();
    const existingAppointments = cloudData.appointments || [];
    const services = cloudData.services || [];
    const profile = cloudData.profile || null;
    const blockedDays = cloudData.blockedDays || [];

    // Validar con el motor de disponibilidad si ese hueco sigue libre en zona de Madrid
    const availableSlots = calculateAvailableSlots({
      date: dateStr,
      serviceDurationMinutes: durationMinutes || 60,
      appointments: existingAppointments,
      services,
      profile,
      blockedDays,
    });

    if (!availableSlots.includes(timeSlot)) {
      return NextResponse.json({
        error: 'Lo sentimos, este horario acaba de ser ocupado. Por favor, selecciona otra hora libre.'
      }, { status: 409 });
    }

    // 3. Actualizar o crear ficha del cliente en Firestore
    const existingClients = cloudData.clients || [];
    let clientFound = false;
    let targetClientId = '';
    const updatedClients = [...existingClients];

    for (let i = 0; i < updatedClients.length; i++) {
      const c = updatedClients[i];
      const cPhoneClean = (c.phone || '').replace(/\D/g, '');
      if (cPhoneClean.endsWith(cleanPhone.slice(-9))) {
        clientFound = true;
        targetClientId = c.id;
        // Si no tenía email guardado y ahora sí, actualizar
        if (clientEmail && !c.details?.includes(clientEmail)) {
          c.details = (c.details ? c.details + ' ' : '') + `[Email: ${clientEmail}]`;
        }
        break;
      }
    }

    if (!clientFound) {
      targetClientId = 'cli_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const nameParts = clientName.trim().split(' ');
      const firstName = nameParts[0] || clientName;
      const lastName = nameParts.slice(1).join(' ') || '';

      updatedClients.push({
        id: targetClientId,
        name: firstName,
        lastName: lastName,
        phone: clientPhone.trim(),
        details: clientEmail ? `Email: ${clientEmail.trim()}` : '',
      });
    }

    // 4. Crear el objeto de cita con hora UTC exacta convertida desde Madrid y clientId asignado
    const appointmentDateTimeIso = madridDateTimeToUtc(dateStr, timeSlot);
    const newAppointmentId = 'apt_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newAppointment = {
      id: newAppointmentId,
      clientId: targetClientId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail?.trim() || '',
      dateTime: appointmentDateTimeIso,
      notes: notes?.trim() || '',
      reminderSent: false,
      status: 'scheduled',
      serviceId: serviceId || 'direct_booking',
      serviceName: serviceTitle,
      servicePrice: price || 0,
      duration: durationMinutes || 60,
      source: 'web_direct',
      createdAt: new Date().toISOString(),
    };

    // 5. Guardado atómico en Firestore
    const updatedAppointments = [...existingAppointments, newAppointment];

    await setDoc(syncDocRef, {
      appointments: updatedAppointments,
      clients: updatedClients,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Reserva confirmada con éxito',
      appointment: newAppointment,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error al procesar reserva directa:', error);
    return NextResponse.json({ error: error.message || 'Error interno al registrar la reserva.' }, { status: 500 });
  }
}
