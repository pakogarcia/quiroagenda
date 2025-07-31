
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
import { type Appointment, type Client, type BusinessProfile, Payment, Voucher } from '@/lib/types';
import { generateVoucherUpdateWhatsapp } from '@/ai/flows/generate-voucher-update-whatsapp';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const CLIENTS_STORAGE_KEY = 'quiroagenda_clients';
const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

const paymentSchema = z.object({
  paymentMethod: z.enum(['cash', 'bizum', 'voucher', 'paypal']),
  amount: z.coerce.number().optional(),
  voucherPayerId: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'cash' || data.paymentMethod === 'bizum' || data.paymentMethod === 'paypal') {
        return data.amount !== undefined && data.amount > 0;
    }
    if (data.paymentMethod === 'voucher') {
        return !!data.voucherPayerId;
    }
    return true;
}, {
    message: 'Se debe seleccionar un pagador para el bono o el importe debe ser mayor a 0.',
    path: ['amount'],
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
  const [allClients, setAllClients] = React.useState<Client[]>([]);
  const [voucherPayingClient, setVoucherPayingClient] = React.useState<Client | null>(null);
  const [generatedMessage, setGeneratedMessage] = React.useState('');
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
        amount: undefined,
        paymentMethod: 'cash',
        voucherPayerId: undefined,
    }
  });

  const clientsWithVouchers = React.useMemo(() => {
    return allClients.filter(c => c.voucher && c.voucher.sessions > 0);
  }, [allClients]);
  
  React.useEffect(() => {
    if (appointment) {
      setStep('selectAction');
      setClient(null);
      setVoucherPayingClient(null);
      setGeneratedMessage('');
      
      try {
        const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (storedClients) {
          const clients: Client[] = JSON.parse(storedClients);
          setAllClients(clients);
          const currentClient = clients.find(c => c.name.toLowerCase().trim() === appointment.clientName.toLowerCase().trim() || c.phone === appointment.clientPhone);
          setClient(currentClient || null);
          
          form.reset({ 
              amount: undefined, 
              paymentMethod: 'cash',
              voucherPayerId: currentClient?.voucher && currentClient.voucher.sessions > 0 ? currentClient.id : undefined,
          });
        }
      } catch (error) {
        console.error("Failed to load client data.", error);
      }
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
  
  const handlePendingPayment = () => {
    if (!appointment) return;
    const updatedAppointment: Appointment = { ...appointment, status: 'completed', payment: undefined };
    onAppointmentFinished(updatedAppointment);
    toast({
      title: 'Cita Completada',
      description: 'La cita se marcó como completada. El pago está pendiente.',
    });
  };

  const handlePaymentSubmit = (data: PaymentFormValues) => {
    if (!appointment) return;

    const payment: Payment = {
      method: data.paymentMethod,
      amount: data.paymentMethod === 'voucher' ? 0 : data.amount || 0,
      payerClientId: data.paymentMethod === 'voucher' ? data.voucherPayerId : undefined,
    };
    
    if (data.paymentMethod === 'voucher') {
        const payerClient = allClients.find(c => c.id === data.voucherPayerId);
        if (!payerClient || !payerClient.voucher) {
            toast({ title: 'Error', description: 'El cliente seleccionado para pagar con bono no es válido.', variant: 'destructive' });
            return;
        }

        const updatedVoucher: Voucher = { ...payerClient.voucher, sessions: payerClient.voucher.sessions - 1 };
        const updatedPayerClient: Client = { ...payerClient, voucher: updatedVoucher };
        setVoucherPayingClient(updatedPayerClient);
        
        try {
            const updatedAllClients = allClients.map(c => c.id === updatedPayerClient.id ? updatedPayerClient : c);
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedAllClients));
            setAllClients(updatedAllClients);
            
            generateAndShowVoucherMessage(updatedPayerClient);
            
        } catch (error) {
            console.error("Failed to update client voucher.", error);
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el bono del cliente.',
                variant: 'destructive',
            });
        }
    } else {
        const updatedAppointment: Appointment = { ...appointment, status: 'completed', payment };
        onAppointmentFinished(updatedAppointment);
        toast({
          title: 'Pago registrado',
          description: `Se ha registrado un pago de ${(data.amount || 0).toFixed(2)}€ con ${data.paymentMethod}.`,
        });
    }
  };

  const handleVoucherMessageSentAndClose = () => {
    if (!appointment || !voucherPayingClient) return;
    const payment: Payment = {
        method: 'voucher',
        amount: 0,
        payerClientId: voucherPayingClient.id,
    };
    const updatedAppointment: Appointment = { ...appointment, status: 'completed', payment };
    onAppointmentFinished(updatedAppointment);
    toast({
        title: 'Bono actualizado',
        description: `Se ha descontado una sesión del bono de ${voucherPayingClient.name}.`,
    });
  }

  const generateAndShowVoucherMessage = async (payerClient: Client) => {
    setStep('voucherUpdateMessage');
    if (!payerClient.voucher) return;
    try {
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        const profile: BusinessProfile | null = storedProfile ? JSON.parse(storedProfile) : null;
        const result = await generateVoucherUpdateWhatsapp({
            clientName: payerClient.name.split(' ')[0],
            remainingSessions: payerClient.voucher.sessions,
            businessName: profile?.name,
            instagram: profile?.instagram,
        });
        setGeneratedMessage(result.whatsappMessage);
    } catch(e) {
        console.error("Failed to generate voucher update message", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo generar el mensaje de actualización del bono."
        });
        handleVoucherMessageSentAndClose(); // Close even if message fails
    }
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }
  
  const paymentMethod = form.watch('paymentMethod');

  const renderContent = () => {
    switch (step) {
      case 'paymentForm':
        return (
          <Form {...form}>
            <form id="payment-form" onSubmit={form.handleSubmit(handlePaymentSubmit)} className="space-y-6">
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
                            <FormControl><RadioGroupItem value="cash" /></FormControl>
                            <FormLabel className="font-normal">Efectivo</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="bizum" /></FormControl>
                            <FormLabel className="font-normal">Bizum</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="paypal" /></FormControl>
                            <FormLabel className="font-normal">PayPal</FormLabel>
                          </FormItem>
                          {clientsWithVouchers.length > 0 && (
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl><RadioGroupItem value="voucher" /></FormControl>
                                  <FormLabel className="font-normal">Bono</FormLabel>
                              </FormItem>
                          )}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {paymentMethod === 'voucher' && (
                    <FormField
                        control={form.control}
                        name="voucherPayerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pagar con el bono de...</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona el cliente que paga" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clientsWithVouchers.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {`${c.name} ${c.lastName}`} ({c.voucher?.sessions} restantes)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {(paymentMethod === 'cash' || paymentMethod === 'bizum' || paymentMethod === 'paypal') && (
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Importe Abonado (€)</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="p. ej., 40" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </form>
          </Form>
        );
      case 'voucherUpdateMessage':
        if (!voucherPayingClient) return null;
        const whatsappLink = `https://wa.me/${voucherPayingClient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(generatedMessage)}`;
        return (
            <div>
                <DialogDescription>
                    Se ha actualizado el bono de **{voucherPayingClient.name}**. Puedes enviarle el siguiente mensaje.
                </DialogDescription>
                <div className="my-4 p-4 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
                    {generatedMessage || "Generando mensaje..."}
                </div>
                 <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={handleVoucherMessageSentAndClose}>
                    <Button disabled={!generatedMessage} className="w-full">
                        <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp y Cerrar
                    </Button>
                </a>
            </div>
        );
      case 'selectAction':
      default:
        return (
          <div className="flex flex-col gap-4">
            <Button size="lg" onClick={() => setStep('paymentForm')}>Registrar Pago</Button>
            <Button size="lg" variant="outline" onClick={handlePendingPayment}>Completada (Pendiente de Pago)</Button>
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
            <Button type="submit" form="payment-form">Confirmar</Button>
          </>
        );
      case 'voucherUpdateMessage':
        return <Button variant="secondary" onClick={handleVoucherMessageSentAndClose}>Cerrar sin enviar</Button>;
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
          <DialogTitle>Finalizar Cita: {appointment?.clientName}</DialogTitle>
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
