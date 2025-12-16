
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Client, BusinessProfile, Appointment } from '@/lib/types';
import { format, subDays, startOfToday, isWithinInterval, parseISO, getMonth, getDate, differenceInDays, addDays, getDayOfYear, isFuture, set } from 'date-fns';
import { es } from 'date-fns/locale';
import { Gift, Send, Calendar as CalendarIcon, Smartphone, MessageSquare, CheckCircle, Bell, Cake, Clock, Users, AlertCircle, Copy, Check, UserX, CalendarOff, Megaphone } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { type DateRange } from 'react-day-picker';
import { Checkbox } from './ui/checkbox';
import { useAppData } from '@/context/app-data-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { generateWhatsappReminder } from '@/ai/flows/generate-whatsapp-reminder';
import { generateOfferWhatsapp } from '@/ai/flows/generate-offer-whatsapp';
import { Input } from './ui/input';
import { generateBirthdayWhatsapp } from '@/ai/flows/generate-birthday-whatsapp';
import { generateInactiveClientWhatsapp } from '@/ai/flows/generate-inactive-client-whatsapp';
import { generatePendingPaymentWhatsapp } from '@/ai/flows/generate-pending-payment-whatsapp';
import { generateWelcomeWhatsapp } from '@/ai/flows/generate-new-appointment-whatsapp';
import { generateVoucherUpdateWhatsapp } from '@/ai/flows/generate-voucher-update-whatsapp';
import { NewAppointmentConfirmationDialog } from './new-appointment-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { generateNoShowWhatsapp } from '@/ai/flows/generate-no-show-whatsapp';
import { generateCancellationWhatsapp } from '@/ai/flows/generate-cancellation-whatsapp';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { generateGeneralMessageWhatsapp } from '@/ai/flows/generate-general-message-whatsapp';


export type CampaignType = 'reminders' | 'pendingPayments' | 'birthdays' | 'inactiveClients' | 'newClients' | 'offer' | 'voucherStatus' | 'noShow' | 'cancellation' | 'generalMessage';

type GeneratedMessage = {
  clientId: string;
  clientName: string;
  clientPhone: string;
  message: string;
  appointmentId?: string;
  customNote: string;
};

type CampaignDialogProps = {
  campaignType: CampaignType | null;
  onOpenChange: (isOpen: boolean) => void;
};

const campaignDetails = {
    reminders: { title: 'Recordatorios de Citas', icon: Bell },
    pendingPayments: { title: 'Notificar Pagos Pendientes', icon: AlertCircle },
    noShow: { title: 'Contactar por Ausencia (No Show)', icon: UserX },
    cancellation: { title: 'Anulación/Modificación de Cita', icon: CalendarOff },
    voucherStatus: { title: 'Notificar Sesiones de Bono', icon: Gift },
    birthdays: { title: 'Felicitaciones de Cumpleaños', icon: Cake },
    inactiveClients: { title: 'Clientes Inactivos', icon: Clock },
    newClients: { title: 'Bienvenida a Nuevos Clients', icon: Users },
    offer: { title: 'Campaña de Oferta', icon: Gift },
    generalMessage: { title: 'Comunicado General', icon: Megaphone },
};

