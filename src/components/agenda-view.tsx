'use client';

import * as React from 'react';
import {
  addDays,
  format,
  isSameDay,
  isBefore,
  startOfToday,
  set,
  addMinutes,
  parseISO,
  isTomorrow,
  isToday as isDateToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Plus,
  Lock,
  Unlock,
  Ban,
  RefreshCw,
  LayoutGrid,
  Send,
  Bell,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Appointment, TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppointmentForm } from '@/components/appointment-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppHeader } from '@/components/layout/header';
import { FinishAppointmentDialog } from '@/components/finish-appointment-dialog';
import { NewAppointmentConfirmationDialog } from '@/components/new-appointment-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/context/app-data-context';
import { SplashScreen } from '@/components/layout/splash-screen';
import { TimeSlotView } from '@/components/timeslot-view';
import { WeekTrafficLight } from '@/components/week-traffic-light';
import { AgendaCardsView } from '@/components/agenda-cards-view';
import { getDaySchedule } from '@/lib/schedule';

const VIEW_MODE_STORAGE_KEY = 'quiroagenda_agenda_view_mode';

export default function AgendaView() {
  const {
    appointments,
    setAppointments,
    blockedDays,
    setBlockedDays,
    setCloudBlockedDays,
    services,
    clients,
    profile,
    isLoading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refreshData,
  } = useAppData();

  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // 'cards' = Vista ejecutiva de tarjetas | 'grid' = Rejilla clásica de 15 min
  const [viewMode, setViewMode] = React.useState<'cards' | 'grid'>('cards');

  // Cargar preferencia de vista de localStorage
  React.useEffect(() => {
    try {
      const savedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (savedMode === 'cards' || savedMode === 'grid') {
        setViewMode(savedMode);
      }
    } catch {
      // Ignorar en SSR
    }
  }, []);

  const handleToggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === 'cards' ? 'grid' : 'cards';
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
      } catch {
        // Ignorar
      }
      return next;
    });
  };

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | undefined>(
    undefined
  );

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = React.useState<string | null>(null);

  const [finishingAppointment, setFinishingAppointment] = React.useState<Appointment | null>(null);
  const [confirmationAppointment, setConfirmationAppointment] =
    React.useState<Appointment | null>(null);

  const isDayBlocked = React.useCallback(
    (date: Date): boolean => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (blockedDays.includes(dateStr)) return true;
      if (profile?.vacations) {
        for (const vacation of profile.vacations) {
          const start = parseISO(vacation.from);
          const end = parseISO(vacation.to);
          if (date >= start && date <= end) return true;
        }
      }
      return false;
    },
    [blockedDays, profile?.vacations]
  );

  const dailyAppointments = React.useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter((apt) => apt && apt.dateTime && isSameDay(new Date(apt.dateTime), selectedDate))
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [appointments, selectedDate]);

  // Última reserva online recibida (o más reciente) para la alerta de Telegram
  const latestOnlineBooking = React.useMemo(() => {
    if (!appointments || appointments.length === 0) return null;

    // Buscar primero citas reservadas vía web
    const webAppointments = appointments
      .filter((a) => a.source === 'web_direct' || (a.id && a.id.startsWith('apt_')))
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    if (webAppointments.length > 0) return webAppointments[0];

    // Fallback: cita más reciente del sistema
    const sorted = [...appointments].sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
    return sorted[0] || null;
  }, [appointments]);

  const timeSlots = React.useMemo(() => {
    if (!selectedDate || !profile) return [];
    const slots: TimeSlot[] = [];
    const interval = 15;
    const daySchedule = getDaySchedule(profile, selectedDate);
    const morning = daySchedule?.morning || { start: '08:30', end: '14:00', enabled: true };
    const afternoon = daySchedule?.afternoon || { start: '16:30', end: '20:30', enabled: true };

    const generateSlotsForPeriod = (startStr: string, endStr: string, isEnabled: boolean) => {
      if (!isEnabled || !startStr || !endStr || startStr === endStr) return;
      const [startHour, startMinute] = startStr.split(':').map(Number);
      const [endHour, endMinute] = endStr.split(':').map(Number);
      let currentTime = set(selectedDate, {
        hours: startHour,
        minutes: startMinute,
        seconds: 0,
        milliseconds: 0,
      });
      const endTime = set(selectedDate, {
        hours: endHour,
        minutes: endMinute,
        seconds: 0,
        milliseconds: 0,
      });
      while (isBefore(currentTime, endTime)) {
        slots.push({ time: format(currentTime, 'HH:mm'), isBooked: false });
        currentTime = addMinutes(currentTime, interval);
      }
    };

    const isDayOpen = daySchedule?.enabled ?? true;
    if (isDayOpen) {
      generateSlotsForPeriod(morning.start, morning.end, morning.enabled);
      generateSlotsForPeriod(afternoon.start, afternoon.end, afternoon.enabled);
    } else {
      generateSlotsForPeriod(morning.start, morning.end, true);
      if (afternoon.enabled) {
        generateSlotsForPeriod(afternoon.start, afternoon.end, true);
      }
    }

    dailyAppointments.forEach((apt) => {
      const aptTime = format(apt.dateTime, 'HH:mm');
      if (!slots.some((s) => s.time === aptTime)) {
        slots.push({ time: aptTime, isBooked: false });
      }
    });
    slots.sort((a, b) => a.time.localeCompare(b.time));

    dailyAppointments.forEach((apt) => {
      if (apt.status === 'scheduled' || apt.status === 'completed' || apt.status === 'no-show') {
        const aptStart = apt.dateTime;
        const service = services.find((s) => s.id === apt.serviceId);
        const duration = apt.duration || service?.duration || 60;
        const startIndex = slots.findIndex((s) => s.time === format(aptStart, 'HH:mm'));
        if (startIndex !== -1) {
          const numSlotsToBook = Math.ceil(duration / interval);
          for (let i = 0; i < numSlotsToBook; i++) {
            const slotIndex = startIndex + i;
            if (slotIndex < slots.length) {
              if (i === 0) {
                slots[slotIndex].isBooked = true;
                slots[slotIndex].appointment = apt;
                slots[slotIndex].duration = duration;
              } else {
                slots[slotIndex].isBooked = true;
              }
            }
          }
        }
      }
    });
    return slots;
  }, [selectedDate, dailyAppointments, services, profile]);

  const modifierClassNames = {
    blocked: 'blocked-day',
    vacation: 'vacation-day',
    loadLow: 'load-low',
    loadMedium: 'load-medium',
    loadHigh: 'load-high',
    loadMax: 'load-max',
  };

  const modifiers = React.useMemo(() => {
    const today = startOfToday();
    const counts: Record<string, number> = {};
    appointments.forEach((apt) => {
      if (apt.status === 'scheduled' || apt.status === 'completed') {
        const d = format(apt.dateTime, 'yyyy-MM-dd');
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    const vacationDays = (profile?.vacations || []).reduce((acc, vac) => {
      let current = parseISO(vac.from);
      const end = parseISO(vac.to);
      while (current <= end) {
        acc.push(new Date(current));
        current = addDays(current, 1);
      }
      return acc;
    }, [] as Date[]);
    return {
      blocked: (date: Date) => blockedDays.includes(format(date, 'yyyy-MM-dd')),
      vacation: vacationDays,
      loadLow: (date: Date) => {
        const c = counts[format(date, 'yyyy-MM-dd')] || 0;
        return !isBefore(date, today) && !isDayBlocked(date) && c >= 1 && c <= 2;
      },
      loadMedium: (date: Date) => {
        const c = counts[format(date, 'yyyy-MM-dd')] || 0;
        return !isBefore(date, today) && !isDayBlocked(date) && c >= 3 && c <= 4;
      },
      loadHigh: (date: Date) => {
        const c = counts[format(date, 'yyyy-MM-dd')] || 0;
        return !isBefore(date, today) && !isDayBlocked(date) && c >= 5 && c <= 6;
      },
      loadMax: (date: Date) => {
        const c = counts[format(date, 'yyyy-MM-dd')] || 0;
        return !isBefore(date, today) && !isDayBlocked(date) && c >= 7;
      },
    };
  }, [appointments, isDayBlocked, blockedDays, profile?.vacations]);

  const handleAddAppointment = async (
    data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>
  ) => {
    const newAppointment: Appointment = {
      ...data,
      id: crypto.randomUUID(),
      reminderSent: false,
      status: 'scheduled',
    };
    try {
      await addAppointment(newAppointment);
      if (data.dateTime) {
        setSelectedDate(new Date(data.dateTime));
      }
      setIsFormOpen(false);
      setConfirmationAppointment(newAppointment);
      toast({
        title: '✅ Cita guardada en la nube',
        description: `${newAppointment.clientName} ha quedado agendado(a) correctamente.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error al sincronizar con la nube',
        description: 'Revisa tu conexión a internet.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAppointment = async (
    id: string,
    data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>
  ) => {
    let confirmedAppointment: Appointment | undefined;
    try {
      await updateAppointment(id, data);
      confirmedAppointment = { ...appointments.find((a) => a.id === id), ...data } as Appointment;
      if (data.dateTime) {
        setSelectedDate(new Date(data.dateTime));
      }
      setIsFormOpen(false);
      setEditingAppointment(undefined);
      if (confirmedAppointment) setConfirmationAppointment(confirmedAppointment);
      toast({ title: '✅ Cita actualizada en la nube' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  const handleDeleteAppointment = async () => {
    if (!deletingAppointmentId) return;
    try {
      await deleteAppointment(deletingAppointmentId);
      setIsDeleteConfirmOpen(false);
      setDeletingAppointmentId(null);
      toast({ title: '✅ Cita eliminada de la nube' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const handleFinishAppointment = (updatedAppointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === updatedAppointment.id ? updatedAppointment : apt))
    );
    setFinishingAppointment(null);
  };

  const handleToggleBlockDay = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (blockedDays.includes(dateStr)) {
      const next = blockedDays.filter((d) => d !== dateStr);
      await setCloudBlockedDays(next);
      toast({
        title: 'Día Desbloqueado',
        description: `El día ${format(selectedDate, 'dd/MM/yyyy')} vuelve a estar disponible.`,
      });
    } else {
      if (dailyAppointments.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se puede bloquear un día con citas programadas.',
        });
        return;
      }
      const next = [...blockedDays, dateStr];
      await setCloudBlockedDays(next);
      toast({
        title: 'Día Bloqueado',
        description: `El día ${format(selectedDate, 'dd/MM/yyyy')} marcado como inhábil / festivo.`,
      });
    }
  };

  if (isLoading) return <SplashScreen />;
  const isCurrentDayBlocked = isDayBlocked(selectedDate);

  // Formatear texto para la notificación de Telegram
  const telegramBookingText = (() => {
    if (!latestOnlineBooking) {
      return 'Canal de notificaciones en tiempo real y bot de Telegram activos.';
    }
    const aptDate = new Date(latestOnlineBooking.dateTime);
    const serviceName = latestOnlineBooking.serviceName || 'Tratamiento';
    const duration = latestOnlineBooking.duration || 60;
    const timeStr = format(aptDate, 'HH:mm');

    // Nombre recortado: "Marta S."
    const nameParts = (latestOnlineBooking.clientName || 'Cliente').trim().split(' ');
    const shortName =
      nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[1].charAt(0).toUpperCase()}.`
        : nameParts[0];

    let when = '';
    if (isDateToday(aptDate)) {
      when = `para hoy ${timeStr}h`;
    } else if (isTomorrow(aptDate)) {
      when = `para mañana ${timeStr}h`;
    } else {
      when = `para el ${format(aptDate, "d 'de' MMM", { locale: es })} a las ${timeStr}h`;
    }

    return (
      <>
        <strong className="text-white font-bold">{shortName}</strong> reservó{' '}
        <strong className="text-white font-bold">
          {serviceName} ({duration}m)
        </strong>{' '}
        {when}.
      </>
    );
  })();

  // Formatear dominio para el subtítulo del encabezado
  const webDomainDisplay = (() => {
    if (profile?.website) {
      return profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location.hostname) {
      return window.location.hostname;
    }
    return 'citas.pakogarcia.es';
  })();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />

      <main className="flex-1 grid md:grid-cols-[auto_1fr] gap-6 lg:gap-8 p-3 sm:p-5 md:p-8 max-w-7xl mx-auto w-full">
        {/* Barra lateral solo en Desktop: Mini Calendario de navegación mensual */}
        <aside className="hidden md:flex flex-col gap-6 items-center w-full max-w-[290px] lg:max-w-xs shrink-0">
          <Card className="shadow-sm w-full border-primary/10 rounded-3xl overflow-hidden">
            <CardContent className="p-2 sm:p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) setSelectedDate(date);
                }}
                className="rounded-2xl w-full"
                fixedWeeks
                locale={es}
                modifiers={modifiers}
                modifiersClassNames={modifierClassNames}
              />
            </CardContent>
          </Card>

          {/* Tarjeta resumen de accesos rápidos */}
          <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-200">
              <span>Leyenda Disponibilidad</span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Ocupación</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Disponible
              </span>
              <span>0 - 2 citas (Huecos libres)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Carga Media
              </span>
              <span>3 - 4 citas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Casi Lleno
              </span>
              <span>5 - 6 citas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#880d24] dark:text-rose-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5c0617]" /> Completo
              </span>
              <span>7+ citas (Agenda llena)</span>
            </div>
          </div>
        </aside>

        {/* Sección Principal con la Presentación Ejecutiva y Semáforo */}
        <section className="flex flex-col gap-4 min-w-0 w-full">
          {/* 1. Encabezado del Gabinete (Estilo Dark Emerald del Mockup) */}
          <div className="bg-[#0b3b2c] text-white rounded-3xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#10b981]/25 border border-[#10b981]/50 flex items-center justify-center shrink-0 text-white font-black text-sm sm:text-base tracking-wider shadow-2xs">
                {profile?.logo ? (
                  <img
                    src={profile.logo}
                    alt=""
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  'QA'
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white truncate">
                  {profile?.name || 'Gabinete ZenVital'}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-200/80 truncate font-medium">
                  {webDomainDisplay}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#14532d] text-emerald-200 border border-emerald-500/40 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Antelación: {profile?.minNoticeHours || 4}h
              </span>
            </div>
          </div>

          {/* 2. Carga de la Semana (Semáforo) y Switcher de Vista */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                CARGA DE LA SEMANA (SEMÁFORO)
              </h2>

              <button
                type="button"
                onClick={handleToggleViewMode}
                className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                title={
                  viewMode === 'cards'
                    ? 'Cambiar a la rejilla horaria de 15 minutos'
                    : 'Cambiar a la vista ejecutiva de tarjetas'
                }
              >
                {viewMode === 'cards' ? (
                  <>
                    <CalendarIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Rejilla 15 min</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Vista Tarjetas</span>
                  </>
                )}
              </button>
            </div>

            {/* Barra interactiva de los 7 días de la semana */}
            <WeekTrafficLight
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
              appointments={appointments}
              profile={profile}
              isDayBlocked={isDayBlocked}
            />
          </div>

          {/* 3. Barra de Controles del Día Seleccionado */}
          <div className="flex flex-wrap gap-2.5 items-center justify-between pt-1 pb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black font-headline text-slate-900 dark:text-slate-100 capitalize">
                {format(selectedDate, 'PPP', { locale: es })}
              </h3>

              {/* Botón selector de fecha modal (especialmente útil en móvil) */}
              <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl shadow-xs">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[96vw] sm:max-w-[420px] p-2.5 pt-8 sm:p-5 sm:pt-10">
                  <DialogHeader className="mb-1">
                    <DialogTitle className="text-center font-bold text-sm sm:text-base text-primary flex items-center justify-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      Seleccionar Fecha de la Agenda
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center p-0.5 sm:p-1 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (!date) return;
                        const nd = new Date(date);
                        nd.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                        setSelectedDate(nd);
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                      locale={es}
                      modifiers={modifiers}
                      modifiersClassNames={modifierClassNames}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Botón Sincronización en Tiempo Real */}
              <Button
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                onClick={async () => {
                  setIsRefreshing(true);
                  await refreshData();
                  setIsRefreshing(false);
                  toast({
                    title: '✅ Agenda sincronizada',
                    description: `Actualizado con éxito. Hay ${appointments.length} citas en la base de datos.`,
                  });
                }}
                className="h-9 px-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 rounded-xl shadow-2xs"
                title="Forzar sincronización instantánea con la nube"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                <span className="hidden sm:inline">Nube ({appointments.length})</span>
                <RefreshCw
                  className={`w-3.5 h-3.5 ml-1 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </Button>

              {/* Botón Nueva Cita */}
              <Button
                onClick={() => {
                  setEditingAppointment(undefined);
                  setIsFormOpen(true);
                }}
                disabled={isCurrentDayBlocked}
                className="h-9 px-3 sm:px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs font-bold text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4 sm:mr-1.5" />
                <span>Nueva Cita</span>
              </Button>

              {/* Botón Bloquear / Desbloquear Día */}
              <Button
                variant={isCurrentDayBlocked ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleToggleBlockDay}
                className="h-9 px-3 rounded-xl shadow-2xs text-xs font-semibold"
                title={isCurrentDayBlocked ? 'Desbloquear este día' : 'Bloquear este día como inhábil'}
              >
                {isCurrentDayBlocked ? (
                  <>
                    <Unlock className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Desbloquear</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Bloquear</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 4. Cuerpo de la Agenda: Día Bloqueado vs Vista de Tarjetas vs Rejilla 15 min */}
          {isCurrentDayBlocked ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl bg-muted/30 border-primary/20 p-6 text-center">
              <Ban className="w-14 h-14 text-rose-500/50 mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Día no disponible / Bloqueado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Este día está marcado como no laborable o festivo. Puedes desbloquearlo con el botón
                superior para volver a permitir citas.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <AgendaCardsView
              selectedDate={selectedDate}
              appointments={dailyAppointments}
              clients={clients}
              services={services}
              profile={profile}
              onAppointmentClick={(apt) => {
                const today = startOfToday();
                const isPast =
                  isBefore(apt.dateTime, today) && !isSameDay(apt.dateTime, today);
                if (isPast || apt.status !== 'scheduled') {
                  setFinishingAppointment(apt);
                } else {
                  setEditingAppointment(apt);
                  setIsFormOpen(true);
                }
              }}
              onEditAppointment={(apt) => {
                setEditingAppointment(apt);
                setIsFormOpen(true);
              }}
              onFinishAppointment={(apt) => setFinishingAppointment(apt)}
              onDeleteAppointment={(id) => {
                setDeletingAppointmentId(id);
                setIsDeleteConfirmOpen(true);
              }}
              onNewAppointment={() => {
                setEditingAppointment(undefined);
                setIsFormOpen(true);
              }}
            />
          ) : (
            <TimeSlotView
              slots={timeSlots}
              onSlotClick={(time) => {
                const [h, m] = time.split(':').map(Number);
                const nd = set(selectedDate, { hours: h, minutes: m });
                setSelectedDate(nd);
                setEditingAppointment(undefined);
                setIsFormOpen(true);
              }}
              onAppointmentClick={(apt) => {
                if (apt) {
                  const today = startOfToday();
                  const isPast =
                    isBefore(apt.dateTime, today) && !isSameDay(apt.dateTime, today);
                  if (isPast || apt.status !== 'scheduled') setFinishingAppointment(apt);
                  else {
                    setEditingAppointment(apt);
                    setIsFormOpen(true);
                  }
                }
              }}
              onEditAppointment={(apt) => {
                setEditingAppointment(apt);
                setIsFormOpen(true);
              }}
              onDeleteAppointment={(id) => {
                setDeletingAppointmentId(id);
                setIsDeleteConfirmOpen(true);
              }}
              onFinishAppointment={(apt) => {
                setFinishingAppointment(apt);
              }}
            />
          )}

          {/* 5. Alerta en Vivo / Bot de Telegram (Diseño Azul Marino del Mockup) */}
          <div className="bg-[#0c2e47] text-white rounded-3xl p-4 sm:p-4.5 shadow-sm flex items-center gap-3.5 border border-sky-900/60 mt-auto select-none">
            <div className="w-11 h-11 rounded-2xl bg-[#0ea5e9] text-white flex items-center justify-center shrink-0 shadow-md">
              <Send className="w-5 h-5 ml-0.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-sky-200 flex items-center gap-1.5 leading-snug">
                <span>🔔 Bot Telegram</span>
                <span className="opacity-70">·</span>
                <span>Nueva Reserva Online</span>
              </p>
              <p className="text-xs sm:text-sm text-slate-200/90 truncate mt-0.5 font-medium">
                {telegramBookingText}
              </p>
            </div>
          </div>

          {/* 6. Pie explicativo suave como en el Mockup */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-2">
            Pulsa las pestañas superiores para explorar QuiroAgenda v4.0
          </p>
        </section>
      </main>

      {/* Diálogos modales: Crear / Editar cita */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingAppointment(undefined);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? 'Editar Cita' : 'Añadir Nueva Cita'}</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            key={
              editingAppointment
                ? editingAppointment.id
                : selectedDate
                ? selectedDate.toISOString()
                : 'new'
            }
            onSubmit={
              editingAppointment
                ? (data) => handleUpdateAppointment(editingAppointment.id, data)
                : handleAddAppointment
            }
            appointment={editingAppointment}
            selectedDate={selectedDate}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Cobro / Finalizar Cita o Bono */}
      <FinishAppointmentDialog
        appointment={finishingAppointment}
        onOpenChange={(isOpen) => {
          if (!isOpen) setFinishingAppointment(null);
        }}
        onAppointmentFinished={handleFinishAppointment}
      />

      {/* Confirmación y Recordatorio de Cita Creada */}
      <NewAppointmentConfirmationDialog
        appointment={confirmationAppointment}
        onOpenChange={(isOpen) => {
          if (!isOpen) setConfirmationAppointment(null);
        }}
      />

      {/* Confirmación de Eliminación */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cita de forma permanente de tu agenda y de la base de datos en la
              nube. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
