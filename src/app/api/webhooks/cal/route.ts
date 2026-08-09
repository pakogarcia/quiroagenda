import { NextResponse } from 'next/server';

// In-memory queue for incoming Cal.com webhooks
let pendingBookings: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Cal.com sends event type in triggerEvent or type
    const triggerEvent = body.triggerEvent || body.type;

    if (triggerEvent === 'BOOKING_CREATED' || triggerEvent === 'booking.created') {
      const payload = body.payload || body;
      
      const startTime = payload.startTime || payload.start;
      
      let name = 'Cliente Cal.com';
      let phone = '';

      if (payload.responses) {
        if (payload.responses.name?.value) name = payload.responses.name.value;
        if (payload.responses.phone?.value) phone = payload.responses.phone.value;
      }
      
      if ((!name || name === 'Cliente Cal.com') && payload.attendees && payload.attendees.length > 0) {
        name = payload.attendees[0].name || name;
      }

      const bookingItem = {
        id: 'cal_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        clientName: name,
        clientPhone: phone || 'Sin teléfono',
        dateTime: startTime,
        notes: `[Reserva Online Cal.com] ${payload.title || ''} ${payload.description || ''}`.trim(),
        reminderSent: false,
        status: 'scheduled',
        serviceName: payload.title || 'Reserva Online',
      };

      pendingBookings.push(bookingItem);

      return NextResponse.json({ success: true, message: 'Booking received', booking: bookingItem });
    }

    return NextResponse.json({ success: true, message: 'Event type ignored' });
  } catch (error: any) {
    console.error('Error processing Cal.com webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const items = [...pendingBookings];
  pendingBookings = []; // Drain queue on fetch
  return NextResponse.json({ bookings: items });
}
