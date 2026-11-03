import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { calculateAvailableSlots } from '@/lib/availability';
import { parseISO } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date'); // 'YYYY-MM-DD'
    const duration = parseInt(searchParams.get('duration') || '60', 10);

    if (!dateStr) {
      return NextResponse.json({ error: 'Falta el parámetro date (YYYY-MM-DD)' }, { status: 400 });
    }

    const date = parseISO(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
    }

    // Consultar datos reales de Firestore
    const mainDocRef = doc(db, 'gabinete_data', 'main');
    const docSnap = await getDoc(mainDocRef);

    const appointments = docSnap.exists() ? docSnap.data().appointments || [] : [];
    const services = docSnap.exists() ? docSnap.data().services || [] : [];
    const profile = docSnap.exists() ? docSnap.data().profile || null : null;
    const blockedDays = docSnap.exists() ? docSnap.data().blockedDays || [] : [];

    // Calcular huecos con el motor inteligente blindado en zona horaria de España
    const slots = calculateAvailableSlots({
      date: dateStr,
      serviceDurationMinutes: duration,
      appointments,
      services,
      profile,
      blockedDays,
    });

    return NextResponse.json({
      date: dateStr,
      durationMinutes: duration,
      availableSlots: slots,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error calculando disponibilidad:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
