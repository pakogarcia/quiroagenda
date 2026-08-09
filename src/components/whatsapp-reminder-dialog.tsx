
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type Appointment, type BusinessProfile } from '@/lib/types';
import { Send, Smartphone, MessageSquare, CheckCircle } from 'lucide-react';
import { format, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { useAppData } from '@/context/app-data-context';
import { ScrollArea } from './ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Label } from '@/components/ui/label';


type WhatsappReminderDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointments: Appointment[];
  onRemindersSent: (appointmentIds: string[]) => void;
};

type GeneratedMessage = {
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  message: string;
};

export function WhatsappReminderDialog({ isOpen, onOpenChange, appointments, onRemindersSent }: WhatsappReminderDialogProps) {
  const [step, setStep] = React.useState<'select' | 'generate' | 'finished'>('select');
  const [selectedAppointmentIds, setSelectedAppointmentIds] = React.useState<string[]>([]);
  const [generatedMessages, setGeneratedMessages] = React.useState<GeneratedMessage[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isConfirmSentOpen, setIsConfirmSentOpen] = React.useState(false);

  const { profile: businessProfile } = useAppData();

  const futureAppointments = React.useMemo(() => {
    return appointments.filter(apt => isFuture(apt.dateTime) && !apt.reminderSent);
  }, [appointments]);

  React.useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedAppointmentIds([]);
      setGeneratedMessages([]);
      setError('');
    }
  }, [isOpen]);

  const handleGenerateMessages = async () => {
    if (!businessProfile) {
      setError('Por favor, completa el perfil de tu negocio en la sección "Quién eres" para generar mensajes.');
      return;
    }
    
    setIsGenerating(true);
    setStep('generate');
    setError('');

    const selectedAppointments = futureAppointments.filter(apt => selectedAppointmentIds.includes(apt.id));
    const messages: GeneratedMessage[] = [];

    // Simulate AI generation
    setTimeout(() => {
      for (const apt of selectedAppointments) {
          messages.push({
          appointmentId: apt.id,
          clientName: apt.clientName,
          clientPhone: apt.clientPhone,
          message: `Hola ${apt.clientName.split(' ')[0]}, te recordamos tu cita el ${format(apt.dateTime, "EEEE, d 'de' MMMM 'a las' p", { locale: es })}. ¡Te esperamos en ${businessProfile.name}!`,
        });
      }
      setGeneratedMessages(messages);
      setStep('finished');
      setIsGenerating(false);
    }, 1000);
  };

  const handleMarkAsSent = () => {
    onRemindersSent(selectedAppointmentIds);
    setIsConfirmSentOpen(false);
    onOpenChange(false);
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedAppointmentIds(checked ? futureAppointments.map(apt => apt.id) : []);
  };

  const renderContent = () => {
    if (isGenerating) {
        return (
            <div className="space-y-4">
                 <p className="text-sm text-center text-muted-foreground animate-pulse">Generando recordatorios...</p>
                 {[...Array(Math.min(3, selectedAppointmentIds.length))].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg space-y-3">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                 ))}
            </div>
        );
    }
    
    if (step === 'finished') {
        if(generatedMessages.length === 0) {
            return (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>¡Nada que enviar!</AlertTitle>
                  <AlertDescription>
                    No se generaron mensajes. Es posible que los clientes seleccionados no tuvieran citas válidas.
                  </AlertDescription>
                </Alert>
            )
        }
        return (
            <ScrollArea className="h-[400px] pr-4">
                 <div className="space-y-4">
                    <AnimatePresence>
                    {generatedMessages.map((msg) => (
                        <motion.div 
                            key={msg.appointmentId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <MessageCard message={msg} />
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        )
    }

    // Step 'select'
    if (futureAppointments.length === 0) {
        return (
             <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>¡Todo al día!</AlertTitle>
                  <AlertDescription>
                    No hay citas futuras pendientes de recordatorio.
                  </AlertDescription>
            </Alert>
        )
    }

    return (
      <div className="space-y-4">
        {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="flex items-center space-x-2 border-b pb-4">
            <Checkbox 
                id="select-all" 
                onCheckedChange={handleSelectAll}
                checked={selectedAppointmentIds.length === futureAppointments.length && futureAppointments.length > 0}
            />
            <Label htmlFor="select-all" className="font-bold text-base">
                Seleccionar Todo ({futureAppointments.length})
            </Label>
        </div>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-3">
            {futureAppointments.map(apt => (
                <div key={apt.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                    <Checkbox
                        id={apt.id}
                        onCheckedChange={(checked) => {
                            setSelectedAppointmentIds(prev => 
                                checked ? [...prev, apt.id] : prev.filter(id => id !== apt.id)
                            );
                        }}
                        checked={selectedAppointmentIds.includes(apt.id)}
                    />
                    <Label htmlFor={apt.id} className="flex flex-col flex-grow cursor-pointer">
                        <span className="font-semibold">{apt.clientName}</span>
                        <span className="text-sm text-muted-foreground">{format(apt.dateTime, "eeee, d 'de' MMMM, p", { locale: es })}</span>
                    </Label>
                </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };
  
  const renderFooter = () => {
    if (step === 'finished') {
        if (generatedMessages.length > 0) {
            return (
                <Button variant="default" onClick={() => setIsConfirmSentOpen(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Enviados y Cerrar
                </Button>
            );
        }
        return <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>;
    }
    
    if (step === 'select' && futureAppointments.length > 0) {
        return (
            <Button onClick={handleGenerateMessages} disabled={selectedAppointmentIds.length === 0 || isGenerating}>
                <Send className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generando...' : `Generar ${selectedAppointmentIds.length} Recordatorio(s)`}
            </Button>
        );
    }
    
    return null;
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Recordatorios de Cita</DialogTitle>
          <DialogDescription>
            Selecciona las citas para las que quieres generar un recordatorio de WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
        <DialogFooter className="sm:justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={isConfirmSentOpen} onOpenChange={setIsConfirmSentOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Marcar como enviados?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción marcará los recordatorios como enviados y no podrás volver a generarlos desde esta pantalla. ¿Estás seguro?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkAsSent}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}


function MessageCard({ message }: { message: GeneratedMessage }) {
    const whatsappLink = `https://wa.me/${message.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message.message)}`;
    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="font-semibold text-primary flex items-center gap-2"><Smartphone className="w-4 h-4"/>{message.clientName}</div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                        <Send className="mr-2 h-4 w-4" /> Enviar
                    </Button>
                </a>
            </div>
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">"{message.message}"</p>
        </div>
    )
}
