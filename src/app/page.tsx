
'use client';

import * as React from 'react';
import { addDays, format, isSameDay, startOfDay, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Edit, Trash2, Send, CheckCircle, XCircle, Plus } from 'lucide-react';
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

const APPOINTMENTS_STORAGE_KEY = 'quiroagenda_appointments';

export default function Home() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false);
  const [tomorrow, setTomorrow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (storedAppointments) {
        const parsedAppointments = JSON.parse(storedAppointments).map((apt: Omit<Appointment, 'dateTime'> & { dateTime: string }) => ({
          ...apt,
          dateTime: new Date(apt.dateTime),
        }));
        setAppointments(parsedAppointments);
      } else {
        setAppointments(getInitialAppointments(new Date()));
      }
    } catch (error) {
      console.error("Failed to load appointments, using initial data.", error);
      setAppointments(getInitialAppointments(new Date()));
    }
    const today = new Date();
    setTomorrow(addDays(today, 1));
    setSelectedDate(today);
    setInitialLoadComplete(true);
  }, []);

  React.useEffect(() => {
    if (initialLoadComplete) {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    }
  }, [appointments, initialLoadComplete]);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | undefined>(undefined);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = React.useState<string | null>(null);

  const [isReminderDialogOpen, setIsReminderDialogOpen] = React.useState(false);

  const dailyAppointments = React.useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter((apt) => isSameDay(apt.dateTime, selectedDate))
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [appointments, selectedDate]);
  
  const tomorrowAppointments = React.useMemo(() => {
    if (!tomorrow) return [];
    return appointments.filter(apt => isSameDay(apt.dateTime, tomorrow));
  }, [appointments, tomorrow]);

  const upcomingAppointments = React.useMemo(() => {
    const today = startOfDay(new Date());
    const sevenDaysFromNow = addDays(today, 8);
    
    return appointments
      .filter(apt => {
        const aptDate = startOfDay(apt.dateTime);
        return isAfter(aptDate, today) && isBefore(aptDate, sevenDaysFromNow);
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [appointments]);

  const handleAddAppointment = (data: Omit<Appointment, 'id' | 'reminderSent'>) => {
    const newAppointment: Appointment = {
      ...data,
      id: crypto.randomUUID(),
      reminderSent: false,
    };
    setAppointments([...appointments, newAppointment]);
    setIsFormOpen(false);
  };

  const handleUpdateAppointment = (id: string, data: Omit<Appointment, 'id' | 'reminderSent'>) => {
    setAppointments(
      appointments.map((apt) => (apt.id === id ? { ...apt, ...data } : apt))
    );
    setIsFormOpen(false);
    setEditingAppointment(undefined);
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
  
  if (!initialLoadComplete) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <AppHeader />

      <main className="flex-1 grid md:grid-cols-[auto_1fr] gap-8 p-4 md:p-8 overflow-hidden">
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
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="md:hidden"><CalendarIcon className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="w-auto">
                           <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    if (!date) return;
                                    const newDate = new Date(date);
                                    const oldDate = selectedDate ? new Date(selectedDate) : new Date();
                                    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds(), oldDate.getMilliseconds());
                                    setSelectedDate(newDate);
                                    const dialogTrigger = document.querySelector('[aria-controls="radix-1"]');
                                    if (dialogTrigger instanceof HTMLElement) {
                                        dialogTrigger.click();
                                    }
                                }}
                                initialFocus
                                locale={es}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsReminderDialogOpen(true)}>
                        <Send className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Enviar Recordatorios</span>
                    </Button>
                    <Button onClick={() => {
                        setEditingAppointment(undefined);
                        setIsFormOpen(true);
                    }}>
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Añadir Cita</span>
                    </Button>
                </div>
            </div>
          
          {dailyAppointments.length > 0 ? (
            <motion.div layout className="space-y-4">
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
                    <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 group">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex flex-col">
                           <CardTitle className="text-xl text-accent">{apt.clientName}</CardTitle>
                           <CardDescription className="flex items-center gap-2 pt-1">
                               <Clock className="w-4 h-4"/>
                               {format(apt.dateTime, 'p', { locale: es })}
                           </CardDescription>
                        </div>
                         <div className="flex items-center gap-2 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            <Button variant="ghost" size="icon" onClick={() => openEditForm(apt)}>
                                <Edit className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(apt.id)}>
                                <Trash2 className="w-5 h-5 text-destructive" />
                            </Button>
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
      
      <WhatsappReminderDialog
        isOpen={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
        appointments={tomorrowAppointments}
        onRemindersSent={handleSetRemindersSent}
      />
    </div>
  );
}
