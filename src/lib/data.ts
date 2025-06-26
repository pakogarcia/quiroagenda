import type { Appointment } from '@/lib/types';
import { subDays, addDays, set } from 'date-fns';

export const getInitialAppointments = (): Appointment[] => {
  const now = new Date();

  return [
    {
      id: '1',
      clientName: 'Elena Rodríguez',
      clientPhone: '+34600112233',
      dateTime: set(now, { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
      notes: 'Foco en la espalda baja y hombros. El cliente reportó algo de tensión.',
      reminderSent: true,
    },
    {
      id: '2',
      clientName: 'Carlos Gómez',
      clientPhone: '+34611223344',
      dateTime: set(now, { hours: 12, minutes: 30, seconds: 0, milliseconds: 0 }),
      notes: 'Masaje de relajación general. Sin problemas específicos.',
      reminderSent: false,
    },
    {
      id: '3',
      clientName: 'Ana Pérez',
      clientPhone: '+34622334455',
      dateTime: set(now, { hours: 16, minutes: 0, seconds: 0, milliseconds: 0 }),
      notes: 'Masaje de tejido profundo para piernas, post-maratón.',
      reminderSent: false,
    },
    {
      id: '4',
      clientName: 'Javier Fernández',
      clientPhone: '+34633445566',
      dateTime: set(subDays(now, 1), { hours: 11, minutes: 0, seconds: 0, milliseconds: 0 }),
      notes: 'Cliente regular, sesión estándar.',
      reminderSent: true,
    },
      {
      id: '5',
      clientName: 'Lucía Morales',
      clientPhone: '+34644556677',
      dateTime: set(addDays(now, 1), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
      notes: 'Cliente nuevo. Se necesita consulta.',
      reminderSent: false,
    },
    {
      id: '6',
      clientName: 'Miguel Santos',
      clientPhone: '+34655667788',
      dateTime: set(addDays(now, 1), { hours: 14, minutes: 0, seconds: 0, milliseconds: 0 }),
      notes: 'Seguimiento por dolor de cuello.',
      reminderSent: false,
    },
  ];
};
