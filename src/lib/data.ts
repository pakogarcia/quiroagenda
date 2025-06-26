import type { Appointment } from '@/lib/types';
import { subDays, addDays, set } from 'date-fns';

const now = new Date();

export const initialAppointments: Appointment[] = [
  {
    id: '1',
    clientName: 'Elena Rodríguez',
    clientPhone: '+34600112233',
    dateTime: set(now, { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
    notes: 'Focus on lower back and shoulders. Client reported some tension.',
    reminderSent: true,
  },
  {
    id: '2',
    clientName: 'Carlos Gómez',
    clientPhone: '+34611223344',
    dateTime: set(now, { hours: 12, minutes: 30, seconds: 0, milliseconds: 0 }),
    notes: 'General relaxation massage. No specific issues.',
    reminderSent: false,
  },
  {
    id: '3',
    clientName: 'Ana Pérez',
    clientPhone: '+34622334455',
    dateTime: set(now, { hours: 16, minutes: 0, seconds: 0, milliseconds: 0 }),
    notes: 'Deep tissue for legs, post-marathon.',
    reminderSent: false,
  },
  {
    id: '4',
    clientName: 'Javier Fernández',
    clientPhone: '+34633445566',
    dateTime: set(subDays(now, 1), { hours: 11, minutes: 0, seconds: 0, milliseconds: 0 }),
    notes: 'Client is a regular, standard session.',
    reminderSent: true,
  },
    {
    id: '5',
    clientName: 'Lucía Morales',
    clientPhone: '+34644556677',
    dateTime: set(addDays(now, 1), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
    notes: 'First time client. Consultation needed.',
    reminderSent: false,
  },
  {
    id: '6',
    clientName: 'Miguel Santos',
    clientPhone: '+34655667788',
    dateTime: set(addDays(now, 1), { hours: 14, minutes: 0, seconds: 0, milliseconds: 0 }),
    notes: 'Follow-up for neck pain.',
    reminderSent: false,
  },
];
