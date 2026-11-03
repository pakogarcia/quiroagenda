import { format, isSameDay, set, addMinutes, isBefore, startOfToday, parseISO } from 'date-fns';
import type { Appointment, BusinessProfile } from './types';

export interface TimeSlotAvailability {
  time: string;       // Formato 'HH:mm'
  available: boolean; // true si cabe el servicio completo
}

/**
 * Motor central de disponibilidad: calcula las franjas horarias libres
 * considerando horario laboral, descansos, citas activas, vacaciones y días bloqueados.
 */
export function calculateAvailableSlots({
  date,
  serviceDurationMinutes,
  appointments,
  profile,
  blockedDays,
}: {
  date: Date;
  serviceDurationMinutes: number;
  appointments: Appointment[];
  profile: BusinessProfile | null;
  blockedDays: string[];
}): string[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  const today = startOfToday();

  // 1. Si la fecha es pasada, o es un día bloqueado o está en vacaciones -> 0 disponibilidad
  if (isBefore(date, today)) return [];
  if (blockedDays.includes(dateStr)) return [];

  if (profile?.vacations) {
    for (const vac of profile.vacations) {
      const from = parseISO(vac.from);
      const to = parseISO(vac.to);
      if (date >= from && date <= to) return [];
    }
  }

  // 2. Obtener horarios de mañana y tarde (por defecto 09:00-14:00 y 16:00-20:00)
  const openingHours = profile?.openingHours;
  const morning = openingHours?.morning || { start: '09:00', end: '14:00', enabled: true };
  const afternoon = openingHours?.afternoon || { start: '16:00', end: '20:00', enabled: true };

  // 3. Filtrar citas del día que ocupen tiempo (scheduled o completed)
  const dayAppointments = appointments.filter((apt) => {
    if (apt.status === 'no-show') return false;
    const aptDate = new Date(apt.dateTime);
    return isSameDay(aptDate, date);
  });

  const availableSlots: string[] = [];
  const intervalMinutes = 15; // Fraccionamiento mínimo de 15 minutos

  const evaluatePeriod = (startStr: string, endStr: string, isEnabled: boolean) => {
    if (!isEnabled || !startStr || !endStr || startStr === endStr) return;

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    let currentSlot = set(date, { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
    const periodEnd = set(date, { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });

    while (isBefore(currentSlot, periodEnd)) {
      const slotEnd = addMinutes(currentSlot, serviceDurationMinutes);

      // El masaje completo debe terminar antes o justo a la hora de cierre del turno
      if (slotEnd <= periodEnd) {
        // Si es el día de hoy, el hueco debe ser en el futuro (mínimo 30 minutos de antelación)
        const isPastNow = isSameDay(date, new Date()) && isBefore(currentSlot, addMinutes(new Date(), 30));

        if (!isPastNow) {
          // Comprobar si solapa con alguna cita existente
          let collides = false;

          for (const apt of dayAppointments) {
            const aptStart = new Date(apt.dateTime);
            // Duración de la cita existente (si no viene especificada, estimamos 60 min)
            const aptDuration = 60; 
            const aptEnd = addMinutes(aptStart, aptDuration);

            // Regla de colisión de intervalos: (A_start < B_end) && (B_start < A_end)
            if (isBefore(currentSlot, aptEnd) && isBefore(aptStart, slotEnd)) {
              collides = true;
              break;
            }
          }

          if (!collides) {
            availableSlots.push(format(currentSlot, 'HH:mm'));
          }
        }
      }

      currentSlot = addMinutes(currentSlot, intervalMinutes);
    }
  };

  evaluatePeriod(morning.start, morning.end, morning.enabled);
  evaluatePeriod(afternoon.start, afternoon.end, afternoon.enabled);

  return availableSlots;
}