export function CampaignDialog({ campaignType, onOpenChange }: CampaignDialogProps) {
  const { clients, profile, appointments, setAppointments, services } = useAppData();
  
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'generate' | 'finished'>('select');
  
  const [isConfirmSentOpen, setIsConfirmSentOpen] = React.useState(false);
  const [welcomeMessage, setWelcomeMessage] = React.useState<Appointment | null>(null);

  // Specific state for different campaigns
  const [offerMessage, setOfferMessage] = useState('');
  const [inactiveDays, setInactiveDays] = useState<number>(90);
  const [cancellationDate, setCancellationDate] = React.useState<Date | undefined>(addDays(new Date(), 1));
  const [cancellationTime, setCancellationTime] = React.useState('10:00');
  const [generalMessage, setGeneralMessage] = useState('');

  const targetClients = useMemo(() => {
    if (!campaignType) return [];
    const today = startOfToday();

    switch (campaignType) {
        case 'reminders': {
            const nextAppointmentByClient: { [phone: string]: Appointment } = {};

            appointments
                .filter(apt => apt.status === 'scheduled' && !apt.reminderSent && isFuture(apt.dateTime))
                .forEach(apt => {
                    if (!nextAppointmentByClient[apt.clientPhone] || apt.dateTime < nextAppointmentByClient[apt.clientPhone].dateTime) {
                        nextAppointmentByClient[apt.clientPhone] = apt;
                    }
                });

            const clientPhones = new Set(Object.keys(nextAppointmentByClient));
            return clients.filter(c => clientPhones.has(c.phone));
        }
        case 'pendingPayments': {
            const pendingPaymentPhones = new Set(
                appointments
                    .filter(apt => apt.status === 'completed' && !apt.payment)
                    .map(apt => apt.clientPhone)
            );
            return clients.filter(c => pendingPaymentPhones.has(c.phone));
        }
        case 'noShow': {
            const noShowPhones = new Set(
                appointments
                    .filter(apt => apt.status === 'no-show')
                    .map(apt => apt.clientPhone)
            );
            return clients.filter(c => noShowPhones.has(c.phone));
        }
        case 'cancellation': {
             const upcomingAppointmentsPhones = new Set(
                appointments
                    .filter(apt => apt.status === 'scheduled' && isFuture(apt.dateTime))
                    .map(apt => apt.clientPhone)
            );
            return clients.filter(c => upcomingAppointmentsPhones.has(c.phone));
        }
        case 'birthdays': {
                const todayDayOfYear = getDayOfYear(today);
                const isLeapYear = (new Date(today.getFullYear(), 1, 29).getDate() === 29);

                return clients
                    .filter(c => !!c.birthDate)
                    .map(c => {
                        const birthDate = parseISO(c.birthDate!);
                        const currentYearBirthDate = set(birthDate, { year: today.getFullYear() });
                        
                        let diff = differenceInDays(currentYearBirthDate, today);

                        const yearDays = isLeapYear ? 366 : 365;

                        if (diff < -yearDays / 2) { 
                            diff += yearDays;
                        }
                        if (diff > yearDays / 2) {
                            diff -= yearDays;
                        }

                        return { ...c, proximity: diff };
                    })
                    .filter(c => c.proximity >= -7 && c.proximity <= 14)
                    .sort((a, b) => a.proximity - b.proximity);
            }
        case 'inactiveClients': {
             const clientLastVisit = new Map<string, Date>();
             appointments.forEach(apt => {
                if (apt.status === 'completed') {
                    const client = clients.find(c => c.phone === apt.clientPhone);
                    if (client) {
                        const lastVisit = clientLastVisit.get(client.id);
                        if (!lastVisit || apt.dateTime > lastVisit) {
                            clientLastVisit.set(client.id, apt.dateTime);
                        }
                    }
                }
            });
            return clients.filter(c => {
                const lastVisit = clientLastVisit.get(c.id);
                if (!lastVisit) return false; // Or handle as active if no completed appointments
                return differenceInDays(today, lastVisit) >= inactiveDays;
            });
        }
        case 'voucherStatus': {
            return clients.filter(c => c.voucher && c.voucher.sessions > 0);
        }
        case 'newClients': {
            return []; // Handled by a special form, but the type needs to be present
        }
        case 'offer':
        case 'generalMessage':
            return clients;
        default:
            return [];
    }
  }, [campaignType, clients, appointments, inactiveDays]);

  React.useEffect(() => {
    if (campaignType) {
      setStep('select');
      setGeneratedMessages([]);
      setSelectedClientIds([]);
      setOfferMessage('');
      setInactiveDays(90);
      setGeneralMessage('');
      if (campaignType !== 'newClients') {
          setWelcomeMessage(null);
      }
    }
  }, [campaignType]);

  const handleGenerateMessages = useCallback(async (customNotes: Record<string, string>) => {
    if (!campaignType) return;
    
    if (campaignType === 'newClients') {
        const welcomeApt: Appointment = {
            id: 'new-client-welcome',
            clientName: '',
            clientPhone: '',
            dateTime: new Date(),
            notes: '',
            reminderSent: false,
            status: 'scheduled'
        }
        setWelcomeMessage(welcomeApt);
        return;
    }

    setIsLoading(true);
    setStep('generate');
    setGeneratedMessages([]);

    const selectedClients = targetClients.filter(c => selectedClientIds.includes(c.id));
    
    let generated: GeneratedMessage[] = [];

    for (const client of selectedClients) {
        let message = '';
        const customNote = customNotes[client.id] || '';
        try {
            switch(campaignType) {
                case 'reminders': {
                     const nextAppointment = appointments
                        .filter(a => a.clientPhone === client.phone && a.status === 'scheduled' && !a.reminderSent && isFuture(a.dateTime))
                        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];

                    if (nextAppointment) {
                        const result = await generateWhatsappReminder({
                            clientName: client.name.split(' ')[0],
                            appointmentDateTime: format(nextAppointment.dateTime, "EEEE, d 'de' MMMM 'de' yyyy 'a las' p", { locale: es }),
                            clientPhoneNumber: client.phone,
                            businessName: profile?.name,
                            customMessage: customNote,
                        });
                        message = result.whatsappMessage;
                        generated.push({ 
                            clientId: client.id, 
                            clientName: client.name, 
                            clientPhone: client.phone, 
                            message,
                            appointmentId: nextAppointment.id,
                            customNote,
                        });
                    }
                    break;
                }
                case 'pendingPayments': {
                    const result = await generatePendingPaymentWhatsapp({ clientName: client.name, businessName: profile?.name, customMessage: customNote });
                    message = result.whatsappMessage;
                    generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message, customNote });
                    break;
                }
                case 'noShow': {
                    const lastNoShow = appointments
                        .filter(a => a.clientPhone === client.phone && a.status === 'no-show')
                        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];
                    if (lastNoShow) {
                         const result = await generateNoShowWhatsapp({
                            clientName: client.name,
                            businessName: profile?.name,
                            appointmentDateTime: format(lastNoShow.dateTime, "d 'de' MMMM", { locale: es }),
                            customMessage: customNote,
                        });
                        message = result.whatsappMessage;
                        generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message, customNote });
                    }
                    break;
                }
                case 'cancellation': {
                    const nextAppointment = appointments
                        .filter(a => a.clientPhone === client.phone && a.status === 'scheduled' && isFuture(a.dateTime))
                        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];
                    
                    if (nextAppointment && cancellationDate) {
                        const [hours, minutes] = cancellationTime.split(':').map(Number);
                        const newProposedDateTime = set(cancellationDate, { hours, minutes });

                        const result = await generateCancellationWhatsapp({
                            clientName: client.name,
                            businessName: profile?.name,
                            originalAppointmentDateTime: format(nextAppointment.dateTime, "EEEE, d 'de' MMMM 'a las' p", { locale: es }),
                            newProposedDateTime: format(newProposedDateTime, "EEEE, d 'de' MMMM 'a las' p", { locale: es }),
                            customMessage: customNote,
                        });
                        message = result.whatsappMessage;
                        generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message, customNote });
                    }
                    break;
                }
                case 'birthdays': {
                    const result = await generateBirthdayWhatsapp({ clientName: client.name, businessName: profile?.name, customMessage: customNote });
                    message = result.whatsappMessage;
                    generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message, customNote });
                    break;
                }
                 case 'inactiveClients': {
                    const lastAppointment = appointments
                        .filter(a => a.clientPhone === client.phone && a.status === 'completed')
                        .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];
                    if (lastAppointment) {
                        const days = differenceInDays(new Date(), lastAppointment.dateTime);
                        const result = await generateInactiveClientWhatsapp({ clientName: client.name, inactiveDays: days, businessName: profile?.name, customMessage: customNote });
                        message = result.whatsappMessage;
                        generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message, customNote });
                    }
                    break;
                 }
                case 'offer': {
                     const result = await generateOfferWhatsapp({
                        clientName: client.name,
                        offerMessage,
                        dateRange: 'por tiempo limitado', // Simplified
                        businessName: profile?.name,
                    });
                    message = result.whatsappMessage;
                     generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message, customNote });
                    break;
                }
                case 'voucherStatus': {
                    if (client.voucher && client.voucher.sessions > 0) {
                        const result = await generateVoucherUpdateWhatsapp({
                            clientName: client.name,
                            remainingSessions: client.voucher.sessions,
                            informativeOnly: true,
                            businessName: profile?.name,
                        });
                        message = result.whatsappMessage;
                        generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message, customNote });
                    }
                    break;
                }
                case 'generalMessage': {
                     const result = await generateGeneralMessageWhatsapp({
                        clientName: client.name,
                        customMessage: generalMessage,
                        businessName: profile?.name,
                    });
                    message = result.whatsappMessage;
                     generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message, customNote });
                    break;
                }
            }
           
        } catch (error) {
            console.error('Failed to generate message for', client.name, error);
        }
    }

    setGeneratedMessages(generated);
    setIsLoading(false);
    setStep('finished');
  }, [campaignType, selectedClientIds, appointments, profile, offerMessage, inactiveDays, targetClients, services, cancellationDate, cancellationTime, generalMessage]);

  const handleMarkAsSent = () => {
     if (campaignType === 'reminders') {
        const sentAppointmentIds = generatedMessages.map(msg => msg.appointmentId).filter(id => id !== undefined) as string[];
        setAppointments(prev => prev.map(apt => 
            sentAppointmentIds.includes(apt.id) ? { ...apt, reminderSent: true } : apt
        ));
    }
    setIsConfirmSentOpen(false);
    onOpenChange(false);
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedClientIds(checked ? targetClients.map(c => c.id) : []);
  };
  
  const details = campaignType ? campaignDetails[campaignType] : null;
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({});

  const getDialogDescription = () => {
    switch (step) {
        case 'generate':
            return 'Espera un momento, la IA está redactando los mensajes...';
        case 'finished':
            return '¡Mensajes listos! Ahora puedes copiarlos o enviarlos por WhatsApp.';
        case 'select':
        default:
            return campaignType === 'newClients' 
                ? 'Envía un mensaje de bienvenida a los clientes recién añadidos.' 
                : 'Selecciona los destinatarios y configura las opciones para esta campaña.';
    }
  };

  const renderConfiguration = () => {
      if (campaignType === 'offer') {
          return (
              <div className="space-y-2">
                <Label htmlFor="offerMessage">Mensaje de la Oferta</Label>
                <Textarea
                    id="offerMessage"
                    placeholder="p. ej., 20% de descuento en masajes relajantes."
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                />
              </div>
          )
      }
      if (campaignType === 'generalMessage') {
          return (
              <div className="space-y-2">
                <Label htmlFor="generalMessage">Mensaje a Enviar</Label>
                <Textarea
                    id="generalMessage"
                    placeholder="Escribe aquí tu comunicado..."
                    value={generalMessage}
                    onChange={(e) => setGeneralMessage(e.target.value)}
                    className="h-28"
                />
              </div>
          )
      }
       if (campaignType === 'inactiveClients') {
          return (
              <div className="space-y-2">
                <Label htmlFor="inactiveDays">Días de inactividad</Label>
                <Input
                    id="inactiveDays"
                    type="number"
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(Number(e.target.value))}
                />
              </div>
          )
      }
      if (campaignType === 'cancellation') {
          return (
            <div className='space-y-4'>
                <Label>Proponer nueva fecha y hora</Label>
                 <div className="grid grid-cols-2 gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !cancellationDate && "text-muted-foreground")}
                            >
                                {cancellationDate ? format(cancellationDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={cancellationDate}
                                onSelect={setCancellationDate}
                                initialFocus
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>
                    <Input type="time" value={cancellationTime} onChange={e => setCancellationTime(e.target.value)} />
                </div>
            </div>
          )
      }
      return null;
  }

  const renderContent = () => {
    if (step === 'generate') {
      return (
        <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground animate-pulse">Generando mensajes...</p>
        </div>
      );
    }
    
    if(step === 'finished') {
        if (generatedMessages.length === 0) {
            return (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>No se generaron mensajes</AlertTitle>
                    <AlertDescription>
                        No se encontraron clientes que cumplan los criterios o hubo un error al generar los mensajes.
                    </AlertDescription>
                </Alert>
            );
        }
        return (
            <ScrollArea className="h-[400px] pr-4">
                 <div className="space-y-4">
                    <AnimatePresence>
                    {generatedMessages.map((msg) => (
                        <motion.div 
                            key={msg.clientId + (msg.appointmentId || '')}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <MessageCard 
                                message={msg}
                            />
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        )
    }

    // Step 'select'
    if (campaignType !== 'newClients' && targetClients.length === 0) {
        return (
            <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>¡Nada que hacer aquí!</AlertTitle>
                <AlertDescription>
                    No se encontraron clientes que cumplan con los criterios para esta campaña.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {renderConfiguration()}
            {campaignType !== 'newClients' && (
                <>
                <div className="flex items-center space-x-2 border-b pb-4">
                    <Checkbox 
                        id="select-all" 
                        onCheckedChange={handleSelectAll}
                        checked={selectedClientIds.length === targetClients.length && targetClients.length > 0}
                    />
                    <Label htmlFor="select-all" className="font-bold text-base">
                        Seleccionar Todo ({targetClients.length})
                    </Label>
                </div>
                <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-3">
                        {targetClients.map(c => {
                            const nextAppointment = (campaignType === 'reminders' || campaignType === 'cancellation')
                                ? appointments.filter(a => a.clientPhone === c.phone && a.status === 'scheduled' && isFuture(a.dateTime)).sort((d1, d2) => d1.dateTime.getTime() - d2.dateTime.getTime())[0]
                                : null;

                            return (
                            <div key={c.id} className="flex flex-col p-2 rounded-md hover:bg-muted">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id={c.id}
                                        onCheckedChange={(checked) => {
                                            setSelectedClientIds(prev => 
                                                checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                                            );
                                        }}
                                        checked={selectedClientIds.includes(c.id)}
                                    />
                                    <Label htmlFor={c.id} className="flex flex-col flex-grow cursor-pointer">
                                        <span className="font-semibold">{c.name} {c.lastName}</span>
                                        <span className="text-sm text-muted-foreground">{c.phone}</span>
                                        {campaignType === 'birthdays' && c.birthDate && (
                                            <span className="text-xs text-primary">{format(parseISO(c.birthDate), "d 'de' MMMM", { locale: es })}</span>
                                        )}
                                        {nextAppointment && (
                                            <span className="text-xs text-primary">{format(nextAppointment.dateTime, "d MMM, p", { locale: es })}</span>
                                        )}
                                    </Label>
                                </div>
                                 {selectedClientIds.includes(c.id) && (campaignType === 'reminders' || campaignType === 'pendingPayments' || campaignType === 'noShow' || campaignType === 'cancellation' || campaignType === 'birthdays' || campaignType === 'inactiveClients') && (
                                    <div className="pl-6 pt-2">
                                       <Textarea
                                            id={`custom-note-${c.id}`}
                                            className="mt-1 text-sm h-16"
                                            placeholder="Añadir nota personal (opcional)..."
                                            value={customNotes[c.id] || ''}
                                            onChange={(e) => setCustomNotes(prev => ({...prev, [c.id]: e.target.value}))}
                                        />
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>
                </ScrollArea>
                </>
            )}
        </div>
    )
  }

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
    if (step === 'select') {
        let disabled = isLoading;
        if (campaignType === 'newClients') {
            // No action button here, direct dialog opening
        } else if (campaignType === 'cancellation') {
            disabled = isLoading || selectedClientIds.length === 0 || !cancellationDate;
        } else if (campaignType === 'offer') {
            disabled = isLoading || selectedClientIds.length === 0 || !offerMessage;
        } else if (campaignType === 'generalMessage') {
             disabled = isLoading || selectedClientIds.length === 0 || !generalMessage;
        } else {
            disabled = isLoading || selectedClientIds.length === 0;
        }
        
        const buttonAction = () => {
            if (campaignType === 'newClients') {
                handleGenerateMessages({});
            } else {
                handleGenerateMessages(customNotes);
            }
        };

        const buttonText = campaignType === 'newClients' 
            ? 'Crear Mensaje de Bienvenida'
            : `Generar ${selectedClientIds.length} Mensaje(s)`;

        return (
            <Button onClick={buttonAction} disabled={disabled}>
                <Send className="mr-2 h-4 w-4" />
                {isLoading ? 'Generando...' : buttonText}
            </Button>
        )
    }
    return null;
  }

  if (!campaignType || !details) return null;

  return (
    <>
      <Dialog open={!!campaignType && !welcomeMessage} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <details.icon className="h-6 w-6 text-primary"/>
              {details.title}
            </DialogTitle>
            <DialogDescription>
                {getDialogDescription()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">{renderContent()}</div>
          <DialogFooter className="sm:justify-end gap-2 pt-4">
              {renderFooter()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isConfirmSentOpen} onOpenChange={setIsConfirmSentOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Marcar como enviados?</AlertDialogTitle>
                  <AlertDialogDescription>
                      {campaignType === 'reminders' ? "Esta acción marcará los recordatorios como enviados y no volverán a aparecer en esta lista. ¿Estás seguro?" : "Esta acción es solo para cerrar la ventana. ¿Estás seguro?"}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMarkAsSent}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      <NewAppointmentConfirmationDialog
        appointment={welcomeMessage}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setWelcomeMessage(null);
                onOpenChange(false); 
            }
        }}
      />
    </>
  );
}

function MessageCard({ message }: { message: GeneratedMessage; }) {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const fullMessage = message.message;
    const whatsappLink = `https://wa.me/${message.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(fullMessage)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullMessage);
        toast({
            title: "Copiado",
            description: "Mensaje copiado al portapapeles."
        });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="font-semibold text-primary flex items-center gap-2"><Smartphone className="w-4 h-4"/>{message.clientName}</div>
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                        {isCopied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                        {isCopied ? 'Copiado' : 'Copiar'}
                    </Button>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                            <Send className="mr-2 h-4 w-4" /> Enviar
                        </Button>
                    </a>
                </div>
            </div>
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">"{message.message}"</p>
        </div>
    )
}

    