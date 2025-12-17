'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { Input } from './ui/input';
import { NewAppointmentConfirmationDialog } from './new-appointment-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';


export type CampaignType = 'reminders' | 'pendingPayments' | 'birthdays' | 'inactiveClients' | 'newClients' | 'offer' | 'voucherStatus' | 'noShow' | 'cancellation' | 'generalMessage';

type GeneratedMessage = {
  clientId: string;
  clientName: string;
  clientPhone: string;
  message: string;
  appointmentId?: string;
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
  const { clients, profile, appointments, setAppointments } = useAppData();
  
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'finished'>('select');
  
  const [isConfirmSentOpen, setIsConfirmSentOpen] = React.useState(false);
  
  // Specific state for different campaigns
  const [offerMessage, setOfferMessage] = useState('');
  const [inactiveDays, setInactiveDays] = useState<number>(90);
  const [cancellationDate, setCancellationDate] = React.useState<Date | undefined>(addDays(new Date(), 1));
  const [cancellationTime, setCancellationTime] = React.useState('10:00');
  const [generalMessage, setGeneralMessage] = useState('');

  const {toast} = useToast();

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
                if (!lastVisit) return false;
                return differenceInDays(today, lastVisit) >= inactiveDays;
            });
        }
        case 'voucherStatus': {
            return clients.filter(c => c.voucher && c.voucher.sessions > 0);
        }
        case 'newClients': {
             return clients.filter(c => differenceInDays(today, new Date(c.id.substring(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))) <= 7);
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
    }
  }, [campaignType]);

  const generateMessages = useCallback(() => {
    if (!profile) {
        toast({
            variant: 'destructive',
            title: 'Perfil incompleto',
            description: 'Por favor, completa el perfil de tu negocio en "Quién Eres" para generar mensajes.',
        });
        return;
    }

    setIsLoading(true);

    const messages: GeneratedMessage[] = [];

    if (campaignType === 'reminders') {
        for (const clientId of selectedClientIds) {
            const client = clients.find(c => c.id === clientId);
            const appointment = appointments
                .filter(apt => apt.clientPhone === client?.phone && apt.status === 'scheduled' && isFuture(apt.dateTime))
                .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];

            if (client && appointment) {
                const message = `Hola ${client.name.split(' ')[0]},\n\nTe escribo para recordarte tu próxima cita en ${profile.name}.\n\n🗓️ Fecha: ${format(appointment.dateTime, "EEEE, d 'de' MMMM", { locale: es })}\n⏰ Hora: ${format(appointment.dateTime, "p", { locale: es })}\n\n📍 Ubicación: ${profile.address}\n\nRecuerda, el pago es siempre en efectivo.\n\nPor favor, si necesitas cancelar o reprogramar, avísanos con la mayor antelación posible.\n\n¡Te esperamos!\n\nUn saludo,\n${profile.name}`;
                messages.push({
                    clientId: client.id,
                    clientName: `${client.name} ${client.lastName}`,
                    clientPhone: client.phone,
                    message,
                    appointmentId: appointment.id
                });
            }
        }
    }

    setGeneratedMessages(messages);
    setIsLoading(false);
    setStep('finished');

  }, [campaignType, selectedClientIds, clients, appointments, profile, toast]);

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

  const getDialogDescription = () => {
    switch (step) {
        case 'finished':
            return '¡Mensajes listos! Ahora puedes copiarlos o enviarlos por WhatsApp.';
        case 'select':
        default:
            return 'Selecciona los destinatarios y configura las opciones para esta campaña.';
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
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
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
    if (targetClients.length === 0) {
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
                        </div>
                    )})}
                </div>
            </ScrollArea>
        </div>
    )
  }

  const renderFooter = () => {
    if (step === 'finished') {
        if (generatedMessages.length > 0) {
             return (
                <Button variant="default" onClick={() => setIsConfirmSentOpen(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {campaignType === 'reminders' ? 'Marcar como Enviados y Cerrar' : 'Cerrar'}
                </Button>
            );
        }
        return <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>;
    }
    if (step === 'select') {
        let disabled = isLoading || selectedClientIds.length === 0;

        if (campaignType === 'offer' && !offerMessage) disabled = true;
        if (campaignType === 'generalMessage' && !generalMessage) disabled = true;
        if (campaignType === 'cancellation' && !cancellationDate) disabled = true;
        
        const buttonAction = () => {
             generateMessages();
        };

        const buttonText = `Generar ${selectedClientIds.length} Mensaje(s)`;

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
      <Dialog open={!!campaignType} onOpenChange={onOpenChange}>
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
            <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">{message.message}</p>
        </div>
    )
}
