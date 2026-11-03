import { NextResponse } from 'next/server';

/**
 * Endpoint legado de Cal.com.
 * QuiroAgenda ahora utiliza su propio motor de reservas nativo en /api/booking y /api/availability.
 */
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Cal.com integration has been replaced by native QuiroAgenda booking engine.',
    bookings: []
  });
}

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook recibido. La integración directa de QuiroAgenda está activa en /reservas.' 
  });
}
