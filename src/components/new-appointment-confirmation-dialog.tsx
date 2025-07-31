
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type Appointment, type BusinessProfile } from '@/lib/types';
import { Send, Smartphone, MessageSquare } from 'lucide-react';
import { generateNewAppointmentWhatsapp } from '@/ai/flows/generate-new-appointment-whatsapp';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type NewAppointmentConfirmationDialogProps = {
  appointment: Appointment | null;
  onOpenChange: (isOpen: boolean) => void;
};

const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

export function NewAppointmentConfirmationDialog({ appointment, onOpenChange }: NewAppointmentConfirmationDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedMessage, setGeneratedMessage] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (appointment) {
      const generateMessage = async () => {
        setIsLoading(true);
        setGeneratedMessage('');
        setError('');
        try {
          const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
          const profile: BusinessProfile | null = storedProfile ? JSON.parse(storedProfile) : null;

          if (!profile || !profile.address) {
            setError('No se ha configurado la dirección del negocio en la sección "Quién eres". Por favor, completa tu perfil.');
            setIsLoading(false);
            return;
          }

          const result = await generateNewAppointmentWhatsapp({
            clientName: appointment.clientName.split(' ')[0],
            appointmentDateTime: format(appointment.dateTime, "EEEE, d 'de' MMMM 'de' yyyy 'a las' p", { locale: es }),
            businessAddress: profile.address,
            businessName: profile.name,
          });

          setGeneratedMessage(result.whatsappMessage);
        } catch (e) {
          console.error("Failed to generate confirmation message.", e);
          setError('No se pudo generar el mensaje de confirmación.');
        } finally {
          setIsLoading(false);
        }
      };

      generateMessage();
    }
  }, [appointment]);
  
  if (!appointment) return null;
  
  const whatsappLink = `https://wa.me/${appointment.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(generatedMessage)}`;

  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={!!appointment} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cita Confirmada</DialogTitle>
          <DialogDescription>
            La cita ha sido creada/actualizada correctamente. Puedes enviar una confirmación por WhatsApp al cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 space-y-4">
          {isLoading && (
            <div className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <MessageSquare className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {generatedMessage && (
            <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
              <p className='font-semibold text-primary flex items-center gap-2 mb-2'><Smartphone className="w-4 h-4"/>{appointment.clientName}</p>
              <p>{generatedMessage}</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
           <Button variant="outline" onClick={handleClose}>Cerrar</Button>
           {generatedMessage && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={handleClose}>
                <Button>
                    <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp
                </Button>
            </a>
           )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    