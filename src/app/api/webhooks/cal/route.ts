import { NextResponse } from 'next/server';

// In-memory queue for incoming Cal.com webhooks
let pendingBookings: any[] = [];

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Handled if body is empty or non-JSON ping
    }
    
    // Cal.com sends event type in triggerEvent or type
    const triggerEvent = (body.triggerEvent || body.type || 'PING').toString().toUpperCase();

    if (triggerEvent === 'PING') {
      return NextResponse.json({ success: true, message: 'Cal.com Webhook Ping OK' }, { status: 200 });
    }

    if (triggerEvent === 'BOOKING_CREATED' || triggerEvent === 'BOOKING.CREATED') {
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

      return NextResponse.json({ success: true, message: 'Booking received', booking: bookingItem }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: `Event type ${triggerEvent} received OK` }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing Cal.com webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isSync = searchParams.get('sync') === '1' || searchParams.get('poll') === '1';

  const items = [...pendingBookings];
  if (isSync) {
    pendingBookings = []; // Drain queue when app polls
  }

  return NextResponse.json({ 
    status: 'ok', 
    service: 'QuiroAgenda Cal.com Webhook',
    bookings: items 
  }, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
