'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/lib/types';
import { Send } from 'lucide-react';

type NoShowDialogProps = {
  appointment: Appointment | null;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (appointmentId: string) => void;
};

export function NoShowDialog({ appointment, onOpenChange, onConfirm }: NoShowDialogProps) {
  if (!appointment) return null;

  const message = `Hola ${appointment.clientName.split(' ')[0]},\nNotamos que no pudiste asistir a la cita programada para hoy. Entiendo que pueden surgir imprevistos, aunque agradezco siempre que sea posible, se avise con antelación en esos casos. Si lo deseas puedes reprogramar una nueva fecha.\nSaludos cordiales`;
  
  const whatsappLink = `https://wa.me/${appointment.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

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
          {message}
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
