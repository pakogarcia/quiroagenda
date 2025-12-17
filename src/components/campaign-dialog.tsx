

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Client, BusinessProfile, Appointment, Service } from '@/lib/types';
import { format, subDays, startOfToday, isWithinInterval, parseISO, getMonth, getDate, differenceInDays, addDays, getDayOfYear, isFuture, set, isBefore } from 'date-fns';
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
    newClients: { title: 'Bienvenida a Nuevos Clientes', icon: Users },
    offer: { title: 'Campaña de Oferta', icon: Gift },
    generalMessage: { title: 'Comunicado General', icon: Megaphone },
};

export function CampaignDialog({ campaignType, onOpenChange }: CampaignDialogProps) {
  const { clients, profile, appointments, setAppointments, services } = useAppData();
  
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [step, setStep] = useState<'select' | 'finished'>('select');
  
  const [isConfirmSentOpen, setIsConfirmSentOpen] = React.useState(false);
  
  // Specific state for different campaigns
  const [offerMessage, setOfferMessage] = useState('');
  const [inactiveDays, setInactiveDays] = useState<number>(90);
  const [cancellationDate, setCancellationDate] = React.useState<Date | undefined>(addDays(new Date(), 1));
  const [cancellationTime, setCancellationTime] = React.useState('10:00');
  const [generalMessage, setGeneralMessage] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

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
            const sevenDaysAgo = subDays(today, 7);
            const noShowPhones = new Set(
                appointments
                    .filter(apt => apt.status === 'no-show' && isWithinInterval(new Date(apt.dateTime), { start: sevenDaysAgo, end: addDays(today,1) }))
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
        case 'offer':
        case 'generalMessage':
            return clients;
        case 'newClients':
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
      setNewClientName('');
      setNewClientPhone('');
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

    const messages: GeneratedMessage[] = [];

    if (campaignType === 'newClients') {
        const clientName = newClientName.split(' ')[0] || 'futuro cliente';
        const serviceList = services.map(s => `- ${s.name} (${s.duration} min): ${s.price.toFixed(2)}€`).join('\n');
        
        const socialLinks = [
            profile.website && `Página Web: ${profile.website}`,
            profile.instagram && `Instagram: ${profile.instagram}`,
            profile.facebook && `Facebook: ${profile.facebook}`,
            profile.tiktok && `TikTok: ${profile.tiktok}`,
            profile.youtube && `YouTube: ${profile.youtube}`,
        ].filter(Boolean).join('\n');
        
        const socialBlock = socialLinks ? `\n\nTambién puedes encontrarnos aquí:\n${socialLinks}` : '';
        
        const message = `¡Hola ${clientName}!\n\nGracias por tu interés en ${profile.name}. ¡Será un placer cuidarte!\n\nAquí tienes la información que necesitas:\n\n📍 **Nuestra ubicación:**\n${profile.address || 'Contacta para más detalles'}\n\n💆 **Nuestros servicios:**\n${serviceList}\n\nSi tienes cualquier duda o quieres agendar una cita, no dudes en escribirnos.\n\n¡Te esperamos!${socialBlock}\n\nUn saludo,\n${profile.name}`;
        
        messages.push({
            clientId: 'new-client',
            clientName: newClientName,
            clientPhone: newClientPhone,
            message: message,
        });

    } else {
        for (const clientId of selectedClientIds) {
            const client = clients.find(c => c.id === clientId);
            if (!client) continue;

            let message = '';
            let appointmentId: string | undefined = undefined;

            if (campaignType === 'reminders') {
                const appointment = appointments
                    .filter(apt => apt.clientPhone === client?.phone && apt.status === 'scheduled' && isFuture(apt.dateTime))
                    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];
                
                if (appointment) {
                    appointmentId = appointment.id;
                    message = `Hola ${client.name.split(' ')[0]},\n\nTe escribo para recordarte tu próxima cita en ${profile.name}.\n\n🗓️ Fecha: ${format(appointment.dateTime, "EEEE, d 'de' MMMM", { locale: es })}\n⏰ Hora: ${format(appointment.dateTime, "p", { locale: es })}\n\n📍 Ubicación: ${profile.address}\n\nRecuerda, el pago es siempre en efectivo.\n\nPor favor, si necesitas cancelar o reprogramar, avísanos con la mayor antelación posible.\n\n¡Te esperamos!\n\nUn saludo,\n${profile.name}`;
                }
            } else if (campaignType === 'pendingPayments') {
                const appointment = appointments
                    .filter(apt => apt.clientPhone === client.phone && apt.status === 'completed' && !apt.payment)
                    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime())[0]; // Get the most recent one

                if (appointment) {
                    appointmentId = appointment.id;
                    const date = format(appointment.dateTime, "d 'de' MMMM", { locale: es });
                    const price = appointment.servicePrice || 0;
                    
                    message = `Hola ${client.name.split(' ')[0]},\n\nEspero que estés muy bien.\n\nTe escribo de parte de ${profile.name} para recordarte que el pago de tu cita, del día ${date}, está aún pendiente de pago. El importe es de ${price.toFixed(2)}€.\n\nPuedes realizar el pago de la forma que te sea más cómoda. Si ya has realizado el pago, por favor, ignora este mensaje.\n\n¡Muchas gracias por tu confianza!\n\nUn saludo,\n${profile.name}`;
                }
            } else if (campaignType === 'noShow') {
                const appointment = appointments
                    .filter(apt => apt.clientPhone === client.phone && apt.status === 'no-show')
                    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime())[0]; // Get the most recent one

                if (appointment) {
                    appointmentId = appointment.id;
                    const date = format(appointment.dateTime, "d 'de' MMMM", { locale: es });
                    
                    message = `Hola ${client.name.split(' ')[0]},\n\nTe escribo de parte de ${profile.name} en relación a tu cita del día ${date}, a la que lamentablemente no has acudido.\n\nEntendemos que pueden surgir imprevistos. Nos gustaría recordarte la importancia de cancelar con antelación para poder ofrecer la hora a otro cliente.\n\nSi deseas volver a agendar una cita, no dudes en ponerte en contacto con nosotros.\n\nUn saludo,\n${profile.name}`;
                }
            } else if (campaignType === 'cancellation') {
                const appointment = appointments
                    .filter(apt => apt.clientPhone === client.phone && apt.status === 'scheduled' && isFuture(apt.dateTime))
                    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0]; // Get the closest future appointment

                if (appointment && cancellationDate) {
                    appointmentId = appointment.id;
                    const originalDate = format(appointment.dateTime, "EEEE, d 'de' MMMM", { locale: es });
                    const [hours, minutes] = cancellationTime.split(':').map(Number);
                    const newDateTime = set(cancellationDate, { hours, minutes });

                    message = `Hola ${client.name.split(' ')[0]},\n\nTe escribo de parte de ${profile.name} por un imprevisto que me ha surgido. Lamento informarte que no podré atender tu cita del próximo ${originalDate}.\n\nTe pido disculpas por las molestias.\n\nComo alternativa, te propongo mover la cita al siguiente día y hora:\n🗓️ Nueva Fecha: ${format(newDateTime, "EEEE, d 'de' MMMM", { locale: es })}\n⏰ Nueva Hora: ${format(newDateTime, "p", { locale: es })}\n\nPor favor, confírmame si esta nueva fecha te viene bien. Si no es posible para ti, podemos buscar otra alternativa o, si lo prefieres, procedemos a anular la cita sin ningún compromiso.\n\nGracias por tu comprensión,\n${profile.name}`;
                }
            } else if (campaignType === 'voucherStatus') {
                if (client.voucher) {
                    const clientName = client.name.split(' ')[0];
                    const remaining = client.voucher.sessions;
                    if (remaining > 1) {
                        message = `Hola ${clientName}, te recordamos que tienes un bono activo con nosotros. Actualmente te quedan ${remaining} sesiones disponibles. ¡No dejes que se te pasen! Esperamos verte pronto por ${profile.name}. Un saludo.`;
                    } else if (remaining === 1) {
                        message = `Hola ${clientName}, ¡estás a punto de completar tu bono! Te informamos de que te queda solo 1 sesión disponible. ¡Te esperamos para la última! Un saludo, ${profile.name}`;
                    } else {
                        message = `Hola ${clientName}, ¡enhorabuena! Has completado todas las sesiones de tu bono. Ha sido un placer cuidarte. Si quieres renovarlo o probar alguno de nuestros otros servicios, no dudes en consultarnos. ¡Muchas gracias por tu confianza! Un saludo, ${profile.name}`;
                    }
                }
            } else if (campaignType === 'birthdays') {
                const clientName = client.name.split(' ')[0];
                message = `¡Hola ${clientName}!\n\n¡Feliz cumpleaños! 🎉 De parte de todo el equipo de ${profile.name}, te deseamos que pases un día maravilloso.\n\nPara celebrarlo contigo, queremos regalarte un 20% de descuento en tu próxima cita con nosotros.\n\n¡Muchas gracias por tu confianza y esperamos verte pronto!\n\nUn saludo,\n${profile.name}`;
            } else if (campaignType === 'inactiveClients') {
                const clientName = client.name.split(' ')[0];
                message = `Hola ${clientName},\n\n¡Hace tiempo que no te vemos por ${profile.name} y te echamos de menos!\n\nNos encantaría ayudarte a retomar tu rutina de bienestar. Si estás pensando en volver, no dudes en escribirnos para encontrar el momento perfecto para tu próxima cita.\n\n¡Esperamos verte pronto!\n\nUn saludo,\n${profile.name}`;
            } else if (campaignType === 'offer' && offerMessage) {
                const clientName = client.name.split(' ')[0];
                message = `¡Hola ${clientName}!\n\nEn ${profile.name} estamos de celebración y queremos compartirlo contigo.\n\nTenemos una oferta especial que te va a encantar:\n**${offerMessage}**\n\nAprovecha esta oportunidad para darte un capricho. Si quieres reservar, solo tienes que responder a este mensaje.\n\n¡Te esperamos!\n\nUn saludo,\n${profile.name}`;
            } else if (campaignType === 'generalMessage' && generalMessage) {
                const clientName = client.name.split(' ')[0];
                message = `Hola ${clientName},\n\nTe escribo de parte de ${profile.name} para informarte sobre lo siguiente:\n\n${generalMessage}\n\nGracias por tu atención.\n\nUn saludo,\n${profile.name}`;
            }

            if (message) {
                messages.push({
                    clientId: client.id,
                    clientName: `${client.name} ${client.lastName}`,
                    clientPhone: client.phone,
                    message,
                    appointmentId: appointmentId
                });
            }
        }
    }


    setGeneratedMessages(messages);
    setStep('finished');

  }, [campaignType, selectedClientIds, clients, appointments, profile, toast, cancellationDate, cancellationTime, newClientName, newClientPhone, services, offerMessage, generalMessage]);

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
            return '¡Mensajes listos! Ahora puedes editarlos, copiarlos o enviarlos por WhatsApp.';
        case 'select':
        default:
            if (campaignType === 'newClients') {
                return 'Introduce los datos de la persona que te ha contactado para generar un mensaje de bienvenida.'
            }
            return 'Selecciona los destinatarios y configura las opciones para esta campaña.';
    }
  };

  const renderConfiguration = () => {
      if (step !== 'select') return null;

      if (campaignType === 'newClients') {
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="new-client-name">Nombre del Contacto</Label>
                    <Input 
                        id="new-client-name"
                        placeholder="p. ej., Laura"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="new-client-phone">Teléfono del Contacto</Label>
                    <Input 
                        id="new-client-phone"
                        placeholder="p. ej., +34 600112233"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                    />
                </div>
            </div>
        )
      }

      if (campaignType === 'offer') {
          return (
              <div className="space-y-2">
                <Label htmlFor="offerMessage">Texto de la Oferta</Label>
                <Textarea
                    id="offerMessage"
                    placeholder="p. ej., 20% de descuento en masajes relajantes solo esta semana."
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    className="h-24"
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
                                let appointmentInfo = null;

                                if (campaignType === 'reminders' || campaignType === 'cancellation') {
                                    const nextAppointment = appointments
                                        .filter(a => a.clientPhone === c.phone && a.status === 'scheduled' && isFuture(a.dateTime))
                                        .sort((d1, d2) => d1.dateTime.getTime() - d2.dateTime.getTime())[0];
                                    if (nextAppointment) {
                                        appointmentInfo = format(nextAppointment.dateTime, "d MMM, p", { locale: es });
                                    }
                                } else if (campaignType === 'pendingPayments') {
                                    const pendingAppointment = appointments
                                        .filter(a => a.clientPhone === c.phone && a.status === 'completed' && !a.payment)
                                        .sort((a,b) => b.dateTime.getTime() - a.dateTime.getTime())[0];
                                    if (pendingAppointment) {
                                        const price = pendingAppointment.servicePrice || 0;
                                        appointmentInfo = `Pendiente: ${price.toFixed(2)}€`;
                                    }
                                } else if (campaignType === 'birthdays' && c.birthDate) {
                                    appointmentInfo = format(parseISO(c.birthDate), "d 'de' MMMM", { locale: es });
                                }

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
                                            {appointmentInfo && (
                                                <span className="text-xs text-primary">{appointmentInfo}</span>
                                            )}
                                        </Label>
                                    </div>
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
                    {campaignType === 'reminders' ? 'Marcar como Enviados y Cerrar' : 'Cerrar'}
                </Button>
            );
        }
        return <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>;
    }
    if (step === 'select') {
        let disabled = false;
        let buttonText = 'Generar Mensaje(s)';

        if (campaignType === 'newClients') {
            disabled = !newClientName || !newClientPhone;
            buttonText = 'Generar Mensaje de Bienvenida';
        } else {
            disabled = selectedClientIds.length === 0;
            if (campaignType === 'offer' && !offerMessage) disabled = true;
            if (campaignType === 'generalMessage' && !generalMessage) disabled = true;
            if (campaignType === 'cancellation' && !cancellationDate) disabled = true;
            buttonText = `Generar ${selectedClientIds.length} Mensaje(s)`;
        }
        
        return (
            <Button onClick={generateMessages} disabled={disabled}>
                <Send className="mr-2 h-4 w-4" />
                {buttonText}
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
    const [editedMessage, setEditedMessage] = useState(message.message);
    const whatsappLink = `https://wa.me/${message.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(editedMessage)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(editedMessage);
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
            <Textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="text-sm text-muted-foreground italic whitespace-pre-wrap mt-2 min-h-[150px] bg-muted/50"
            />
        </div>
    )
}



    
