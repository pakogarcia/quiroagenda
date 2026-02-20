'use client';

import * as React from 'react';
import { addDays, format, isSameDay, isBefore, startOfToday, startOfDay, set, addMinutes, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, Lock, Unlock, Ban } from 'lucide-react';
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

export default function Home() {
  const { 
    appointments, 
    setAppointments, 
    blockedDays, 
    setBlockedDays,
    services,
    profile,
    isLoading 
  } = useAppData();
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | undefined>(undefined);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = React.useState<string | null>(null);

  const [finishingAppointment, setFinishingAppointment] = React.useState<Appointment | null>(null);
  const [confirmationAppointment, setConfirmationAppointment] = React.useState<Appointment | null>(null);

  React.useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const isDayBlocked = React.useCallback((date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (blockedDays.includes(dateStr)) return true;
    if (profile?.vacations) {
        for (const vacation of profile.vacations) {
            const start = parseISO(vacation.from);
            const end = parseISO(vacation.to);
             if (isSameDay(date, start) || isSameDay(date, end) || isWithinInterval(date, { start, end })) return true;
        }
    }
    return false;
  }, [blockedDays, profile?.vacations]);

  const dailyAppointments = React.useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter((apt) => isSameDay(apt.dateTime, selectedDate))
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [appointments, selectedDate]);
  
  const timeSlots = React.useMemo(() => {
    if (!selectedDate || !profile) return [];
    const slots: TimeSlot[] = [];
    const interval = 15;
    const { openingHours } = profile;
    const { morning, afternoon } = openingHours || { 
        morning: { start: '08:00', end: '14:00', enabled: true }, 
        afternoon: { start: '16:00', end: '21:00', enabled: true }
    };

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
    
    generateSlotsForPeriod(morning.start, morning.end, morning.enabled);
    generateSlotsForPeriod(afternoon.start, afternoon.end, afternoon.enabled);

    dailyAppointments.forEach(apt => {
        if (apt.status === 'scheduled' || apt.status === 'completed' || apt.status === 'no-show') {
            const aptStart = apt.dateTime;
            const service = services.find(s => s.id === apt.serviceId);
            const duration = service?.duration || 60;
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
  
  const modifierClassNames = { blocked: 'blocked-day', vacation: 'vacation-day', oneAppointment: 'one-appointment', twoAppointments: 'two-appointments', threeOrMoreAppointments: 'three-or-more-appointments' };

  const modifiers = React.useMemo(() => {
    const today = startOfToday();
    const counts: Record<string, number> = {};
    appointments.forEach(apt => { if (apt.status === 'scheduled') { const d = format(apt.dateTime, 'yyyy-MM-dd'); counts[d] = (counts[d] || 0) + 1; }});
    const vacationDays = (profile?.vacations || []).reduce((acc, vac) => {
        let current = parseISO(vac.from);
        const end = parseISO(vac.to);
        while(current <= end) { acc.push(new Date(current)); current = addDays(current, 1); }
        return acc;
    }, [] as Date[]);
    return {
      blocked: (date: Date) => blockedDays.includes(format(date, 'yyyy-MM-dd')),
      vacation: vacationDays,
      oneAppointment: (date: Date) => !isBefore(date, today) && !isDayBlocked(date) && counts[format(date, 'yyyy-MM-dd')] === 1,
      twoAppointments: (date: Date) => !isBefore(date, today) && !isDayBlocked(date) && counts[format(date, 'yyyy-MM-dd')] === 2,
      threeOrMoreAppointments: (date: Date) => !isBefore(date, today) && !isDayBlocked(date) && counts[format(date, 'yyyy-MM-dd')] >= 3,
    };
  }, [appointments, isDayBlocked, blockedDays, profile?.vacations]);

  const handleAddAppointment = (data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>) => {
    const newAppointment: Appointment = { ...data, id: crypto.randomUUID(), reminderSent: false, status: 'scheduled' };
    setAppointments([...appointments, newAppointment]);
    setIsFormOpen(false);
    setConfirmationAppointment(newAppointment);
  };

  const handleUpdateAppointment = (id: string, data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>) => {
    let confirmedAppointment: Appointment | undefined;
    setAppointments(appointments.map((apt) => { if (apt.id === id) { confirmedAppointment = { ...apt, ...data }; return confirmedAppointment; } return apt; }));
    setIsFormOpen(false);
    setEditingAppointment(undefined);
    if(confirmedAppointment) setConfirmationAppointment(confirmedAppointment);
  };

  const handleDeleteAppointment = () => {
    if (!deletingAppointmentId) return;
    setAppointments(prev => prev.filter(apt => apt.id !== deletingAppointmentId));
    setIsDeleteConfirmOpen(false);
    setDeletingAppointmentId(null);
    toast({ title: 'Cita eliminada' });
  };

  const handleFinishAppointment = (updatedAppointment: Appointment) => {
    setAppointments(prev => prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt));
    setFinishingAppointment(null);
  };

  const handleToggleBlockDay = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (blockedDays.includes(dateStr)) {
        setBlockedDays(prev => prev.filter(d => d !== dateStr));
        toast({ title: 'Día Desbloqueado' });
    } else {
        if (dailyAppointments.length > 0) { toast({ variant: 'destructive', title: 'Error', description: 'No se puede bloquear un día con citas.' }); return; }
        setBlockedDays(prev => [...prev, dateStr]);
        toast({ title: 'Día Bloqueado' });
    }
  };

  if (isLoading || !selectedDate) return <SplashScreen />;
  const isCurrentDayBlocked = isDayBlocked(selectedDate);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-1 grid md:grid-cols-[auto_1fr] gap-8 p-4 md:p-8">
        <aside className="hidden md:flex flex-col gap-8 items-center w-full max-w-sm">
          <Card className="shadow-lg w-full">
            <CardContent className="p-0">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md" fixedWeeks locale={es} modifiers={modifiers} modifiersClassNames={modifierClassNames} />
            </CardContent>
          </Card>
        </aside>
        <section className="flex flex-col gap-4 overflow-y-auto">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                     <h2 className="text-2xl md:text-3xl font-bold font-headline text-primary">{format(selectedDate, 'PPP', { locale: es })}</h2>
                     <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="md:hidden">
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-auto p-0 pt-0">
                           <Calendar mode="single" selected={selectedDate} onSelect={(date) => { if (!date) return; const nd = new Date(date); nd.setHours(selectedDate.getHours(), selectedDate.getMinutes()); setSelectedDate(nd); setIsCalendarOpen(false); }} initialFocus locale={es} modifiers={modifiers} modifiersClassNames={modifierClassNames} />
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => { setEditingAppointment(undefined); setIsFormOpen(true); }} disabled={isCurrentDayBlocked}><Plus className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Nueva Cita</span></Button>
                    <Button variant={isCurrentDayBlocked ? "destructive" : "outline"} onClick={handleToggleBlockDay}>{isCurrentDayBlocked ? <Unlock className="h-4 w-4 md:mr-2" /> : <Lock className="h-4 w-4 md:mr-2" />}<span className="hidden md:inline">{isCurrentDayBlocked ? 'Desbloquear' : 'Bloquear'}</span></Button>
                </div>
            </div>
          {isCurrentDayBlocked ? (
             <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50"><Ban className="w-16 h-16 text-muted-foreground/50 mb-4" /><h3 className="text-xl font-semibold text-muted-foreground">Día no disponible</h3></div>
          ) : (
            <TimeSlotView 
                slots={timeSlots} 
                onSlotClick={(time) => { const [h, m] = time.split(':').map(Number); setSelectedDate(set(selectedDate, { hours: h, minutes: m })); setEditingAppointment(undefined); setIsFormOpen(true); }} 
                onAppointmentClick={(apt) => { if (apt) { const today = startOfToday(); const isPast = isBefore(apt.dateTime, today) && !isSameDay(apt.dateTime, today); if (isPast || apt.status !== 'scheduled') setFinishingAppointment(apt); else { setEditingAppointment(apt); setIsFormOpen(true); } } }}
                onEditAppointment={(apt) => { setEditingAppointment(apt); setIsFormOpen(true); }}
                onDeleteAppointment={(id) => { setDeletingAppointmentId(id); setIsDeleteConfirmOpen(true); }}
                onFinishAppointment={(apt) => { setFinishingAppointment(apt); }}
            />
          )}
        </section>
      </main>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingAppointment ? 'Editar Cita' : 'Añadir Nueva Cita'}</DialogTitle></DialogHeader>
            <AppointmentForm onSubmit={editingAppointment ? (data) => handleUpdateAppointment(editingAppointment.id, data) : handleAddAppointment} appointment={editingAppointment} selectedDate={selectedDate} />
        </DialogContent>
      </Dialog>

      <FinishAppointmentDialog appointment={finishingAppointment} onOpenChange={() => setFinishingAppointment(null)} onAppointmentFinished={handleFinishAppointment} />
      
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