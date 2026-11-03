import { parseISO } from 'date-fns';
import type { Appointment, BusinessProfile, Service } from './types';
import { getDaySchedule } from './schedule';

export interface TimeSlotAvailability {
  time: string;       // Formato 'HH:mm'
  available: boolean; // true si cabe el servicio completo
}

export const TIMEZONE = 'Europe/Madrid';

/**
 * Convierte "HH:mm" a minutos desde las 00:00 (ej. "08:30" -> 510)
 */
export function timeStrToMinutes(str: string): number {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convierte minutos desde las 00:00 a formato "HH:mm" (ej. 510 -> "08:30")
 */
export function minutesToTimeStr(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Obtiene la fecha YYYY-MM-DD y la hora HH:mm exacta en la zona horaria del gabinete (Europe/Madrid).
 * Es inmune a si el servidor se ejecuta en UTC, Estados Unidos o local.
 */
export function getAppointmentMadridDetails(dateTime: string | Date) {
  const d = new Date(dateTime);
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // 'YYYY-MM-DD'
  const timeStr = d.toLocaleTimeString('es-ES', { 
    timeZone: TIMEZONE, 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  const [h, m] = timeStr.split(':').map(Number);
  return { dateStr, timeStr, startMin: h * 60 + m };
}

/**
 * Convierte una fecha YYYY-MM-DD y una hora HH:mm en horario de Madrid
 * a su cadena ISO UTC exacta para almacenar en base de datos.
 */
export function madridDateTimeToUtc(dateStr: string, timeStr: string): string {
  const guess = new Date(`${dateStr}T${timeStr}:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(guess);
  
  const mParts: Record<string, string> = {};
  parts.forEach(p => mParts[p.type] = p.value);
  const madridHour = parseInt(mParts.hour, 10);
  const targetHour = parseInt(timeStr.split(':')[0], 10);
  const offsetHours = madridHour - targetHour;
  
  const utcDate = new Date(guess.getTime() - offsetHours * 3600000);
  return utcDate.toISOString();
}

/**
 * Motor central de disponibilidad de QuiroAgenda:
 * Calcula las franjas horarias libres considerando:
 * 1. Zona horaria de España (Europe/Madrid) exacta, tanto en cliente como en servidor UTC.
 * 2. Horario semanal configurado por día de la semana (Lunes a Domingo, turnos Mañana y Tarde).
 * 3. Duración real del servicio solicitado y de cada cita previa existente.
 * 4. Detección matemática de solapamientos sin fisuras ni desfases.
 * 5. Días festivos/inhábiles y períodos de vacaciones.
 */
export function calculateAvailableSlots({
  date,
  serviceDurationMinutes,
  appointments,
  services,
  profile,
  blockedDays,
}: {
  date: Date | string;
  serviceDurationMinutes: number;
  appointments: Appointment[];
  services?: Service[];
  profile: BusinessProfile | null;
  blockedDays: string[];
}): string[] {
  // 1. Normalizar la fecha a evaluar en hora de Madrid
  const targetDateObj = typeof date === 'string' ? parseISO(date) : date;
  const targetDateStr = typeof date === 'string' 
    ? date 
    : targetDateObj.toLocaleDateString('en-CA', { timeZone: TIMEZONE });

  // Comprobar si la fecha es pasada con respecto a hoy en Madrid
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  if (targetDateStr < todayStr) return [];

  // Comprobar días bloqueados/inhábiles
  if (blockedDays.includes(targetDateStr)) return [];

  // Comprobar vacaciones
  if (profile?.vacations) {
    for (const vac of profile.vacations) {
      const fromStr = new Date(vac.from).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
      const toStr = new Date(vac.to).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
      if (targetDateStr >= fromStr && targetDateStr <= toStr) return [];
    }
  }

  // 2. Obtener horario configurado para este día específico de la semana (Lunes a Domingo)
  const daySchedule = getDaySchedule(profile, targetDateObj);
  if (!daySchedule || !daySchedule.enabled) {
    return []; // Gabinete cerrado este día
  }

  // 3. Procesar las citas activas del día con su duración real en minutos
  const dayAppointments = appointments
    .filter((apt) => apt.status !== 'no-show')
    .map((apt) => {
      const { dateStr, timeStr, startMin } = getAppointmentMadridDetails(apt.dateTime);
      // Duración: 1) directa en apt, 2) del servicio correspondiente, 3) fallback a 60 min
      const duration = apt.duration 
        || (services ? services.find((s) => s.id === apt.serviceId)?.duration : undefined) 
        || 60;
      return {
        dateStr,
        timeStr,
        startMin,
        endMin: startMin + duration,
      };
    })
    .filter((apt) => apt.dateStr === targetDateStr);

  // 4. Evaluar los turnos de trabajo configurados
  const shifts = [daySchedule.morning, daySchedule.afternoon];
  const availableSlots: string[] = [];

  // Antelación mínima configurada en horas (por defecto 6 horas si no está definida)
  const minNoticeHours = typeof profile?.minNoticeHours === 'number' ? profile.minNoticeHours : 6;
  const minNoticeMs = Math.max(0, minNoticeHours) * 60 * 60 * 1000;
  const cutoffTimestamp = Date.now() + minNoticeMs;

  for (const shift of shifts) {
    if (!shift.enabled || !shift.start || !shift.end || shift.start === shift.end) continue;

    const shiftStartMin = timeStrToMinutes(shift.start);
    const shiftEndMin = timeStrToMinutes(shift.end);

    // Iterar cada 15 minutos comprobando si cabe el servicio completo
    for (
      let slotStartMin = shiftStartMin; 
      slotStartMin + serviceDurationMinutes <= shiftEndMin; 
      slotStartMin += 15
    ) {
      const slotTimeStr = minutesToTimeStr(slotStartMin);
      const slotEndMin = slotStartMin + serviceDurationMinutes;

      // Descartar si el slot está dentro del margen de antelación mínima exigida
      const slotUtcIso = madridDateTimeToUtc(targetDateStr, slotTimeStr);
      const slotTimestamp = new Date(slotUtcIso).getTime();
      if (slotTimestamp < cutoffTimestamp) {
        continue;
      }

      // Regla matemática de no-colisión de intervalos: (A_start < B_end) && (B_start < A_end)
      const collides = dayAppointments.some(
        (apt) => slotStartMin < apt.endMin && apt.startMin < slotEndMin
      );

      if (!collides) {
        availableSlots.push(slotTimeStr);
      }
    }
  }

  return availableSlots;
}
