'use client';

import * as React from 'react';
import { startOfToday, startOfDay, addDays, format, isSameDay, isAfter, isBefore, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Appointment, BusinessProfile } from '@/lib/types';
import { getDaySchedule } from '@/lib/schedule';
import { RotateCcw } from 'lucide-react';

type WeekTrafficLightProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  appointments: Appointment[];
  profile: BusinessProfile | null;
  isDayBlocked: (date: Date) => boolean;
  className?: string;
};

export type DayLoadInfo = {
  date: Date;
  dayLabel: string; // e.g. "HOY 10", "MIÉ 11"
  statusLabel: string; // e.g. "Libre", "3 Libres", "Casi lleno", "Completo", "Cerrado"
  subtitle: string; // e.g. "Sin citas", "2 citas", "5 citas", "Inhábil"
  appointmentCount: number;
  isBlocked: boolean;
  isDark?: boolean;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
    darkBg: string;
    darkText: string;
    darkBorder: string;
    badgeBg?: string;
  };
};

export function WeekTrafficLight({
  selectedDate,
  onSelectDate,
  appointments,
  profile,
  isDayBlocked,
  className,
}: WeekTrafficLightProps) {
  const today = startOfToday();
  const isSelectedBeyondWeek = isAfter(selectedDate, addDays(today, 6));
  const isSelectedInPast = isBefore(selectedDate, today);
  const baseDay = isSelectedBeyondWeek ? startOfDay(selectedDate) : today;

  const weekDays = React.useMemo(() => {
    const days: DayLoadInfo[] = [];

    for (let i = 0; i < 7; i++) {
      const currentDay = addDays(baseDay, i);
      const isBlocked = isDayBlocked(currentDay);
      const daySchedule = profile ? getDaySchedule(profile, currentDay) : null;
      const isDayEnabled = daySchedule ? daySchedule.enabled : true;

      // Citas confirmadas o agendadas en este día
      const dayApts = appointments.filter((apt) => {
        if (!apt || !apt.dateTime) return false;
        return (
          isSameDay(new Date(apt.dateTime), currentDay) &&
          (apt.status === 'scheduled' || apt.status === 'completed')
        );
      });

      const count = dayApts.length;

      // Calcular capacidad estimada de citas (sesiones de 60 min por defecto)
      let estimatedSlots = 6;
      if (daySchedule && isDayEnabled) {
        let totalHours = 0;
        if (daySchedule.morning?.enabled && daySchedule.morning.start && daySchedule.morning.end) {
          const [sh, sm] = daySchedule.morning.start.split(':').map(Number);
          const [eh, em] = daySchedule.morning.end.split(':').map(Number);
          totalHours += Math.max(0, eh + em / 60 - (sh + sm / 60));
        }
        if (daySchedule.afternoon?.enabled && daySchedule.afternoon.start && daySchedule.afternoon.end) {
          const [sh, sm] = daySchedule.afternoon.start.split(':').map(Number);
          const [eh, em] = daySchedule.afternoon.end.split(':').map(Number);
          totalHours += Math.max(0, eh + em / 60 - (sh + sm / 60));
        }
        if (totalHours > 0) estimatedSlots = Math.round(totalHours);
      }

      const freeSlots = Math.max(0, estimatedSlots - count);

      let statusLabel = 'Libre';
      let subtitle = count === 0 ? 'Sin citas' : count === 1 ? '1 cita' : `${count} citas`;
      let isDark = false;
      let colorScheme = {
        bg: 'bg-[#e6f7f2]',
        text: 'text-[#065f46]',
        border: 'border-[#a7f3d0]',
        darkBg: 'dark:bg-emerald-950/40',
        darkText: 'dark:text-emerald-300',
        darkBorder: 'dark:border-emerald-800',
      };

      if (isBlocked || !isDayEnabled) {
        statusLabel = 'Cerrado';
        subtitle = 'Inhábil';
        colorScheme = {
          bg: 'bg-slate-100/80',
          text: 'text-slate-500',
          border: 'border-slate-200',
          darkBg: 'dark:bg-slate-800/60',
          darkText: 'dark:text-slate-400',
          darkBorder: 'dark:border-slate-700',
        };
      } else if (count >= 7 || freeSlots === 0) {
        statusLabel = 'Completo';
        subtitle = count === 1 ? '1 cita' : `${count} citas`;
        isDark = true;
        colorScheme = {
          bg: 'bg-[#5c0617]',
          text: 'text-white',
          border: 'border-[#45030f]',
          darkBg: 'dark:bg-[#4a0412]',
          darkText: 'dark:text-rose-100',
          darkBorder: 'dark:border-rose-950',
        };
      } else if (count >= 5 || freeSlots === 1) {
        statusLabel = freeSlots === 1 ? '1 Libre' : 'Casi lleno';
        subtitle = count === 1 ? '1 cita' : `${count} citas`;
        colorScheme = {
          bg: 'bg-rose-50',
          text: 'text-rose-800',
          border: 'border-rose-300',
          darkBg: 'dark:bg-rose-950/40',
          darkText: 'dark:text-rose-300',
          darkBorder: 'dark:border-rose-800',
        };
      } else if (count >= 3) {
        statusLabel = freeSlots > 0 ? `${freeSlots} Libres` : 'Carga Media';
        subtitle = count === 1 ? '1 cita' : `${count} citas`;
        colorScheme = {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-300',
          darkBg: 'dark:bg-amber-950/40',
          darkText: 'dark:text-amber-300',
          darkBorder: 'dark:border-amber-800',
        };
      } else {
        if (count === 0) {
          statusLabel = 'Libre';
          subtitle = 'Sin citas';
        } else {
          statusLabel = freeSlots > 0 ? `${freeSlots} Libres` : `${count} Citas`;
          subtitle = count === 1 ? '1 cita' : `${count} citas`;
        }
        colorScheme = {
          bg: 'bg-[#e6f7f2]',
          text: 'text-[#065f46]',
          border: 'border-[#a7f3d0]',
          darkBg: 'dark:bg-emerald-950/40',
          darkText: 'dark:text-emerald-300',
          darkBorder: 'dark:border-emerald-800',
        };
      }

      // Formato abreviado del día: "HOY 6", "SÁB 7", "DOM 8", etc.
      let cleanDay = '';
      if (isToday(currentDay)) {
        cleanDay = `HOY ${format(currentDay, 'd')}`;
      } else {
        const rawDay = format(currentDay, 'EEE d', { locale: es });
        // Limpiar puntos de abreviatura en español: "sáb. 7" -> "SÁB 7"
        cleanDay = rawDay.replace('.', '').toUpperCase();
      }

      days.push({
        date: currentDay,
        dayLabel: cleanDay,
        statusLabel,
        subtitle,
        appointmentCount: count,
        isBlocked,
        isDark,
        colorScheme,
      });
    }

    return days;
  }, [baseDay, appointments, profile, isDayBlocked]);

  return (
    <div className="flex flex-col gap-1 w-full">
      {(!isSameDay(baseDay, today) || isSelectedInPast) && (
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Visualizando desde el {format(baseDay, "d 'de' MMMM", { locale: es })}
          </span>
          <button
            type="button"
            onClick={() => onSelectDate(today)}
            className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Volver a Hoy</span>
          </button>
        </div>
      )}

      <div
        className={cn(
          'w-full flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth snap-x snap-mandatory',
          className
        )}
      >
      {weekDays.map((day) => {
        const isSelected = isSameDay(day.date, selectedDate);

        return (
          <button
            key={day.date.toISOString()}
            type="button"
            onClick={() => onSelectDate(day.date)}
            className={cn(
              'flex-1 min-w-[76px] sm:min-w-[88px] max-w-[120px] p-2 sm:p-2.5 rounded-2xl border text-center transition-all duration-150 flex flex-col items-center justify-between snap-start focus:outline-none select-none',
              day.colorScheme.bg,
              day.colorScheme.text,
              day.colorScheme.border,
              day.colorScheme.darkBg,
              day.colorScheme.darkText,
              day.colorScheme.darkBorder,
              isSelected
                ? 'ring-[2.5px] ring-emerald-800 dark:ring-emerald-400 ring-offset-2 shadow-md scale-[1.03] font-bold'
                : 'hover:opacity-90 hover:scale-[1.01] opacity-95 shadow-xs'
            )}
          >
            <span
              className={cn(
                'text-[11px] sm:text-xs font-black tracking-tight leading-none mb-1',
                day.isDark ? 'text-white/90' : 'opacity-80'
              )}
            >
              {day.dayLabel}
            </span>

            <span
              className={cn(
                'text-sm sm:text-base font-extrabold tracking-tight leading-tight',
                day.isDark ? 'text-white' : ''
              )}
            >
              {day.statusLabel}
            </span>

            <span
              className={cn(
                'text-[10px] sm:text-[11px] font-medium leading-none mt-1 truncate max-w-full',
                day.isDark ? 'text-white/80' : 'opacity-75'
              )}
            >
              {day.subtitle}
            </span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
