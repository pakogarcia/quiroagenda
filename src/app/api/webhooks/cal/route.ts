import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

// In-memory fallback queue for instant local sync
let pendingBookingsMemory: any[] = [];

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

    // Support all booking creation/request/payment/reschedule events
    if (
      triggerEvent.includes('BOOKING') || 
      triggerEvent.includes('CREATED') || 
      triggerEvent.includes('RESCHEDULED') ||
      triggerEvent.includes('REQUESTED')
    ) {
      const payload = body.payload || body;
      
      const startTime = payload.startTime || payload.start || new Date().toISOString();
      
      let name = '';
      let phone = '';
      let email = '';

      // 1. Extract from Cal.com custom form responses
      if (payload.responses) {
        if (payload.responses.name?.value) name = payload.responses.name.value;
        if (payload.responses.Name?.value) name = payload.responses.Name.value;
        if (payload.responses.phone?.value) phone = payload.responses.phone.value;
        if (payload.responses.phoneNumber?.value) phone = payload.responses.phoneNumber.value;
        if (payload.responses.phone_number?.value) phone = payload.responses.phone_number.value;
        if (payload.responses.email?.value) email = payload.responses.email.value;
      }
      
      // 2. Fallback to attendees array
      if (payload.attendees && payload.attendees.length > 0) {
        const primaryAttendee = payload.attendees[0];
        if (!name && primaryAttendee.name) name = primaryAttendee.name;
        if (!phone && (primaryAttendee.phone || primaryAttendee.phoneNumber)) {
          phone = primaryAttendee.phone || primaryAttendee.phoneNumber;
        }
        if (!email && primaryAttendee.email) email = primaryAttendee.email;
      }

      // 3. Fallback to top-level fields
      if (!name && payload.name) name = payload.name;
      if (!phone && payload.phone) phone = payload.phone;
      if (!email && payload.email) email = payload.email;

      // Final fallback defaults
      if (!name) name = 'Cliente Cal.com';
      if (!phone) phone = 'Sin teléfono';

      const bookingId = payload.uid || payload.id ? String(payload.uid || payload.id) : ('cal_' + Date.now() + '_' + Math.floor(Math.random() * 1000));

      const bookingItem = {
        id: bookingId,
        clientName: name.trim(),
        clientPhone: phone.trim(),
        clientEmail: email.trim(),
        dateTime: startTime,
        notes: `[Reserva Online Cal.com] ${payload.title || ''} ${payload.description || ''}`.trim(),
        reminderSent: false,
        status: 'scheduled',
        serviceName: payload.title || 'Reserva Online',
        createdAt: new Date().toISOString(),
        processed: false
      };

      // Add to in-memory queue
      pendingBookingsMemory.push(bookingItem);

      // Persist to Cloud Firestore so it is NEVER lost on server restart/cold starts
      try {
        await addDoc(collection(db, 'cal_webhooks'), bookingItem);
      } catch (fsErr) {
        console.warn('Could not persist webhook to Firestore (using memory fallback):', fsErr);
      }

      return NextResponse.json({ success: true, message: 'Booking received and stored', booking: bookingItem }, { status: 200 });
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

  let allBookings: any[] = [...pendingBookingsMemory];

  // Also fetch unprocessed webhooks from Firestore
  try {
    const q = query(collection(db, 'cal_webhooks'), where('processed', '==', false));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Avoid memory duplicates if already in memory
      if (!allBookings.some((b) => b.id === data.id)) {
        allBookings.push({ ...data, firestoreDocId: docSnap.id });
      }
    });

    if (isSync) {
      // Mark fetched webhooks as processed in Firestore
      const updatePromises = querySnapshot.docs.map((docSnap) =>
        updateDoc(doc(db, 'cal_webhooks', docSnap.id), { processed: true })
      );
      await Promise.all(updatePromises);
      // Drain in-memory queue
      pendingBookingsMemory = [];
    }
  } catch (fsErr) {
    console.warn('Firestore fetch failed in GET /api/webhooks/cal:', fsErr);
    if (isSync) {
      pendingBookingsMemory = [];
    }
  }

  return NextResponse.json({ 
    status: 'ok', 
    service: 'QuiroAgenda Cal.com Webhook',
    bookings: allBookings 
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
