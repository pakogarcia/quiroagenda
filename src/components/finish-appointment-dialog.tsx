
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
import { generateVoucherUpdateWhatsapp } from '@/ai/flows/generate-voucher-update-whatsapp';
import { useToast } from '@/hooks/use-toast';
import { Send, Instagram, Facebook, Youtube, Link as LinkIcon, Globe, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { useAppData } from '@/context/app-data-context';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
  const { clients, setClients, profile } = useAppData();
  const [step, setStep] = React.useState<'selectAction' | 'paymentForm' | 'voucherUpdateMessage'>('selectAction');
  const [voucherPayingClient, setVoucherPayingClient] = React.useState<Client | null>(null);
  const [generatedMessage, setGeneratedMessage] = React.useState('');
  const [isGeneratingMessage, setIsGeneratingMessage] = React.useState(false);
  const [socials, setSocials] = React.useState({ website: true, instagram: true, facebook: true, tiktok: true, youtube: true });
  const [finalizedAppointment, setFinalizedAppointment] = React.useState<Appointment | null>(null);
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

  const resetState = React.useCallback(() => {
    const initialStep = isEditing ? 'paymentForm' : 'selectAction';
    setStep(initialStep);
    
    setVoucherPayingClient(null);
    setGeneratedMessage('');
    setIsGeneratingMessage(false);
    setFinalizedAppointment(null);

    const defaultPayment = appointment?.payment;
    const currentClient = appointment ? clients.find(c => c.phone === appointment.clientPhone) : null;
    
    form.reset({ 
        amount: defaultPayment?.method !== 'voucher' ? defaultPayment?.amount : undefined, 
        paymentMethod: defaultPayment?.method || 'cash',
        voucherPayerId: defaultPayment?.method === 'voucher' 
            ? defaultPayment.payerClientId 
            : (currentClient?.voucher && currentClient.voucher.sessions > 0 ? currentClient.id : undefined),
        refundVoucher: true,
    });
  }, [isEditing, appointment, clients, form]);

  React.useEffect(() => {
    if (appointment) {
      resetState();
    }
  }, [appointment, resetState]);
  
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


  const generateAndShowVoucherMessage = async (payerClient: Client) => {
    setIsGeneratingMessage(true);
    setStep('voucherUpdateMessage');

    let message = '';
    try {
        const result = await generateVoucherUpdateWhatsapp({
            clientName: payerClient.name.split(' ')[0],
            remainingSessions: payerClient.voucher!.sessions,
            businessName: profile?.name,
            website: socials.website ? profile?.website : undefined,
            instagram: socials.instagram ? profile?.instagram : undefined,
            facebook: socials.facebook ? profile?.facebook : undefined,
            tiktok: socials.tiktok ? profile?.tiktok : undefined,
            youtube: socials.youtube ? profile?.youtube : undefined,
        });
        message = result.whatsappMessage;
    } catch (e) {
        console.error("Failed to generate voucher update message", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo generar el mensaje de actualización del bono."
        });
    }
    
    setGeneratedMessage(message);
    setIsGeneratingMessage(false);
  }

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

    let updatedAppointment: Appointment;

    // --- Bono a Efectivo/Bizum/Paypal ---
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
        const payment: Payment = { method: data.paymentMethod, amount: data.amount || 0 };
        updatedAppointment = { ...appointment, status: 'completed', payment };
        onAppointmentFinished(updatedAppointment);
        toast({ title: 'Pago actualizado', description: 'El pago se ha actualizado correctamente.' });
        onOpenChange(false);
        return;
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
        
        setVoucherPayingClient(updatedPayerClient);

        const payment: Payment = { method: 'voucher', amount: 0, payerClientId: data.voucherPayerId };
        updatedAppointment = { ...appointment, status: 'completed', payment };
        setFinalizedAppointment(updatedAppointment);

        toast({
            title: 'Bono actualizado',
            description: `Se ha descontado una sesión del bono de ${updatedPayerClient.name}.`,
        });

        await generateAndShowVoucherMessage(updatedPayerClient);

    } else {
        const payment: Payment = { method: data.paymentMethod, amount: data.amount || 0 };
        updatedAppointment = { ...appointment, status: 'completed', payment };
        onAppointmentFinished(updatedAppointment);
        toast({
          title: isEditing ? 'Pago actualizado' : 'Pago registrado',
          description: `Se ha registrado un pago de ${(data.amount || 0).toFixed(2)}€.`,
        });
        onOpenChange(false);
    }
  };
  
  const handleClose = () => {
    if (finalizedAppointment) {
        onAppointmentFinished(finalizedAppointment);
    }
    onOpenChange(false);
  }
  
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
      case 'voucherUpdateMessage':
        if (!voucherPayingClient) return null;
        const whatsappLink = `https://wa.me/${voucherPayingClient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(generatedMessage)}`;
        return (
            <div>
                <DialogDescription>
                    Se ha actualizado el bono de **{voucherPayingClient.name}**. Puedes enviarle el siguiente mensaje.
                </DialogDescription>
                <div className="my-4 p-4 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap min-h-[100px]">
                    {isGeneratingMessage ? (
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                    ) : (
                        generatedMessage
                    )}
                </div>
                 <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={handleClose}>
                    <Button disabled={isGeneratingMessage || !generatedMessage} className="w-full">
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
            <Button variant="ghost" onClick={isEditing ? handleClose : () => setStep('selectAction')}>
              {isEditing ? 'Cancelar' : 'Volver'}
            </Button>
            <Button type="submit" form="payment-form" disabled={isGeneratingMessage}>Confirmar</Button>
          </>
        );
      case 'voucherUpdateMessage':
        return <Button variant="secondary" onClick={handleClose}>Cerrar sin enviar</Button>;
      case 'selectAction':
      default:
        return <Button variant="secondary" onClick={handleClose}>Cancelar</Button>;
    }
  }

  if (!appointment) return null;

  const showSocials = step === 'paymentForm' && form.getValues('paymentMethod') === 'voucher' && profile && (profile.website || profile.instagram || profile.facebook || profile.tiktok || profile.youtube);

  return (
    <Dialog open={!!appointment} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Pago' : 'Finalizar Cita'}: {appointment?.clientName}</DialogTitle>
          {step === 'selectAction' && (
            <DialogDescription>Elige una acción para esta cita.</DialogDescription>
          )}
           {step === 'paymentForm' && isEditing && (
            <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Estás editando un pago</AlertTitle>
                <AlertDescription>
                    {wasPaidWithVoucher
                        ? 'Estás editando un pago realizado con un bono. Si cambias el método, puedes optar por devolver la sesión.'
                        : 'Ten cuidado, los cambios afectarán a tus registros de contabilidad.'
                    }
                </AlertDescription>
            </Alert>
          )}
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
        
        {showSocials && (
            <>
                <Separator />
                <div className="pt-4 space-y-4">
                     <h4 className="font-medium text-sm">Incluir Redes Sociales en el mensaje de WhatsApp</h4>
                     <div className="flex flex-wrap items-center gap-4">
                        {profile?.website && (
                            <div className="flex items-center space-x-2">
                                <Checkbox id="web" checked={socials.website} onCheckedChange={(checked) => setSocials(s => ({...s, website: !!checked}))} />
                                <label htmlFor="web" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Globe /> Web</label>
                            </div>
                        )}
                        {profile?.instagram && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="ig" checked={socials.instagram} onCheckedChange={(checked) => setSocials(s => ({...s, instagram: !!checked}))} />
                                <label htmlFor="ig" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Instagram /> Instagram</label>
                             </div>
                        )}
                         {profile?.facebook && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="fb" checked={socials.facebook} onCheckedChange={(checked) => setSocials(s => ({...s, facebook: !!checked}))} />
                                <label htmlFor="fb" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Facebook /> Facebook</label>
                             </div>
                        )}
                         {profile?.tiktok && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="tt" checked={socials.tiktok} onCheckedChange={(checked) => setSocials(s => ({...s, tiktok: !!checked}))} />
                                <label htmlFor="tt" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><LinkIcon /> TikTok</label>
                             </div>
                        )}
                         {profile?.youtube && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="yt" checked={socials.youtube} onCheckedChange={(checked) => setSocials(s => ({...s, youtube: !!checked}))} />
                                <label htmlFor="yt" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Youtube /> YouTube</label>
                             </div>
                        )}
                     </div>
                </div>
            </>
        )}

        <DialogFooter className="gap-2 sm:justify-end pt-4">
            {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    

    