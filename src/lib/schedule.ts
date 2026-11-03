import type { BusinessProfile, DaySchedule, DayOfWeek, WeeklySchedule } from './types';

export const DAYS_OF_WEEK_CONFIG: {
  key: DayOfWeek;
  label: string;
  short: string;
  dayIndex: number; // 0 = Domingo, 1 = Lunes, etc.
}[] = [
  { key: 'monday', label: 'Lunes', short: 'Lun', dayIndex: 1 },
  { key: 'tuesday', label: 'Martes', short: 'Mar', dayIndex: 2 },
  { key: 'wednesday', label: 'Miércoles', short: 'Mié', dayIndex: 3 },
  { key: 'thursday', label: 'Jueves', short: 'Jue', dayIndex: 4 },
  { key: 'friday', label: 'Viernes', short: 'Vie', dayIndex: 5 },
  { key: 'saturday', label: 'Sábado', short: 'Sáb', dayIndex: 6 },
  { key: 'sunday', label: 'Domingo', short: 'Dom', dayIndex: 0 },
];

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: {
    enabled: true,
    morning: { start: '08:30', end: '14:00', enabled: true },
    afternoon: { start: '16:30', end: '20:30', enabled: true },
  },
  tuesday: {
    enabled: true,
    morning: { start: '08:30', end: '14:00', enabled: true },
    afternoon: { start: '16:30', end: '20:30', enabled: true },
  },
  wednesday: {
    enabled: true,
    morning: { start: '08:30', end: '14:00', enabled: true },
    afternoon: { start: '16:30', end: '20:30', enabled: true },
  },
  thursday: {
    enabled: true,
    morning: { start: '08:30', end: '14:00', enabled: true },
    afternoon: { start: '16:30', end: '20:30', enabled: true },
  },
  friday: {
    enabled: true,
    morning: { start: '08:30', end: '14:00', enabled: true },
    afternoon: { start: '16:30', end: '20:30', enabled: true },
  },
  saturday: {
    enabled: true,
    morning: { start: '09:00', end: '14:00', enabled: true },
    afternoon: { start: '16:00', end: '20:00', enabled: false },
  },
  sunday: {
    enabled: false,
    morning: { start: '09:00', end: '14:00', enabled: false },
    afternoon: { start: '16:00', end: '20:00', enabled: false },
  },
};

/**
 * Obtiene el horario configurado para una fecha específica (según su día de la semana).
 * Soporta tanto profile.weeklySchedule como compatibilidad con profile.openingHours antiguo.
 */
export function getDaySchedule(profile: BusinessProfile | null | undefined, date: Date): DaySchedule | null {
  const dayIndex = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const dayConfig = DAYS_OF_WEEK_CONFIG.find(d => d.dayIndex === dayIndex);
  if (!dayConfig) return null;

  // 1. Si existe weeklySchedule configurado para este día
  if (profile?.weeklySchedule && profile.weeklySchedule[dayConfig.key]) {
    const schedule = profile.weeklySchedule[dayConfig.key];
    return schedule;
  }

  // 2. Fallback a profile.openingHours heredado
  const legacyMorning = profile?.openingHours?.morning || { start: '08:30', end: '14:00', enabled: true };
  const legacyAfternoon = profile?.openingHours?.afternoon || { start: '16:30', end: '20:30', enabled: true };

  // Domingo cerrado por defecto en fallback
  if (dayIndex === 0) {
    return {
      enabled: false,
      morning: { ...legacyMorning, enabled: false },
      afternoon: { ...legacyAfternoon, enabled: false },
    };
  }

  // Sábado: por defecto mañana activa si hay citas o según legacy
  if (dayIndex === 6) {
    return {
      enabled: true,
      morning: { start: '09:00', end: '14:00', enabled: true },
      afternoon: { start: '16:00', end: '20:00', enabled: false },
    };
  }

  // Lunes a Viernes
  return {
    enabled: true,
    morning: legacyMorning,
    afternoon: legacyAfternoon,
  };
}
