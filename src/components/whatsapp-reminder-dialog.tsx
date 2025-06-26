'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateWhatsappReminder } from '@/ai/flows/generate-whatsapp-reminder';
import type { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Send, CheckCircle, Smartphone } from 'lucide-react';

type Reminder = {
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  message: string;
};

type WhatsappReminderDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointments: Appointment[];
  onRemindersSent: (appointmentIds: string[]) => void;
};

export function WhatsappReminderDialog({ isOpen, onOpenChange, appointments, onRemindersSent }: WhatsappReminderDialogProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const appointmentsToRemind = appointments.filter(apt => !apt.reminderSent);

  const handleGenerateReminders = useCallback(async () => {
    setIsLoading(true);
    setIsGenerated(false);
    setReminders([]);

    const generatedReminders: Reminder[] = [];
    for (const apt of appointmentsToRemind) {
      try {
        const result = await generateWhatsappReminder({
          clientName: apt.clientName,
          appointmentDateTime: format(apt.dateTime, 'PPPP p', { locale: es }),
          clientPhoneNumber: apt.clientPhone,
          businessName: 'QuiroAgenda',
        });
        generatedReminders.push({
          appointmentId: apt.id,
          clientName: apt.clientName,
          clientPhone: apt.clientPhone,
          message: result.whatsappMessage,
        });
      } catch (error) {
        console.error('Failed to generate reminder for', apt.clientName, error);
      }
    }
    
    setReminders(generatedReminders);
    setIsLoading(false);
    setIsGenerated(true);
  }, [appointmentsToRemind]);

  const handleMarkAsSent = () => {
    const sentIds = reminders.map(r => r.appointmentId);
    onRemindersSent(sentIds);
    onOpenChange(false);
  };
  
  React.useEffect(() => {
    if (!isOpen) {
      setIsGenerated(false);
      setReminders([]);
    }
  }, [isOpen]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      );
    }
    
    if(isGenerated && reminders.length > 0) {
        return (
            <ScrollArea className="h-[400px] pr-4">
                 <div className="space-y-4">
                    <AnimatePresence>
                    {reminders.map((reminder) => (
                        <motion.div 
                            key={reminder.appointmentId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                        <Card reminder={reminder} />
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        )
    }

    if(isGenerated && reminders.length === 0) {
        return (
             <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>¡Todo listo!</AlertTitle>
                <AlertDescription>
                    Todos los recordatorios para las citas de mañana ya han sido enviados.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {`Genera recordatorios de WhatsApp para ${
                appointmentsToRemind.length === 1
                  ? '1 cita pendiente'
                  : `${appointmentsToRemind.length} citas pendientes`
              } para mañana.`}
            </p>
        </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Recordatorios de WhatsApp</DialogTitle>
          <DialogDescription>
            Genera y envía recordatorios para las citas de mañana.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{renderContent()}</div>
        <DialogFooter className="sm:justify-between gap-2">
            {isGenerated && reminders.length > 0 ? (
                <Button variant="default" onClick={handleMarkAsSent}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar Todos como Enviados
                </Button>
            ) : <div />}

            {!isGenerated && (
                <Button onClick={handleGenerateReminders} disabled={isLoading || appointmentsToRemind.length === 0}>
                    <Send className="mr-2 h-4 w-4" />
                    {isLoading ? 'Generando...' : 'Generar Recordatorios'}
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Card({ reminder }: { reminder: Reminder }) {
    const whatsappLink = `https://wa.me/${reminder.clientPhone.replace(/\+/g, '')}?text=${encodeURIComponent(reminder.message)}`;
    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="font-semibold text-primary flex items-center gap-2"><Smartphone className="w-4 h-4"/>{reminder.clientName}</div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                        <Send className="mr-2 h-4 w-4" /> Enviar
                    </Button>
                </a>
            </div>
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground italic">"{reminder.message}"</p>
        </div>
    )
}
