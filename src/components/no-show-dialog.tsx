'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Appointment, BusinessProfile } from '@/lib/types';
import { Send } from 'lucide-react';

type NoShowDialogProps = {
  appointment: Appointment | null;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (appointmentId: string) => void;
};

const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

export function NoShowDialog({ appointment, onOpenChange, onConfirm }: NoShowDialogProps) {
  const [businessName, setBusinessName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (appointment) {
      try {
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) {
          const profile: BusinessProfile = JSON.parse(storedProfile);
          setBusinessName(profile.name);
        }
      } catch (error) {
        console.error("Failed to load business profile.", error);
      }
    } else {
      setBusinessName(null);
    }
  }, [appointment]);
  
  if (!appointment) return null;

  const baseMessage = `Hola ${appointment.clientName.split(' ')[0]},\nNotamos que no pudiste asistir a la cita programada para hoy. Entiendo que pueden surgir imprevistos, aunque agradezco siempre que sea posible, se avise con antelación en esos casos. Si lo deseas puedes reprogramar una nueva fecha.\nSaludos cordiales`;
  
  const finalMessage = businessName 
    ? `${baseMessage}\n\n_${businessName}_` 
    : baseMessage;
  
  const whatsappLink = `https://wa.me/${appointment.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(finalMessage)}`;

  const handleConfirm = () => {
    window.open(whatsappLink, '_blank');
    onConfirm(appointment.id);
  };

  return (
    <Dialog open={!!appointment} onOpenChange={() => onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como "No Presentado"</DialogTitle>
          <DialogDescription>
            Se enviará el siguiente mensaje al cliente y la cita no contará en la contabilidad.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 p-4 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
          {finalMessage}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
           <Button onClick={handleConfirm}>
               <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp y Marcar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
