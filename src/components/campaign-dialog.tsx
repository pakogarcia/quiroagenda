'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Client, Appointment } from '@/lib/types';
import { format, subDays, startOfToday, isWithinInterval, parseISO, differenceInDays, addDays, isFuture, set } from 'date-fns';
import { es } from 'date-fns/locale';
import { Gift, Send, Smartphone, CheckCircle, Bell, Cake, Clock, Users, AlertCircle, Copy, Check, UserX, CalendarOff, Megaphone, ShoppingCart } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from './ui/checkbox';
import { useAppData } from '@/context/app-data-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';


export type CampaignType = 'reminders' | 'pendingPayments' | 'birthdays' | 'inactiveClients' | 'newClients' | 'offer' | 'voucherStatus' | 'noShow' | 'cancellation' | 'generalMessage' | 'voucherPurchase';

type GeneratedMessage = {
  clientId: string;
  clientName: string;
  clientPhone: string;
  message: string;
  appointmentId?: string;
};

const campaignDetails = {
    reminders: { title: 'Recordatorios de Citas', icon: Bell },
    voucherPurchase: { title: 'Agradecer Compra de Bono', icon: ShoppingCart },
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

export function CampaignDialog({ campaignType, onOpenChange }: { campaignType: CampaignType | null; onOpenChange: (isOpen: boolean) => void }) {
  const { clients, profile, appointments, setAppointments, services } = useAppData();
  
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [step, setStep] = useState<'select' | 'finished'>('select');
  
  const [isConfirmSentOpen, setIsConfirmSentOpen] = React.useState(false);
  
  const [inactiveDays, setInactiveDays] = useState<number>(90);
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
        case 'voucherPurchase':
        case 'voucherStatus': {
            return clients.filter(c => c.voucher && c.voucher.sessions > 0);
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
        case 'birthdays': {
                return clients
                    .filter(c => !!c.birthDate)
                    .map(c => {
                        const birthDate = parseISO(c.birthDate!);
                        const currentYearBirthDate = set(birthDate, { year: today.getFullYear() });
                        let diff = differenceInDays(currentYearBirthDate, today);
                        if (diff < -180) diff += 365;
                        if (diff > 180) diff -= 365;
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
                        if (!lastVisit || apt.dateTime > lastVisit) clientLastVisit.set(client.id, apt.dateTime);
                    }
                }
            });
            return clients.filter(c => {
                const lastVisit = clientLastVisit.get(c.id);
                if (!lastVisit) return false;
                return differenceInDays(today, lastVisit) >= inactiveDays;
            });
        }
        case 'cancellation': {
            const scheduledClientPhones = new Set(
                appointments
                    .filter(apt => apt.status === 'scheduled' && isFuture(apt.dateTime))
                    .map(apt => apt.clientPhone)
            );
            const scheduledClients = clients.filter(c => scheduledClientPhones.has(c.phone));
            return scheduledClients.length > 0 ? scheduledClients : clients;
        }
        case 'newClients':
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
      setInactiveDays(90);
      setNewClientName('');
      setNewClientPhone('');
    }
  }, [campaignType]);

  const generateMessages = useCallback(() => {
    if (!profile) {
        toast({ variant: 'destructive', title: 'Perfil incompleto', description: 'Por favor, completa el perfil de tu negocio.' });
        return;
    }

    const messages: GeneratedMessage[] = [];

    if (campaignType === 'newClients') {
        const clientName = newClientName.split(' ')[0] || 'futuro cliente';
        const serviceList = services.map(s => `- ${s.name} (${s.duration} min): ${s.price.toFixed(2)}€`).join('\n');
        const message = `¡Hola ${clientName}!\n\nGracias por tu interés en ${profile.name}. ¡Será un placer cuidarte!\n\nAquí tienes nuestra carta de servicios:\n\n💆 Nuestros tratamientos:\n${serviceList}\n\n📍 Nos encontramos en:\n${profile.address || 'Contacta para más detalles'}\n\n¡Te esperamos!\n\nUn saludo,\n${profile.name}`;
        messages.push({ clientId: 'new-client', clientName: newClientName, clientPhone: newClientPhone, message: message });
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
                    message = `Hola ${client.name.split(' ')[0]},\n\nTe escribo para recordarte tu próxima cita en *${profile.name}*.\n\n🗓️ Fecha: ${format(appointment.dateTime, "EEEE, d 'de' MMMM", { locale: es })}\n⏰ Hora: ${format(appointment.dateTime, "p", { locale: es })}\n\n📍 Ubicación: ${profile.address}\n\nRecuerda, el pago es siempre en efectivo.\n\n¡Te esperamos!\n\nUn saludo,\n${profile.name}`;
                }
            } else if (campaignType === 'voucherPurchase') {
                 if (client.voucher) {
                    const clientName = client.name.split(' ')[0];
                    const sessions = client.voucher.totalSessions;
                    message = `¡Hola ${clientName}!\n\nMuchísimas gracias por adquirir tu bono de *${sessions} sesiones* en ${profile.name}. Es un placer para mí seguir cuidando de tu bienestar.\n\nPuedes usar tus sesiones cuando prefieras solicitando cita por aquí.\n\n¡Nos vemos pronto!\n\nUn saludo,\n${profile.name}`;
                }
            } else if (campaignType === 'pendingPayments') {
                const appointment = appointments
                    .filter(apt => apt.clientPhone === client.phone && apt.status === 'completed' && !apt.payment)
                    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime())[0];
                if (appointment) {
                    appointmentId = appointment.id;
                    const date = format(appointment.dateTime, "d 'de' MMMM", { locale: es });
                    const price = appointment.servicePrice || 0;
                    message = `Hola ${client.name.split(' ')[0]},\n\nTe escribo de parte de ${profile.name} para recordarte que el pago de tu cita del día ${date} está aún pendiente. El importe es de ${price.toFixed(2)}€.\n\n¡Muchas gracias!\n\nUn saludo,\n${profile.name}`;
                }
            } else if (campaignType === 'voucherStatus') {
                if (client.voucher) {
                    const clientName = client.name.split(' ')[0];
                    const remaining = client.voucher.sessions;
                    message = `Hola ${clientName}, te recordamos que tienes un bono activo con ${remaining} sesiones disponibles en ${profile.name}. ¡Te esperamos pronto!`;
                }
            } else if (campaignType === 'cancellation') {
                const appointment = appointments
                    .filter(apt => apt.clientPhone === client.phone && apt.status === 'scheduled' && isFuture(apt.dateTime))
                    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];
                const clientName = client.name.split(' ')[0];
                if (appointment) {
                    appointmentId = appointment.id;
                    const dateStr = format(appointment.dateTime, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
                    message = `Hola ${clientName},\n\nTe escribo de parte de *${profile.name}* para comunicarte que, por motivos personales / causas de fuerza mayor, nos vemos en la necesidad de anular o modificar tu cita del ${dateStr}.\n\nNos pondremos en contacto contigo lo antes posible para reubicarla en el horario que mejor te convenga.\n\nLamentamos profundamente las molestias causadas y agradecemos tu comprensión.\n\nUn saludo,\n${profile.name}`;
                } else {
                    message = `Hola ${clientName},\n\nTe escribo de parte de *${profile.name}* para comunicarte que, por motivos personales / causas de fuerza mayor, nos vemos en la necesidad de anular o modificar las citas programadas.\n\nNos pondremos en contacto contigo lo antes posible para reubicar tu sesión.\n\nLamentamos las molestias causadas y agradecemos tu comprensión.\n\nUn saludo,\n${profile.name}`;
                }
            } else if (campaignType === 'noShow') {
                const clientName = client.name.split(' ')[0];
                message = `Hola ${clientName},\n\nTe escribimos de parte de *${profile.name}*. Hemos notado que no pudiste asistir a tu última cita.\n\nEsperamos que todo esté bien. Si deseas agendar una nueva fecha o reprogramar tu sesión, no dudes en contactarnos.\n\n¡Un saludo!\n${profile.name}`;
            } else if (campaignType === 'offer') {
                const clientName = client.name.split(' ')[0];
                message = `¡Hola ${clientName}!\n\nEn *${profile.name}* tenemos una promoción especial pensada para ti. 🎁\n\n¡Consúltanos o agenda tu sesión para aprovecharla!\n\nUn saludo,\n${profile.name}`;
            } else if (campaignType === 'generalMessage') {
                const clientName = client.name.split(' ')[0];
                message = `Hola ${clientName},\n\nTe escribimos de parte de *${profile.name}* para informarte de la siguiente novedad:\n\n[Escribe aquí tu comunicado]\n\n¡Muchas gracias!\n\nUn saludo,\n${profile.name}`;
            } else if (campaignType === 'birthdays') {
                const clientName = client.name.split(' ')[0];
                message = `¡Hola ${clientName}!\n\n¡Feliz cumpleaños! 🎉 De parte de todo el equipo de ${profile.name}, te deseamos un día maravilloso.\n\n¡Esperamos verte pronto!\n\nUn saludo,\n${profile.name}`;
            }

            if (message) {
                messages.push({ clientId: client.id, clientName: `${client.name} ${client.lastName}`, clientPhone: client.phone, message, appointmentId });
            }
        }
    }
    setGeneratedMessages(messages);
    setStep('finished');
  }, [campaignType, selectedClientIds, clients, appointments, profile, toast, newClientName, newClientPhone, services]);

  const handleMarkAsSent = () => {
     if (campaignType === 'reminders') {
        const sentAppointmentIds = generatedMessages.map(msg => msg.appointmentId).filter(id => id !== undefined) as string[];
        setAppointments(prev => prev.map(apt => sentAppointmentIds.includes(apt.id) ? { ...apt, reminderSent: true } : apt));
    }
    setIsConfirmSentOpen(false);
    onOpenChange(false);
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedClientIds(checked ? targetClients.map(c => c.id) : []);
  };
  
  const details = campaignType ? campaignDetails[campaignType] : null;

  const renderConfiguration = () => {
      if (step !== 'select') return null;
      if (campaignType === 'newClients') {
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="new-client-name">Nombre del Contacto</Label>
                    <Input id="new-client-name" placeholder="p. ej., Laura" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="new-client-phone">Teléfono del Contacto</Label>
                    <Input id="new-client-phone" placeholder="p. ej., +34 600112233" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} />
                </div>
            </div>
        )
      }
      return null;
  }

  const renderContent = () => {
    if(step === 'finished') {
        if (generatedMessages.length === 0) return <Alert><CheckCircle className="h-4 w-4" /><AlertTitle>No se generaron mensajes</AlertTitle><AlertDescription>No se encontraron clientes válidos.</AlertDescription></Alert>;
        return (
            <ScrollArea className="h-[400px] pr-4">
                 <div className="space-y-4">
                    <AnimatePresence>
                    {generatedMessages.map((msg) => (
                        <motion.div key={msg.clientId + (msg.appointmentId || '')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <MessageCard message={msg} />
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        )
    }
    if (campaignType !== 'newClients' && targetClients.length === 0) return <Alert><CheckCircle className="h-4 w-4" /><AlertTitle>¡Nada que hacer!</AlertTitle><AlertDescription>No hay clientes para esta campaña.</AlertDescription></Alert>;
    return (
        <div className="space-y-4">
            {renderConfiguration()}
            {campaignType !== 'newClients' && (
                <>
                    <div className="flex items-center space-x-2 border-b pb-4">
                        <Checkbox id="select-all" onCheckedChange={handleSelectAll} checked={selectedClientIds.length === targetClients.length && targetClients.length > 0} />
                        <Label htmlFor="select-all" className="font-bold text-base text-slate-900">Seleccionar Todo ({targetClients.length})</Label>
                    </div>
                    <ScrollArea className="h-[350px] pr-4">
                        <div className="space-y-3">
                            {targetClients.map(c => {
                                let appointmentInfo = null;
                                if (campaignType === 'reminders') {
                                    const nextAppointment = appointments.filter(a => a.clientPhone === c.phone && a.status === 'scheduled' && isFuture(a.dateTime)).sort((d1, d2) => d1.dateTime.getTime() - d2.dateTime.getTime())[0];
                                    if (nextAppointment) appointmentInfo = format(nextAppointment.dateTime, "d MMM, p", { locale: es });
                                } else if (campaignType === 'pendingPayments') {
                                    const pendingAppointment = appointments.filter(a => a.clientPhone === c.phone && a.status === 'completed' && !a.payment).sort((a,b) => b.dateTime.getTime() - a.dateTime.getTime())[0];
                                    if (pendingAppointment) appointmentInfo = `Pendiente: ${(pendingAppointment.servicePrice || 0).toFixed(2)}€`;
                                } else if (campaignType === 'birthdays' && c.birthDate) {
                                    appointmentInfo = format(parseISO(c.birthDate), "d 'de' MMMM", { locale: es });
                                } else if (campaignType === 'voucherPurchase' || campaignType === 'voucherStatus') {
                                     appointmentInfo = `Bono: ${c.voucher?.sessions}/${c.voucher?.totalSessions} ses.`;
                                }
                                return (
                                <div key={c.id} className="flex flex-col p-2 rounded-md hover:bg-muted">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox id={c.id} onCheckedChange={(checked) => setSelectedClientIds(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} checked={selectedClientIds.includes(c.id)} />
                                        <Label htmlFor={c.id} className="flex flex-col flex-grow cursor-pointer">
                                            <span className="font-semibold text-slate-900">{c.name} {c.lastName}</span>
                                            <span className="text-sm text-muted-foreground">{c.phone}</span>
                                            {appointmentInfo && <span className="text-xs text-primary font-bold">{appointmentInfo}</span>}
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

  if (!campaignType || !details) return null;

  return (
    <>
      <Dialog open={!!campaignType} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3"><details.icon className="h-6 w-6 text-primary"/>{details.title}</DialogTitle>
            <DialogDescription>{step === 'finished' ? '¡Mensajes listos!' : 'Selecciona destinatarios.'}</DialogDescription>
          </DialogHeader>
          <div className="py-4">{renderContent()}</div>
          <DialogFooter className="sm:justify-end gap-2 pt-4">
              {step === 'finished' ? (
                  <Button onClick={() => setIsConfirmSentOpen(true)}>{campaignType === 'reminders' ? 'Marcar y Cerrar' : 'Cerrar'}</Button>
              ) : (
                  <Button onClick={generateMessages} disabled={selectedClientIds.length === 0 && campaignType !== 'newClients'}>Generar Mensaje(s)</Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isConfirmSentOpen} onOpenChange={setIsConfirmSentOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar cierre?</AlertDialogTitle>
                  <AlertDialogDescription>{campaignType === 'reminders' ? "Se marcarán como enviados." : "Se cerrará la ventana."}</AlertDialogDescription>
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
        toast({ title: "Copiado", description: "Mensaje copiado." });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="font-bold text-primary flex items-center gap-2"><Smartphone className="w-4 h-4"/>{message.clientName}</div>
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>{isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm"><Send className="w-4 h-4" /></Button></a>
                </div>
            </div>
            <Separator className="my-2" />
            <Textarea value={editedMessage} onChange={(e) => setEditedMessage(e.target.value)} className="text-sm italic min-h-[120px] bg-muted/50" />
        </div>
    )
}