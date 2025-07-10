
'use client';

import * as React from 'react';
import { addDays, format, isSameDay, isBefore, startOfToday, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Edit, Trash2, Send, CheckCircle, XCircle, Plus, Gift, Euro, Lock, Unlock } from 'lucide-react';
import { getInitialAppointments } from '@/lib/data';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppointmentForm } from '@/components/appointment-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AppHeader } from '@/components/layout/header';
import { WhatsappReminderDialog } from '@/components/whatsapp-reminder-dialog';
import { FinishAppointmentDialog } from '@/components/finish-appointment-dialog';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SplashScreen } from '@/components/layout/splash-screen';
import { NewAppointmentConfirmationDialog } from '@/components/new-appointment-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';

const APPOINTMENTS_STORAGE_KEY = 'quiroagenda_appointments';
const BLOCKED_DAYS_STORAGE_KEY = 'quiroagenda_blocked_days';

export default function Home() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [blockedDays, setBlockedDays] = React.useState<string[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      const initialAppointments = storedAppointments
        ? JSON.parse(storedAppointments)
            .map((apt: any) => ({
              ...apt,
              dateTime: new Date(apt.dateTime),
              status: apt.status || 'scheduled',
              payment: apt.payment || undefined,
            }))
            .filter((apt: Appointment) => apt.dateTime && !isNaN(apt.dateTime.getTime()))
        : getInitialAppointments(new Date());
      setAppointments(initialAppointments);

      const storedBlockedDays = localStorage.getItem(BLOCKED_DAYS_STORAGE_KEY);
      if (storedBlockedDays) {
        setBlockedDays(JSON.parse(storedBlockedDays));
      }
    } catch (error) {
      console.error("Failed to load data, using initial data.", error);
      setAppointments(getInitialAppointments(new Date()));
    }
    setSelectedDate(new Date());
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (isClient) {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    }
  }, [appointments, isClient]);

  React.useEffect(() => {
    if (isClient) {
        localStorage.setItem(BLOCKED_DAYS_STORAGE_KEY, JSON.stringify(blockedDays));
    }
  }, [blockedDays, isClient]);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | undefined>(undefined);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = React.useState<string | null>(null);

  const [isReminderDialogOpen, setIsReminderDialogOpen] = React.useState(false);
  const [finishingAppointment, setFinishingAppointment] = React.useState<Appointment | null>(null);
  const [confirmationAppointment, setConfirmationAppointment] = React.useState<Appointment | null>(null);

  const isDayBlocked = React.useCallback((date: Date): boolean => {
    return blockedDays.includes(format(date, 'yyyy-MM-dd'));
  }, [blockedDays]);

  const dailyAppointments = React.useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter((apt) => isSameDay(apt.dateTime, selectedDate))
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [appointments, selectedDate]);
  
  const futureAppointments = React.useMemo(() => {
    if (!isClient) return [];
    const today = startOfToday();
    return appointments.filter(apt => (isSameDay(apt.dateTime, today) || isBefore(today, apt.dateTime)) && apt.status === 'scheduled');
  }, [appointments, isClient]);

  const upcomingAppointments = React.useMemo(() => {
    if (!isClient) return [];
    const today = startOfToday();
    const nextWeek = addDays(today, 7);
    
    return appointments
      .filter(apt => {
        const aptDay = startOfDay(apt.dateTime);
        return apt.status === 'scheduled' && !isDayBlocked(aptDay) && (isSameDay(aptDay, today) || (isBefore(aptDay, nextWeek) && !isBefore(aptDay, today)));
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .slice(0, 7); // To ensure we only show a limited number
  }, [appointments, isClient, isDayBlocked]);

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
    const blockedDates = blockedDays.map(d => new Date(d));

    return {
      blocked: (date: Date) => blockedDays.includes(format(date, 'yyyy-MM-dd')),
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
  }, [appointmentsByDay, isDayBlocked, blockedDays]);

  const modifierClassNames = {
    blocked: 'blocked-day',
    oneAppointment: 'one-appointment',
    twoAppointments: 'two-appointments',
    threeOrMoreAppointments: 'three-or-more-appointments',
  };

  const handleAddAppointment = (data: Omit<Appointment, 'id' | 'reminderSent' | 'status' | 'payment'>) => {
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

  const handleUpdateAppointment = (id: string, data: Omit<Appointment, 'id' | 'reminderSent' | 'status' | 'payment'>) => {
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

  const openEditForm = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };
  
  const openDeleteConfirm = (id: string) => {
    setDeletingAppointmentId(id);
    setIsDeleteConfirmOpen(true);
  };
  
  const handleSetRemindersSent = (appointmentIds: string[]) => {
    setAppointments(prev => prev.map(apt => 
      appointmentIds.includes(apt.id) ? { ...apt, reminderSent: true } : apt
    ));
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


  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'completed': return <Badge variant="secondary">Completada</Badge>;
      case 'no-show': return <Badge variant="destructive">No Presentado</Badge>;
      case 'scheduled':
      default:
        return null;
    }
  }
  
  if (!isClient) {
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
                            <Button variant="outline" size="icon" className="md:hidden"><CalendarIcon className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="w-auto p-0">
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
                    <Button 
                        onClick={() => { setEditingAppointment(undefined); setIsFormOpen(true); }}
                        disabled={isCurrentDayBlocked}
                    >
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Nueva Cita</span>
                    </Button>
                    <Button variant="outline" onClick={() => setIsReminderDialogOpen(true)}>
                        <Send className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Recordatorios</span>
                    </Button>
                    <Button variant={isCurrentDayBlocked ? "destructive" : "outline"} onClick={handleToggleBlockDay}>
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
                <Lock className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground">Este día está bloqueado.</h3>
                <p className="text-muted-foreground mt-1">No se pueden agendar citas. Puedes desbloquearlo para continuar.</p>
            </div>
          ) : dailyAppointments.length > 0 ? (
            <motion.div layout className="space-y-4 max-w-xl">
              <AnimatePresence>
                {dailyAppointments.map((apt, index) => (
                  <motion.div
                    key={apt.id}
                    layout
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="origin-top"
                  >
                    <Card className={`shadow-md hover:shadow-xl transition-shadow duration-300 group ${apt.status !== 'scheduled' ? 'bg-muted/50' : ''}`}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl text-accent">{apt.clientName}</CardTitle>
                                {getStatusBadge(apt.status)}
                            </div>
                           <CardDescription className="flex items-center gap-2 pt-1">
                               <Clock className="w-4 h-4"/>
                               {format(apt.dateTime, 'p', { locale: es })}
                           </CardDescription>
                        </div>
                         <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {apt.status === 'scheduled' && (isBefore(apt.dateTime, new Date()) || isSameDay(apt.dateTime, new Date())) && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setFinishingAppointment(apt)}>
                                                <Euro className="w-5 h-5 text-green-600" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Finalizar Cita (Pagar / No presentado)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => openEditForm(apt)} disabled={apt.status !== 'scheduled'}>
                                            <Edit className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Editar cita</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(apt.id)}>
                                            <Trash2 className="w-5 h-5 text-destructive" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Eliminar cita</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                         </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{apt.notes}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                            {apt.reminderSent ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-slate-400" />}
                            <span>{apt.reminderSent ? 'Recordatorio Enviado' : 'Recordatorio No Enviado'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                <CalendarIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground">No hay citas programadas para este día.</h3>
                <p className="text-muted-foreground mt-1">Selecciona otra fecha o añade una nueva cita.</p>
            </div>
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
              blockedDays={blockedDays}
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
      
      <WhatsappReminderDialog
        isOpen={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
        appointments={futureAppointments}
        onRemindersSent={handleSetRemindersSent}
      />

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

    