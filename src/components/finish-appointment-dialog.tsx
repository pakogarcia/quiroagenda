
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type Appointment, type Client, type BusinessProfile, Payment, Voucher } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { useAppData } from '@/context/app-data-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { NewAppointmentConfirmationDialog } from './new-appointment-confirmation-dialog';

const paymentSchema = z.object({
  paymentMethod: z.enum(['cash', 'bizum', 'voucher', 'paypal']),
  amount: z.coerce.number().optional(),
  voucherPayerId: z.string().optional(),
  refundVoucher: z.boolean().optional(),
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
  isEditing?: boolean;
};

export function FinishAppointmentDialog({ appointment, onOpenChange, onAppointmentFinished, isEditing = false }: FinishAppointmentDialogProps) {
  const { clients, setClients } = useAppData();
  const [step, setStep] = React.useState<'selectAction' | 'paymentForm'>('selectAction');
  const [confirmationData, setConfirmationData] = React.useState<{client: Client, remainingSessions: number, informativeOnly?: boolean} | null>(null);
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
        amount: undefined,
        paymentMethod: 'cash',
        voucherPayerId: undefined,
        refundVoucher: true,
    }
  });

  React.useEffect(() => {
    if (appointment) {
        const initialStep = isEditing ? 'paymentForm' : 'selectAction';
        setStep(initialStep);
        setConfirmationData(null);

        const defaultPayment = appointment.payment;
        const currentClient = clients.find(c => c.phone === appointment.clientPhone);
        
        const defaultAmount = defaultPayment?.method !== 'voucher'
            ? defaultPayment?.amount ?? appointment?.servicePrice
            : appointment?.servicePrice;

        form.reset({
            amount: defaultAmount ?? undefined,
            paymentMethod: defaultPayment?.method || (currentClient?.voucher && currentClient.voucher.sessions > 0 ? 'voucher' : 'cash'),
            voucherPayerId: defaultPayment?.method === 'voucher'
                ? defaultPayment.payerClientId
                : (currentClient?.voucher && currentClient.voucher.sessions > 0 ? currentClient.id : undefined),
            refundVoucher: true,
        });
    }
  }, [appointment, isEditing, clients, form]);
  
  const clientsWithVouchers = React.useMemo(() => {
    const clientSet = new Set<Client>();
    
    if (appointment) {
        const currentClient = clients.find(c => c.phone === appointment.clientPhone);
        if (currentClient?.voucher && currentClient.voucher.sessions > 0) {
            clientSet.add(currentClient);
        }
    }
    
    clients.forEach(c => {
        if (c.voucher && c.voucher.sessions > 0) {
            clientSet.add(c);
        }
    });
    
    return Array.from(clientSet);
  }, [clients, appointment]);

  const handleNoShow = () => {
    if (!appointment) return;
    const updatedAppointment: Appointment = { ...appointment, status: 'no-show' };
    onAppointmentFinished(updatedAppointment);
    toast({
      title: 'Cita actualizada',
      description: 'Se ha marcado la cita como "No Presentado".',
    });
    onOpenChange(false);
  };
  
  const handlePendingPayment = () => {
    if (!appointment) return;
    const updatedAppointment: Appointment = { ...appointment, status: 'completed', payment: undefined };
    onAppointmentFinished(updatedAppointment);
    toast({
      title: 'Cita Completada',
      description: 'La cita se marcó como completada. El pago está pendiente.',
    });
    onOpenChange(false);
  };

  const handlePaymentSubmit = async (data: PaymentFormValues) => {
    if (!appointment) return;

    if (isEditing && appointment.payment?.method === 'voucher' && data.paymentMethod !== 'voucher') {
        if (data.refundVoucher) {
            const originalPayer = clients.find(c => c.id === appointment.payment?.payerClientId);
            if (originalPayer?.voucher) {
                const updatedVoucher: Voucher = { 
                    ...originalPayer.voucher, 
                    sessions: originalPayer.voucher.sessions + 1 
                };
                const updatedClient: Client = { ...originalPayer, voucher: updatedVoucher };
                setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
                toast({ title: 'Sesión devuelta', description: `Se ha devuelto una sesión al bono de ${originalPayer.name}.` });
            }
        }
    }

    if (data.paymentMethod === 'voucher') {
        const payerClient = clients.find(c => c.id === data.voucherPayerId);
        if (!payerClient || !payerClient.voucher || payerClient.voucher.sessions <= 0) {
            toast({ title: 'Error', description: 'El cliente seleccionado no tiene un bono válido o no tiene sesiones.', variant: 'destructive' });
            return;
        }

        const updatedVoucher: Voucher = { ...payerClient.voucher, sessions: payerClient.voucher.sessions - 1 };
        const updatedPayerClient: Client = { ...payerClient, voucher: updatedVoucher };
        setClients(prevClients => prevClients.map(c => c.id === updatedPayerClient.id ? updatedPayerClient : c));
        
        const payment: Payment = { method: 'voucher', amount: 0, payerClientId: data.voucherPayerId };
        const updatedAppointment: Appointment = { ...appointment, status: 'completed', payment };
        
        onAppointmentFinished(updatedAppointment);
        
        toast({
            title: 'Bono actualizado',
            description: `Se ha descontado una sesión del bono de ${updatedPayerClient.name}.`,
        });

        // Set data for the confirmation dialog and close the current one
        setConfirmationData({ client: updatedPayerClient, remainingSessions: updatedVoucher.sessions, informativeOnly: false });
        onOpenChange(false);

    } else {
        const payment: Payment = { method: data.paymentMethod, amount: data.amount || 0 };
        const updatedAppointment: Appointment = { ...appointment, status: 'completed', payment };
        onAppointmentFinished(updatedAppointment);
        toast({
          title: isEditing ? 'Pago actualizado' : 'Pago registrado',
          description: `Se ha registrado un pago de ${(data.amount || 0).toFixed(2)}€.`,
        });
        onOpenChange(false);
    }
  };
  
  const paymentMethod = form.watch('paymentMethod');
  const wasPaidWithVoucher = appointment?.payment?.method === 'voucher';
  const isChangingFromVoucher = isEditing && wasPaidWithVoucher && paymentMethod !== 'voucher';

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
                          {(clientsWithVouchers.length > 0 || (isEditing && appointment?.payment?.method === 'voucher')) && (
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing && wasPaidWithVoucher}>
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
                                {isEditing && wasPaidWithVoucher && <FormMessage className="text-xs text-muted-foreground mt-1">No se puede cambiar el pagador de un bono ya utilizado. Cambia a otro método de pago si es necesario.</FormMessage>}
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
                
                {isChangingFromVoucher && (
                    <FormField
                        control={form.control}
                        name="refundVoucher"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                    Devolver la sesión al bono original
                                    </FormLabel>
                                    <FormMessage>
                                    Al marcar esta casilla, se añadirá 1 sesión al bono del cliente que pagó originalmente.
                                    </FormMessage>
                                </div>
                            </FormItem>
                        )}
                    />
                )}

            </form>
          </Form>
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
            <Button variant="ghost" onClick={isEditing ? () => onOpenChange(false) : () => setStep('selectAction')}>
              {isEditing ? 'Cancelar' : 'Volver'}
            </Button>
            <Button type="submit" form="payment-form" disabled={form.formState.isSubmitting}>Confirmar</Button>
          </>
        );
      case 'selectAction':
      default:
        return <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>;
    }
  }

  if (!appointment && !confirmationData) return null;

  return (
    <>
        <Dialog open={!!appointment} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Pago' : 'Finalizar Cita'}: {appointment?.clientName}</DialogTitle>
            {step === 'selectAction' && (
                <DialogDescription>Elige una acción para esta cita.</DialogDescription>
            )}
            {step === 'paymentForm' && (
                <DialogDescription>
                {isEditing ? 'Modifica los detalles del pago.' : 'Registra el pago de la cita.'}
                </DialogDescription>
            )}
            {step === 'paymentForm' && isEditing && (
                <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                        {wasPaidWithVoucher ? "Editando Pago de Bono" : "Editando un Pago Registrado"}
                    </AlertTitle>
                    <AlertDescription>
                        {wasPaidWithVoucher
                            ? 'Si cambias el método, puedes optar por devolver la sesión al bono original.'
                            : 'Ten cuidado, los cambios afectarán a tus registros de contabilidad.'
                        }
                    </AlertDescription>
                </Alert>
            )}
            </DialogHeader>
            <div className="py-4">
            {renderContent()}
            </div>
            
            <DialogFooter className="gap-2 sm:justify-end pt-4">
                {renderFooter()}
            </DialogFooter>
        </DialogContent>
        </Dialog>

        <NewAppointmentConfirmationDialog
            voucherUpdateData={confirmationData}
            onOpenChange={() => setConfirmationData(null)}
        />
    </>
  );
}
