'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Appointment, type Client, type BusinessProfile, Payment, Voucher } from '@/lib/types';
import { generateVoucherUpdateWhatsapp } from '@/ai/flows/generate-voucher-update-whatsapp';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

const CLIENTS_STORAGE_KEY = 'quiroagenda_clients';
const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

const paymentSchema = z.object({
  paymentMethod: z.enum(['cash', 'bizum', 'voucher']),
  amount: z.coerce.number().positive({ message: 'El importe debe ser mayor que 0.' }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type FinishAppointmentDialogProps = {
  appointment: Appointment | null;
  onOpenChange: (isOpen: boolean) => void;
  onAppointmentFinished: (updatedAppointment: Appointment) => void;
};

export function FinishAppointmentDialog({ appointment, onOpenChange, onAppointmentFinished }: FinishAppointmentDialogProps) {
  const [step, setStep] = React.useState<'selectAction' | 'paymentForm' | 'voucherUpdateMessage'>('selectAction');
  const [client, setClient] = React.useState<Client | null>(null);
  const [generatedMessage, setGeneratedMessage] = React.useState('');
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
  });
  
  React.useEffect(() => {
    if (appointment) {
      try {
        const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (storedClients) {
          const clients: Client[] = JSON.parse(storedClients);
          const currentClient = clients.find(c => c.name.toLowerCase() === appointment.clientName.toLowerCase() || c.phone === appointment.clientPhone);
          setClient(currentClient || null);
        }
      } catch (error) {
        console.error("Failed to load client data.", error);
      }
    } else {
      // Reset state on close
      setStep('selectAction');
      setClient(null);
      setGeneratedMessage('');
      form.reset();
    }
  }, [appointment, form]);
  
  const handleNoShow = () => {
    if (!appointment) return;
    const updatedAppointment: Appointment = { ...appointment, status: 'no-show' };
    onAppointmentFinished(updatedAppointment);
    toast({
      title: 'Cita actualizada',
      description: 'Se ha marcado la cita como "No Presentado".',
    });
  };

  const handlePaymentSubmit = (data: PaymentFormValues) => {
    if (!appointment) return;

    const payment: Payment = {
      method: data.paymentMethod,
      amount: data.amount,
    };
    
    let updatedAppointment: Appointment = { ...appointment, status: 'completed', payment };
    onAppointmentFinished(updatedAppointment);

    if (data.paymentMethod === 'voucher' && client?.voucher) {
        const updatedVoucher: Voucher = { ...client.voucher, sessions: client.voucher.sessions - 1 };
        const updatedClient: Client = { ...client, voucher: updatedVoucher };
        
        try {
            const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
            const clients: Client[] = storedClients ? JSON.parse(storedClients) : [];
            const newClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(newClients));

            generateAndShowVoucherMessage(updatedClient.name.split(' ')[0], updatedVoucher.sessions);
            
        } catch (error) {
            console.error("Failed to update client voucher.", error);
        }
    } else {
        toast({
          title: 'Pago registrado',
          description: `Se ha registrado un pago de ${data.amount.toFixed(2)}€ con ${data.paymentMethod === 'cash' ? 'Efectivo' : 'Bizum'}.`,
        });
    }
  };

  const generateAndShowVoucherMessage = async (clientName: string, remainingSessions: number) => {
    if (!client) return;
    setStep('voucherUpdateMessage');
    try {
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        const profile: BusinessProfile | null = storedProfile ? JSON.parse(storedProfile) : null;
        const result = await generateVoucherUpdateWhatsapp({
            clientName,
            remainingSessions,
            businessName: profile?.name,
        });
        setGeneratedMessage(result.whatsappMessage);
    } catch(e) {
        console.error("Failed to generate voucher update message", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo generar el mensaje de actualización del bono."
        });
        handleClose();
    }
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }

  const renderContent = () => {
    switch (step) {
      case 'paymentForm':
        return (
          <Form {...form}>
            <form id="payment-form" onSubmit={form.handleSubmit(handlePaymentSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importe Abonado (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="p. ej., 40" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Método de Pago</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="cash" />
                          </FormControl>
                          <FormLabel className="font-normal">Efectivo</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="bizum" />
                          </FormControl>
                          <FormLabel className="font-normal">Bizum</FormLabel>
                        </FormItem>
                        {client?.voucher && client.voucher.sessions > 0 && (
                             <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="voucher" />
                                </FormControl>
                                <FormLabel className="font-normal">Bono ({client.voucher.sessions} restantes)</FormLabel>
                            </FormItem>
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
      case 'voucherUpdateMessage':
        const whatsappLink = `https://wa.me/${client?.phone.replace(/\D/g, '')}?text=${encodeURIComponent(generatedMessage)}`;
        return (
            <div>
                <DialogDescription>
                    Se ha actualizado el bono del cliente. Puedes enviarle el siguiente mensaje.
                </DialogDescription>
                <div className="my-4 p-4 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
                    {generatedMessage || "Generando mensaje..."}
                </div>
                 <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={handleClose}>
                    <Button disabled={!generatedMessage} className="w-full">
                        <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp y Cerrar
                    </Button>
                </a>
            </div>
        );
      case 'selectAction':
      default:
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setStep('paymentForm')}>Registrar Pago</Button>
            <Button size="lg" variant="destructive" onClick={handleNoShow}>Marcar No Presentado</Button>
          </div>
        );
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'paymentForm':
        return (
          <>
            <Button variant="ghost" onClick={() => setStep('selectAction')}>Volver</Button>
            <Button type="submit" form="payment-form">Confirmar Pago</Button>
          </>
        );
      case 'voucherUpdateMessage':
        return <Button variant="secondary" onClick={handleClose}>Cerrar</Button>;
      case 'selectAction':
      default:
        return <Button variant="secondary" onClick={handleClose}>Cancelar</Button>;
    }
  }

  if (!appointment) return null;

  return (
    <Dialog open={!!appointment} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar Cita: {appointment.clientName}</DialogTitle>
          {step === 'selectAction' && (
            <DialogDescription>Elige una acción para esta cita.</DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
            {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
