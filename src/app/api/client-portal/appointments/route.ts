import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateAvailableSlots, madridDateTimeToUtc, getAppointmentMadridDetails } from '@/lib/availability';
import { normalizePhone, verifyClientSessionToken } from '@/lib/client-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, clientId, appointmentId, token, reason, newDateStr, newTimeSlot } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Identificador de cita no proporcionado.' }, { status: 400 });
    }

    // Blindaje de seguridad: Verificación de token criptográfico de sesión firmado
    const tokenResult = verifyClientSessionToken(token, clientId, phone);
    if (!tokenResult.valid) {
      return NextResponse.json({
        error: 'Sesión no válida o expirada. Por favor, introduce tu PIN de nuevo en el Área de Clientes.'
      }, { status: 401 });
    }

    const syncDocRef = doc(db, 'gabinete_data', 'main');
    const docSnap = await getDoc(syncDocRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Base de datos no disponible.' }, { status: 500 });
    }

    const data = docSnap.data();
    const appointments: any[] = data.appointments || [];
    const clients: any[] = data.clients || [];
    const profile = data.profile || null;
    const services = data.services || [];
    const blockedDays = data.blockedDays || [];

    // Buscar la cita
    const aptIndex = appointments.findIndex((a) => a.id === appointmentId);
    if (aptIndex === -1) {
      return NextResponse.json({ error: 'Cita no encontrada o ya cancelada.' }, { status: 404 });
    }
    const apt = appointments[aptIndex];

    // Verificar propiedad de la cita
    const normTarget = normalizePhone(phone);
    const aptPhoneNorm = normalizePhone(apt.clientPhone);
    const clientMatches = (apt.clientId && apt.clientId === clientId) || (normTarget && aptPhoneNorm === normTarget);

    if (!clientMatches) {
      return NextResponse.json({ error: 'No tienes autorización para gestionar esta cita.' }, { status: 403 });
    }

    const minNoticeHours = typeof profile?.minNoticeHours === 'number' ? profile.minNoticeHours : 6;
    const minNoticeMs = Math.max(0, minNoticeHours) * 60 * 60 * 1000;
    const now = Date.now();

    // 1. CANCELACIÓN DE CITA
    if (action === 'cancel') {
      const aptTimestamp = new Date(apt.dateTime).getTime();
      if (aptTimestamp < now + minNoticeMs) {
        return NextResponse.json({
          error: `Las cancelaciones online requieren un mínimo de ${minNoticeHours} horas de antelación. Por favor, escribe directamente a Pako por WhatsApp si se trata de un imprevisto urgente.`
        }, { status: 400 });
      }

      // Eliminar cita del listado
      const updatedAppointments = appointments.filter((a) => a.id !== appointmentId);
      await setDoc(syncDocRef, {
        appointments: updatedAppointments,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Notificación instantánea a Telegram de Pako
      const notif = profile?.notifications;
      if (notif?.telegramBotToken && notif?.telegramChatId) {
        try {
          const aptDate = new Date(apt.dateTime);
          const fechaStr = format(aptDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
          const { timeStr } = getAppointmentMadridDetails(apt.dateTime);
          const cleanPhone = (apt.clientPhone || '').replace(/\D/g, '');

          const telegramText =
            `⚠️ <b>CANCELACIÓN DE CITA ONLINE</b>\n\n` +
            `👤 <b>Cliente:</b> ${apt.clientName}\n` +
            `📞 <b>Teléfono:</b> <a href="tel:${cleanPhone}">${apt.clientPhone}</a>\n` +
            `💆 <b>Servicio:</b> ${apt.serviceName || 'Quiromasaje'}\n` +
            `📅 <b>Fecha Cancelada:</b> ${fechaStr}\n` +
            `⏰ <b>Hora:</b> ${timeStr} h\n` +
            (reason ? `📝 <b>Motivo:</b> <i>${reason.trim()}</i>\n` : '') +
            `\n💡 <i>El hueco de las ${timeStr}h ha quedado liberado automáticamente en tu agenda para otros pacientes.</i>\n\n` +
            `💬 <a href="https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(apt.clientName)},%20he%20recibido%20tu%20cancelaci%C3%B3n%20para%20la%20cita%20del%20${encodeURIComponent(fechaStr)}.">Escribir al cliente por WhatsApp</a>\n` +
            `📅 <a href="https://citas.pakogarcia.es/admin">Abrir QuiroAgenda</a>`;

          await fetch(`https://api.telegram.org/bot${notif.telegramBotToken.trim()}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: notif.telegramChatId.trim(),
              text: telegramText,
              parse_mode: 'HTML',
            }),
          });
        } catch (tgErr) {
          console.error('Error enviando notificación de cancelación a Telegram:', tgErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Tu cita ha sido cancelada correctamente.',
        appointmentId,
      });
    }

    // 2. REPROGRAMACIÓN (CAMBIO DE CITA)
    if (action === 'reschedule') {
      if (!newDateStr || !newTimeSlot) {
        return NextResponse.json({ error: 'Debes seleccionar el nuevo día y hora.' }, { status: 400 });
      }

      // Validar antelación sobre la cita actual
      const currentTimestamp = new Date(apt.dateTime).getTime();
      if (currentTimestamp < now + minNoticeMs) {
        return NextResponse.json({
          error: `Los cambios de cita online requieren al menos ${minNoticeHours} horas de antelación sobre la cita actual. Contacta con Pako por WhatsApp para urgencias.`
        }, { status: 400 });
      }

      // Validar antelación sobre la nueva fecha y hora
      const newSlotUtcIso = madridDateTimeToUtc(newDateStr, newTimeSlot);
      const newSlotTimestamp = new Date(newSlotUtcIso).getTime();
      if (newSlotTimestamp < now + minNoticeMs) {
        return NextResponse.json({
          error: `La nueva cita debe programarse con al menos ${minNoticeHours} horas de antelación.`
        }, { status: 400 });
      }

      // Validar disponibilidad del nuevo hueco (excluyendo la cita que estamos moviendo)
      const duration = apt.duration || 60;
      const otherAppointments = appointments.filter((a) => a.id !== appointmentId);
      const availableSlots = calculateAvailableSlots({
        date: newDateStr,
        serviceDurationMinutes: duration,
        appointments: otherAppointments,
        services,
        profile,
        blockedDays,
      });

      if (!availableSlots.includes(newTimeSlot)) {
        return NextResponse.json({
          error: 'El horario seleccionado ya no está disponible. Por favor, elige otra hora.'
        }, { status: 409 });
      }

      // Guardar datos anteriores para la notificación
      const oldDate = new Date(apt.dateTime);
      const oldFechaStr = format(oldDate, "EEEE, d 'de' MMMM", { locale: es });
      const { timeStr: oldTimeStr } = getAppointmentMadridDetails(apt.dateTime);

      // Actualizar la cita
      const updatedApt = {
        ...apt,
        dateTime: newSlotUtcIso,
        updatedAt: new Date().toISOString(),
      };

      const updatedAppointments = appointments.map((a) => (a.id === appointmentId ? updatedApt : a));

      await setDoc(syncDocRef, {
        appointments: updatedAppointments,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Notificación instantánea a Telegram de Pako
      const notif = profile?.notifications;
      if (notif?.telegramBotToken && notif?.telegramChatId) {
        try {
          const parsedNewDate = parseISO(newDateStr);
          const newFechaStr = format(parsedNewDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
          const cleanPhone = (apt.clientPhone || '').replace(/\D/g, '');

          const telegramText =
            `🔄 <b>CAMBIO DE CITA ONLINE</b>\n\n` +
            `👤 <b>Cliente:</b> ${apt.clientName}\n` +
            `📞 <b>Teléfono:</b> <a href="tel:${cleanPhone}">${apt.clientPhone}</a>\n` +
            `💆 <b>Servicio:</b> ${apt.serviceName || 'Quiromasaje'}\n` +
            `❌ <b>Cita anterior:</b> ${oldFechaStr} a las ${oldTimeStr} h\n` +
            `✅ <b>Nueva cita:</b> ${newFechaStr} a las ${newTimeSlot} h\n` +
            `\n💡 <i>Tu agenda se ha actualizado automáticamente con la nueva fecha y hora.</i>\n\n` +
            `💬 <a href="https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(apt.clientName)},%20he%20confirmado%20el%20cambio%20de%20tu%20cita%20para%20el%20${encodeURIComponent(newFechaStr)}%20a%20las%20${newTimeSlot}h.">Escribir al cliente por WhatsApp</a>\n` +
            `📅 <a href="https://citas.pakogarcia.es/admin">Abrir QuiroAgenda</a>`;

          await fetch(`https://api.telegram.org/bot${notif.telegramBotToken.trim()}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: notif.telegramChatId.trim(),
              text: telegramText,
              parse_mode: 'HTML',
            }),
          });
        } catch (tgErr) {
          console.error('Error enviando notificación de cambio de cita a Telegram:', tgErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Tu cita ha sido cambiada con éxito.',
        appointment: updatedApt,
      });
    }

    return NextResponse.json({ error: 'Acción no soportada.' }, { status: 400 });

  } catch (error: any) {
    console.error('Error en gestión de citas del portal de clientes:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor.' }, { status: 500 });
  }
}
