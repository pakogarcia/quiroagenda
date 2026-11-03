'use client';

import * as React from 'react';
import { addDays, format, isSameDay, isBefore, startOfToday, set, addMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, Lock, Unlock, Ban, RefreshCw } from 'lucide-react';
import type { Appointment, TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppointmentForm } from '@/components/appointment-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AppHeader } from '@/components/layout/header';
import { FinishAppointmentDialog } from '@/components/finish-appointment-dialog';
import { NewAppointmentConfirmationDialog } from '@/components/new-appointment-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/context/app-data-context';
import { SplashScreen } from '@/components/layout/splash-screen';
import { TimeSlotView } from '@/components/timeslot-view';
import { getDaySchedule } from '@/lib/schedule';

export default function AgendaView() {
  const { 
    appointments, 
    setAppointments, 
    blockedDays, 
    setBlockedDays,
    setCloudBlockedDays,
    services,
    profile,
    isLoading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refreshData
  } = useAppData();
  
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | undefined>(undefined);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = React.useState<string | null>(null);

  const [finishingAppointment, setFinishingAppointment] = React.useState<Appointment | null>(null);
  const [confirmationAppointment, setConfirmationAppointment] = React.useState<Appointment | null>(null);

  const isDayBlocked = React.useCallback((date: Date): boolean => {
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
  }, [blockedDays, profile?.vacations]);

  const dailyAppointments = React.useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter((apt) => apt && apt.dateTime && isSameDay(new Date(apt.dateTime), selectedDate))
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [appointments, selectedDate]);
  
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
        let currentTime = set(selectedDate, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
        const endTime = set(selectedDate, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });
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
      // Si el día está marcado como no laborable pero el admin lo consulta o hay citas,
      // mostramos las franjas habituales para gestionar o visualizar
      generateSlotsForPeriod(morning.start, morning.end, true);
      if (afternoon.enabled) {
        generateSlotsForPeriod(afternoon.start, afternoon.end, true);
      }
    }

    // Asegurar que cualquier cita registrada tenga su fila visible aunque esté fuera de rango habitual
    dailyAppointments.forEach(apt => {
        const aptTime = format(apt.dateTime, 'HH:mm');
        if (!slots.some(s => s.time === aptTime)) {
            slots.push({ time: aptTime, isBooked: false });
        }
    });
    slots.sort((a, b) => a.time.localeCompare(b.time));

    dailyAppointments.forEach(apt => {
        if (apt.status === 'scheduled' || apt.status === 'completed' || apt.status === 'no-show') {
            const aptStart = apt.dateTime;
            const service = services.find(s => s.id === apt.serviceId);
            const duration = apt.duration || service?.duration || 60;
            const startIndex = slots.findIndex(s => s.time === format(aptStart, 'HH:mm'));
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
    loadMax: 'load-max'
  };

  const modifiers = React.useMemo(() => {
    const today = startOfToday();
    const counts: Record<string, number> = {};
    appointments.forEach(apt => { 
      if (apt.status === 'scheduled' || apt.status === 'completed') { 
        const d = format(apt.dateTime, 'yyyy-MM-dd'); 
        counts[d] = (counts[d] || 0) + 1; 
      }
    });
    const vacationDays = (profile?.vacations || []).reduce((acc, vac) => {
        let current = parseISO(vac.from);
        const end = parseISO(vac.to);
        while(current <= end) { acc.push(new Date(current)); current = addDays(current, 1); }
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

  const handleAddAppointment = async (data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>) => {
    const newAppointment: Appointment = { ...data, id: crypto.randomUUID(), reminderSent: false, status: 'scheduled' };
    try {
      await addAppointment(newAppointment);
      if (data.dateTime) {
        setSelectedDate(new Date(data.dateTime));
      }
      setIsFormOpen(false);
      setConfirmationAppointment(newAppointment);
      toast({ 
        title: '✅ Cita guardada en la nube', 
        description: `${newAppointment.clientName} ha quedado agendado(a) correctamente.` 
      });
    } catch (err) {
      console.error(err);
      toast({ 
        title: 'Error al sincronizar con la nube', 
        description: 'Revisa tu conexión a internet.', 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateAppointment = async (id: string, data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>) => {
    let confirmedAppointment: Appointment | undefined;
    try {
      await updateAppointment(id, data);
      confirmedAppointment = { ...appointments.find(a => a.id === id), ...data } as Appointment;
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
    setAppointments(prev => prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt));
    setFinishingAppointment(null);
  };

  const handleToggleBlockDay = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (blockedDays.includes(dateStr)) {
        const next = blockedDays.filter(d => d !== dateStr);
        await setCloudBlockedDays(next);
        toast({ title: 'Día Desbloqueado', description: `El día ${format(selectedDate, 'dd/MM/yyyy')} vuelve a estar disponible.` });
    } else {
        if (dailyAppointments.length > 0) { 
            toast({ variant: 'destructive', title: 'Error', description: 'No se puede bloquear un día con citas programadas.' }); 
            return; 
        }
        const next = [...blockedDays, dateStr];
        await setCloudBlockedDays(next);
        toast({ title: 'Día Bloqueado', description: `El día ${format(selectedDate, 'dd/MM/yyyy')} marcado como inhábil / festivo.` });
    }
  };

  if (isLoading) return <SplashScreen />;
  const isCurrentDayBlocked = isDayBlocked(selectedDate);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-1 grid md:grid-cols-[auto_1fr] gap-8 p-4 md:p-8">
        <aside className="hidden md:flex flex-col gap-8 items-center w-full max-w-sm">
          <Card className="shadow-lg w-full border-primary/10">
            <CardContent className="p-0">
              <Calendar 
                mode="single" 
                selected={selectedDate} 
                onSelect={(date) => {
                  if (date) setSelectedDate(date);
                }} 
                className="rounded-md w-full" 
                fixedWeeks 
                locale={es} 
                modifiers={modifiers} 
                modifiersClassNames={modifierClassNames} 
              />
            </CardContent>
          </Card>
        </aside>
        <section className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                     <h2 className="text-2xl md:text-3xl font-bold font-headline text-primary">{format(selectedDate, 'PPP', { locale: es })}</h2>
                     <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="md:hidden shadow-sm">
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[96vw] sm:max-w-[420px] p-2.5 pt-8 sm:p-5 sm:pt-10">
                           <DialogHeader className="mb-1">
                             <DialogTitle className="text-center font-bold text-sm sm:text-base text-primary flex items-center justify-center gap-2">
                               <CalendarIcon className="w-4 h-4 text-primary" />
                               Seleccionar Fecha de la Agenda
                             </DialogTitle>
                           </DialogHeader>
                           <div className="flex justify-center p-0.5 sm:p-1 bg-white dark:bg-slate-900 rounded-xl border shadow-sm">
                             <Calendar mode="single" selected={selectedDate} onSelect={(date) => { if (!date) return; const nd = new Date(date); nd.setHours(selectedDate.getHours(), selectedDate.getMinutes()); setSelectedDate(nd); setIsCalendarOpen(false); }} initialFocus locale={es} modifiers={modifiers} modifiersClassNames={modifierClassNames} />
                           </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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
                          description: `Actualizado con éxito. Hay ${appointments.length} citas en la base de datos.` 
                        });
                      }}
                      className="h-10 px-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 dark:bg-emerald-950/40 shadow-xs"
                      title="Forzar comprobación y sincronización en tiempo real con la nube"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                      <span className="hidden sm:inline">Nube ({appointments.length})</span>
                      <RefreshCw className={`w-3.5 h-3.5 ml-1 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={() => { setEditingAppointment(undefined); setIsFormOpen(true); }} disabled={isCurrentDayBlocked} className="shadow-md"><Plus className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Nueva Cita</span></Button>
                    <Button variant={isCurrentDayBlocked ? "destructive" : "outline"} onClick={handleToggleBlockDay} className="shadow-sm">{isCurrentDayBlocked ? <Unlock className="h-4 w-4 md:mr-2" /> : <Lock className="h-4 w-4 md:mr-2" />}<span className="hidden md:inline">{isCurrentDayBlocked ? 'Desbloquear' : 'Bloquear'}</span></Button>
                </div>
            </div>
          {isCurrentDayBlocked ? (
             <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/30 border-primary/20"><Ban className="w-16 h-16 text-primary/30 mb-4" /><h3 className="text-xl font-semibold text-muted-foreground">Día no disponible</h3></div>
          ) : (
            <TimeSlotView 
                slots={timeSlots} 
                onSlotClick={(time) => { const [h, m] = time.split(':').map(Number); const nd = set(selectedDate, { hours: h, minutes: m }); setSelectedDate(nd); setEditingAppointment(undefined); setIsFormOpen(true); }} 
                onAppointmentClick={(apt) => { if (apt) { const today = startOfToday(); const isPast = isBefore(apt.dateTime, today) && !isSameDay(apt.dateTime, today); if (isPast || apt.status !== 'scheduled') setFinishingAppointment(apt); else { setEditingAppointment(apt); setIsFormOpen(true); } } }}
                onEditAppointment={(apt) => { setEditingAppointment(apt); setIsFormOpen(true); }}
                onDeleteAppointment={(id) => { setDeletingAppointmentId(id); setIsDeleteConfirmOpen(true); }}
                onFinishAppointment={(apt) => { setFinishingAppointment(apt); }}
            />
          )}
        </section>
      </main>
      
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingAppointment(undefined); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAppointment ? 'Editar Cita' : 'Añadir Nueva Cita'}</DialogTitle>
            </DialogHeader>
            <AppointmentForm 
              key={editingAppointment ? editingAppointment.id : (selectedDate ? selectedDate.toISOString() : 'new')}
              onSubmit={editingAppointment ? (data) => handleUpdateAppointment(editingAppointment.id, data) : handleAddAppointment} 
              appointment={editingAppointment} 
              selectedDate={selectedDate} 
            />
        </DialogContent>
      </Dialog>

      <FinishAppointmentDialog 
        appointment={finishingAppointment} 
        onOpenChange={() => setFinishingAppointment(null)} 
        onAppointmentFinished={handleFinishAppointment} 
      />
      
      <NewAppointmentConfirmationDialog appointment={confirmationAppointment} onOpenChange={() => setConfirmationAppointment(null)} />

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cita de forma permanente. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
