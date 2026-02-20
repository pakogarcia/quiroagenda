'use client';

import * as React from 'react';
import { addDays, format, isSameDay, isBefore, startOfToday, startOfDay, set, addMinutes, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, Lock, Unlock, Ban } from 'lucide-react';
import type { Appointment, TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    if (blockedDays.includes(dateStr)) {
        return true;
    }
    if (profile?.vacations) {
        for (const vacation of profile.vacations) {
            const start = parseISO(vacation.from);
            const end = parseISO(vacation.to);
             if (isSameDay(date, start) || isSameDay(date, end) || isWithinInterval(date, { start, end })) {
                return true;
            }
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
        morning: { start: '08:00', end: '14:00' }, 
        afternoon: { start: '16:00', end: '21:00' }
    };

    const generateSlotsForPeriod = (startStr: string, endStr: string) => {
        if (!startStr || !endStr || startStr === endStr) return;
        const [startHour, startMinute] = startStr.split(':').map(Number);
        const [endHour, endMinute] = endStr.split(':').map(Number);
        
        let currentTime = set(selectedDate, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
        const endTime = set(selectedDate, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

        while (isBefore(currentTime, endTime)) {
            slots.push({ time: format(currentTime, 'HH:mm'), isBooked: false });
            currentTime = addMinutes(currentTime, interval);
        }
    };
    
    generateSlotsForPeriod(morning.start, morning.end);
    generateSlotsForPeriod(afternoon.start, afternoon.end);

    dailyAppointments.forEach(apt => {
        if (apt.status === 'scheduled') {
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
    return slots.filter((slot, index, self) => 
        !slot.isBooked || (slot.isBooked && slot.appointment)
    );

  }, [selectedDate, dailyAppointments, services, profile]);
  
  const upcomingAppointments = React.useMemo(() => {
    const today = startOfToday();
    const nextWeek = addDays(today, 7);
    
    return appointments
      .filter(apt => {
        const aptDay = startOfDay(apt.dateTime);
        return apt.status === 'scheduled' && !isDayBlocked(aptDay) && (isSameDay(aptDay, today) || (isBefore(aptDay, nextWeek) && !isBefore(aptDay, today)));
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .slice(0, 7);
  }, [appointments, isDayBlocked]);

  const appointmentsByDay = React.useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(apt => {
      if (apt.status === 'scheduled') {
        const day = format(apt.dateTime, 'yyyy-MM-dd');
        counts[day] = (counts[day] || 0) + 1;
      }
    });
    return counts;
  }, [appointments]);

  const modifiers = React.useMemo(() => {
    const today = startOfToday();
    const vacationDays = (profile?.vacations || []).reduce((acc, vac) => {
        let current = parseISO(vac.from);
        const end = parseISO(vac.to);
        while(current <= end) {
            acc.push(new Date(current));
            current = addDays(current, 1);
        }
        return acc;
    }, [] as Date[]);

    return {
      blocked: (date: Date) => blockedDays.includes(format(date, 'yyyy-MM-dd')),
      vacation: vacationDays,
      oneAppointment: (date: Date) => {
        if (isBefore(date, today) || isDayBlocked(date)) return false;
        const day = format(date, 'yyyy-MM-dd');
        return appointmentsByDay[day] === 1;
      },
      twoAppointments: (date: Date) => {
        if (isBefore(date, today) || isDayBlocked(date)) return false;
        const day = format(date, 'yyyy-MM-dd');
        return appointmentsByDay[day] === 2;
      },
      threeOrMoreAppointments: (date: Date) => {
        if (isBefore(date, today) || isDayBlocked(date)) return false;
        const day = format(date, 'yyyy-MM-dd');
        return appointmentsByDay[day] >= 3;
      },
    };
  }, [appointmentsByDay, isDayBlocked, blockedDays, profile?.vacations]);

  const modifierClassNames = {
    blocked: 'blocked-day',
    vacation: 'vacation-day',
    oneAppointment: 'one-appointment',
    twoAppointments: 'two-appointments',
    threeOrMoreAppointments: 'three-or-more-appointments',
  };

  const handleAddAppointment = (data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>) => {
    const newAppointment: Appointment = {
      ...data,
      id: crypto.randomUUID(),
      reminderSent: false,
      status: 'scheduled',
    };
    setAppointments([...appointments, newAppointment]);
    setIsFormOpen(false);
    setConfirmationAppointment(newAppointment);
  };

  const handleUpdateAppointment = (id: string, data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>) => {
    let confirmedAppointment: Appointment | undefined;
    setAppointments(
      appointments.map((apt) => {
        if (apt.id === id) {
            confirmedAppointment = { 
                ...apt, 
                ...data 
            };
            return confirmedAppointment;
        }
        return apt;
      })
    );
    setIsFormOpen(false);
    setEditingAppointment(undefined);
    if(confirmedAppointment) {
        setConfirmationAppointment(confirmedAppointment);
    }
  };

  const handleDeleteAppointment = () => {
    if (!deletingAppointmentId) return;
    setAppointments(appointments.filter((apt) => apt.id !== deletingAppointmentId));
    setIsDeleteConfirmOpen(false);
    setDeletingAppointmentId(null);
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
        toast({ title: 'Día Desbloqueado', description: 'Ahora se pueden agendar citas para este día.' });
    } else {
        if (dailyAppointments.length > 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se puede bloquear un día que ya tiene citas.' });
            return;
        }
        setBlockedDays(prev => [...prev, dateStr]);
        toast({ title: 'Día Bloqueado', description: 'No se podrán agendar citas para este día.' });
    }
  };


  if (isLoading || !selectedDate) {
    return <SplashScreen />;
  }

  const isCurrentDayBlocked = selectedDate ? isDayBlocked(selectedDate) : false;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />

      <main className="flex-1 grid md:grid-cols-[auto_1fr] gap-8 p-4 md:p-8">
        <aside className="hidden md:flex flex-col gap-8 items-center w-full max-w-sm">
          <Card className="shadow-lg w-full">
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
                fixedWeeks
                locale={es}
                modifiers={modifiers}
                modifiersClassNames={modifierClassNames}
              />
            </CardContent>
          </Card>
          
          <Card className="shadow-lg w-full">
              <CardHeader>
                  <CardTitle className="text-xl">Próximas Citas</CardTitle>
                  <CardDescription>En los próximos 7 días</CardDescription>
              </CardHeader>
              <CardContent>
                  {upcomingAppointments.length > 0 ? (
                      <ul className="space-y-4 max-h-60 overflow-y-auto pr-2">
                          {upcomingAppointments.map(apt => (
                              <li key={apt.id} className="flex justify-between items-center text-sm">
                                  <div>
                                      <p className="font-semibold">{apt.clientName}</p>
                                      <p className="text-muted-foreground">{format(apt.dateTime, 'EEEE, d MMM', { locale: es })}</p>
                                  </div>
                                  <p className="font-semibold">{format(apt.dateTime, 'p', { locale: es })}</p>
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-muted-foreground text-center">No hay citas próximas.</p>
                  )}
              </CardContent>
          </Card>

        </aside>

        <section className="flex flex-col gap-4 overflow-y-auto pr-2">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                     <h2 className="text-2xl md:text-3xl font-bold font-headline text-primary">
                        {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Selecciona una fecha'}
                    </h2>
                     <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="md:hidden">
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-auto p-0 pt-0">
                           <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    if (!date) return;
                                    const newDate = new Date(date);
                                    const oldDate = selectedDate ? new Date(selectedDate) : new Date();
                                    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds(), oldDate.getMilliseconds());
                                    setSelectedDate(newDate);
                                    setIsCalendarOpen(false);
                                }}
                                initialFocus
                                locale={es}
                                modifiers={modifiers}
                                modifiersClassNames={modifierClassNames}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => { setEditingAppointment(undefined); setIsFormOpen(true); }} disabled={isCurrentDayBlocked}>
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Nueva Cita</span>
                    </Button>
                    <Button variant={isCurrentDayBlocked && !profile?.vacations?.some(vac => isWithinInterval(selectedDate!, {start: parseISO(vac.from), end: parseISO(vac.to)})) ? "destructive" : "outline"} onClick={handleToggleBlockDay} disabled={profile?.vacations?.some(vac => isWithinInterval(selectedDate!, {start: parseISO(vac.from), end: parseISO(vac.to)}))}>
                        {isCurrentDayBlocked ? <Unlock className="h-4 w-4 md:mr-2" /> : <Lock className="h-4 w-4 md:mr-2" />}
                        <span className="hidden md:inline">{isCurrentDayBlocked ? 'Desbloquear' : 'Bloquear'}</span>
                    </Button>
                </div>
            </div>

            <Card className="shadow-lg w-full md:hidden mb-4">
              <CardHeader>
                  <CardTitle className="text-xl">Próximas Citas</CardTitle>
                  <CardDescription>En los próximos 7 días</CardDescription>
              </CardHeader>
              <CardContent>
                  {upcomingAppointments.length > 0 ? (
                      <ul className="space-y-4 pr-2">
                          {upcomingAppointments.map(apt => (
                              <li key={apt.id} className="flex justify-between items-center text-sm">
                                  <div>
                                      <p className="font-semibold">{apt.clientName}</p>
                                      <p className="text-muted-foreground">{format(apt.dateTime, 'EEEE, d MMM', { locale: es })}</p>
                                  </div>
                                  <p className="font-semibold">{format(apt.dateTime, 'p', { locale: es })}</p>
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-muted-foreground text-center">No hay citas próximas.</p>
                  )}
              </CardContent>
            </Card>
          
          {isCurrentDayBlocked ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
                <Ban className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground">Este día no está disponible.</h3>
                <p className="text-muted-foreground mt-1">Está marcado como día bloqueado o período de vacaciones.</p>
            </div>
          ) : (
            <TimeSlotView
                slots={timeSlots}
                onSlotClick={(time) => {
                    const [hours, minutes] = time.split(':').map(Number);
                    const newSelectedDate = set(selectedDate!, { hours, minutes });
                    setSelectedDate(newSelectedDate);
                    setEditingAppointment(undefined);
                    setIsFormOpen(true);
                }}
                onAppointmentClick={(apt) => {
                    if (apt) {
                        const today = startOfToday();
                        const isPast = isBefore(apt.dateTime, today) && !isSameDay(apt.dateTime, today);
                        
                        if (isPast) {
                            setFinishingAppointment(apt);
                        } else {
                            if (apt.status === 'scheduled') {
                                setEditingAppointment(apt);
                                setIsFormOpen(true);
                            } else {
                                setFinishingAppointment(apt);
                            }
                        }
                    }
                }}
            />
          )}
           <div className="pt-4 mt-auto md:hidden">
             <Button 
                onClick={() => { setEditingAppointment(undefined); setIsFormOpen(true); }}
                disabled={isCurrentDayBlocked}
                className="w-full"
              >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Nueva Cita
              </Button>
           </div>
        </section>
      </main>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingAppointment ? 'Editar Cita' : 'Añadir Nueva Cita'}</DialogTitle>
            </DialogHeader>
            <AppointmentForm 
              onSubmit={editingAppointment ? (data) => handleUpdateAppointment(editingAppointment.id, data) : handleAddAppointment}
              appointment={editingAppointment}
              selectedDate={selectedDate!}
            />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la cita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <FinishAppointmentDialog 
        appointment={finishingAppointment}
        onOpenChange={() => setFinishingAppointment(null)}
        onAppointmentFinished={handleFinishAppointment}
      />

      <NewAppointmentConfirmationDialog
        appointment={confirmationAppointment}
        onOpenChange={() => setConfirmationAppointment(null)}
      />
    </div>
  );
}