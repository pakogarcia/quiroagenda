'use client';

import * as React from 'react';
import { addDays, format, isSameDay, parse } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar as CalendarIcon, User, Clock, Edit, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import { initialAppointments } from '@/lib/data';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppointmentForm } from '@/components/appointment-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AppHeader } from '@/components/layout/header';
import { WhatsappReminderDialog } from '@/components/whatsapp-reminder-dialog';

export default function Home() {
  const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

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
    const tomorrow = addDays(new Date(), 1);
    return appointments.filter(apt => isSameDay(apt.dateTime, tomorrow));
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <AppHeader
        onAddAppointment={() => {
          setEditingAppointment(undefined);
          setIsFormOpen(true);
        }}
        onSendReminders={() => setIsReminderDialogOpen(true)}
      />

      <main className="flex-1 grid md:grid-cols-[auto_1fr] gap-8 p-4 md:p-8 overflow-hidden">
        <aside className="hidden md:flex flex-col gap-8 items-center">
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
                fixedWeeks
              />
            </CardContent>
          </Card>
        </aside>

        <section className="flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="flex items-center justify-between md:hidden">
            <h2 className="text-2xl font-bold font-headline text-primary">
              {selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}
            </h2>
             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon"><CalendarIcon className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="w-auto">
                   <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            setSelectedDate(date);
                        }}
                        initialFocus
                    />
                </DialogContent>
            </Dialog>
          </div>
          <h2 className="hidden md:block text-3xl font-bold font-headline text-primary">
            {selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}
          </h2>
          
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
                               {format(apt.dateTime, 'p')}
                           </CardDescription>
                        </div>
                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            <span>Reminder {apt.reminderSent ? 'Sent' : 'Not Sent'}</span>
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
                <h3 className="text-xl font-semibold text-muted-foreground">No appointments scheduled for this day.</h3>
                <p className="text-muted-foreground mt-1">Select another date or add a new appointment.</p>
            </div>
          )}
        </section>
      </main>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingAppointment ? 'Edit Appointment' : 'Add New Appointment'}</DialogTitle>
            </DialogHeader>
            <AppointmentForm 
              onSubmit={editingAppointment ? (data) => handleUpdateAppointment(editingAppointment.id, data) : handleAddAppointment}
              appointment={editingAppointment}
              selectedDate={selectedDate}
            />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the appointment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
