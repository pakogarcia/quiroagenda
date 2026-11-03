import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { calculateAvailableSlots, TIMEZONE } from '@/lib/availability';
import { parseISO, startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date'); // 'YYYY-MM-DD'
    const duration = parseInt(searchParams.get('duration') || '60', 10);

    const now = new Date();
    const todayMadridStr = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    const targetDateStr = dateStr || todayMadridStr;

    const parsedTargetDate = parseISO(targetDateStr);
    const baseDate = isNaN(parsedTargetDate.getTime()) ? now : parsedTargetDate;

    // Consultar datos reales de Firestore una sola vez
    const mainDocRef = doc(db, 'gabinete_data', 'main');
    const docSnap = await getDoc(mainDocRef);

    const appointments = docSnap.exists() ? docSnap.data().appointments || [] : [];
    const services = docSnap.exists() ? docSnap.data().services || [] : [];
    const profile = docSnap.exists() ? docSnap.data().profile || null : null;
    const blockedDays: string[] = docSnap.exists() ? docSnap.data().blockedDays || [] : [];

    // Calcular días no disponibles cubriendo el mes actual y el mes siguiente (al menos 60 días)
    const rangeStart = startOfMonth(baseDate);
    const rangeEnd = endOfMonth(addMonths(baseDate, 1));
    const allDaysInRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

    const unavailableDates: string[] = [];

    for (const d of allDaysInRange) {
      const dStr = format(d, 'yyyy-MM-dd');
      
      // Pasado con respecto a hoy en Madrid
      if (dStr < todayMadridStr) {
        unavailableDates.push(dStr);
        continue;
      }

      // Festivo o inhábil
      if (blockedDays.includes(dStr)) {
        unavailableDates.push(dStr);
        continue;
      }

      // Comprobar huecos libres para la duración solicitada
      const slots = calculateAvailableSlots({
        date: dStr,
        serviceDurationMinutes: duration,
        appointments,
        services,
        profile,
        blockedDays,
      });

      if (slots.length === 0) {
        unavailableDates.push(dStr);
      }
    }

    // Calcular franjas horarias libres para el día seleccionado
    const availableSlots = calculateAvailableSlots({
      date: targetDateStr,
      serviceDurationMinutes: duration,
      appointments,
      services,
      profile,
      blockedDays,
    });

    return NextResponse.json({
      date: targetDateStr,
      durationMinutes: duration,
      availableSlots,
      unavailableDates,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error calculando disponibilidad:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
