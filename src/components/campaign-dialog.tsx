

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
import { format, subDays, startOfToday, isWithinInterval, parseISO, getMonth, getDate, differenceInDays, addDays, getDayOfYear, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Gift, Send, Calendar as CalendarIcon, Smartphone, MessageSquare, CheckCircle, Bell, Cake, Clock, Users, AlertCircle } from 'lucide-react';
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


export type CampaignType = 'reminders' | 'pendingPayments' | 'birthdays' | 'inactiveClients' | 'newClients' | 'offer' | 'voucherStatus';

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
    birthdays: { title: 'Felicitaciones de Cumpleaños', icon: Cake },
    inactiveClients: { title: 'Clientes Inactivos', icon: Clock },
    newClients: { title: 'Bienvenida a Nuevos Clientes', icon: Users },
    offer: { title: 'Campaña de Oferta', icon: Gift },
    voucherStatus: { title: 'Notificar Sesiones de Bono', icon: Gift }
};

export function CampaignDialog({ campaignType, onOpenChange }: CampaignDialogProps) {
  const { clients, profile, appointments, setAppointments } = useAppData();
  
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'generate' | 'finished'>('select');
  
  const [isConfirmSentOpen, setIsConfirmSentOpen] = React.useState(false);

  // Specific state for different campaigns
  const [offerMessage, setOfferMessage] = useState('');
  const [inactiveDays, setInactiveDays] = useState<number>(90);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const targetClients = useMemo(() => {
    if (!campaignType) return [];
    const today = startOfToday();

    switch (campaignType) {
        case 'reminders': {
            const scheduledAppointments = appointments.filter(apt => apt.status === 'scheduled' && !apt.reminderSent && !isBefore(apt.dateTime, today));
            const clientPhones = new Set(scheduledAppointments.map(apt => apt.clientPhone));
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
        case 'birthdays': {
                const todayDayOfYear = getDayOfYear(today);
                const isLeapYear = (new Date(today.getFullYear(), 1, 29).getDate() === 29);

                return clients
                    .filter(c => !!c.birthDate)
                    .map(c => {
                        const birthDate = parseISO(c.birthDate!);
                        // Set year to current year to normalize for comparison
                        birthDate.setFullYear(today.getFullYear());
                        let birthDayOfYear = getDayOfYear(birthDate);

                        // Adjust for leap years if necessary
                        if (isLeapYear && birthDayOfYear > 59) birthDayOfYear++; // After Feb 28
                        if (!isLeapYear && getMonth(parseISO(c.birthDate!)) > 1) birthDayOfYear--;
                        
                        const diff = birthDayOfYear - todayDayOfYear;
                        
                        // Handle year wrap-around for birthdays in early January when checking in late December
                        let proximity = diff;
                        if (diff < -180) { // e.g., today is Dec 30, birthday is Jan 2
                            proximity = diff + 365;
                        }
                        // Handle year wrap-around for birthdays in late December when checking in early January
                        if (diff > 180) { // e.g., today is Jan 2, birthday is Dec 30
                            proximity = diff - 365;
                        }

                        return { ...c, proximity };
                    })
                    .filter(c => c.proximity >= -7 && c.proximity <= 14) // Past 7 days, next 14 days
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
        case 'newClients':
            return []; // Will be handled by a special form
        case 'offer':
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
      setNewClientName('');
      setNewClientPhone('');
    }
  }, [campaignType]);

  const handleGenerateMessages = useCallback(async () => {
    if (!campaignType) return;
    
    setIsLoading(true);
    setStep('generate');
    setGeneratedMessages([]);

    let selectedClients;
    if (campaignType === 'newClients') {
        selectedClients = [{id: 'new', name: newClientName, phone: newClientPhone, lastName: ''}];
    } else {
        selectedClients = targetClients.filter(c => selectedClientIds.includes(c.id));
    }
    
    let generated: GeneratedMessage[] = [];

    for (const client of selectedClients) {
        let message = '';
        try {
            switch(campaignType) {
                case 'reminders': {
                    const clientAppointments = appointments
                        .filter(a => a.clientPhone === client.phone && a.status === 'scheduled' && !a.reminderSent && !isBefore(a.dateTime, startOfToday()))
                        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

                    if (clientAppointments.length > 0) {
                        const nextAppointment = clientAppointments[0];
                        const result = await generateWhatsappReminder({
                            clientName: client.name.split(' ')[0],
                            appointmentDateTime: format(nextAppointment.dateTime, "EEEE, d 'de' MMMM 'de' yyyy 'a las' p", { locale: es }),
                            clientPhoneNumber: client.phone,
                            businessName: profile?.name,
                        });
                        message = result.whatsappMessage;
                        generated.push({ 
                            clientId: client.id, 
                            clientName: client.name, 
                            clientPhone: client.phone, 
                            message,
                            appointmentId: nextAppointment.id
                        });
                    }
                    break;
                }
                case 'pendingPayments': {
                    const result = await generatePendingPaymentWhatsapp({ clientName: client.name, businessName: profile?.name });
                    message = result.whatsappMessage;
                    generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message });
                    break;
                }
                case 'birthdays': {
                    const result = await generateBirthdayWhatsapp({ clientName: client.name, businessName: profile?.name });
                    message = result.whatsappMessage;
                    generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message });
                    break;
                }
                 case 'inactiveClients': {
                    const lastAppointment = appointments
                        .filter(a => a.clientPhone === client.phone && a.status === 'completed')
                        .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];
                    if (lastAppointment) {
                        const days = differenceInDays(new Date(), lastAppointment.dateTime);
                        const result = await generateInactiveClientWhatsapp({ clientName: client.name, inactiveDays: days, businessName: profile?.name });
                        message = result.whatsappMessage;
                        generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message });
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
                     generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message });
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
                        generated.push({ clientId: client.id, clientName: client.name, clientPhone: client.phone, message });
                    }
                    break;
                }
                 case 'newClients': {
                    try {
                        const result = await generateWelcomeWhatsapp({ 
                            clientName: newClientName.split(' ')[0], 
                            businessAddress: profile?.address || '',
                            businessName: profile?.name,
                            website: profile?.website,
                            instagram: profile?.instagram,
                            facebook: profile?.facebook,
                            tiktok: profile?.tiktok,
                            youtube: profile?.youtube,
                        });

                        generated.push({ clientId: 'new', clientName: newClientName, clientPhone: newClientPhone, message: result.whatsappMessage });
                    } catch (error) {
                        console.error('Failed to generate welcome message', error);
                    }
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
  }, [campaignType, selectedClientIds, appointments, profile, offerMessage, inactiveDays, targetClients, newClientName, newClientPhone]);

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
      if (campaignType === 'newClients') {
        return (
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="newClientName">Nombre del Cliente</Label>
                    <Input id="newClientName" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nombre del nuevo cliente"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="newClientPhone">Teléfono del Cliente</Label>
                    <Input id="newClientPhone" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="+34 ..."/>
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
                            <MessageCard message={msg} />
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
                        {targetClients.map(c => (
                            <div key={c.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
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
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                </>
            )}
        </div>
    )
  }

  const renderFooter = () => {
    if (step === 'finished') {
        if (generatedMessages.length > 0 && campaignType !== 'newClients') {
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
            disabled = isLoading || !newClientName || !newClientPhone;
        } else {
            disabled = isLoading || selectedClientIds.length === 0 || (campaignType === 'offer' && !offerMessage);
        }
        
        const buttonText = campaignType === 'newClients'
            ? 'Generar Mensaje'
            : `Generar ${selectedClientIds.length} Mensaje(s)`;

        return (
            <Button onClick={handleGenerateMessages} disabled={disabled}>
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
            {campaignType === 'newClients' ? 'Introduce los datos del nuevo cliente para generar un mensaje de bienvenida.' : 'Selecciona los destinatarios y configura las opciones para esta campaña.'}
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
                    Esta acción marcará los mensajes como enviados (si aplica) y no podrás volver a generarlos desde esta pantalla. ¿Estás seguro?
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

function MessageCard({ message }: { message: GeneratedMessage }) {
    const whatsappLink = `https://wa.me/${message.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message.message)}`;
    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="font-semibold text-primary flex items-center gap-2"><Smartphone className="w-4 h-4"/>{message.clientName}</div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                        <Send className="mr-2 h-4 w-4" /> Enviar
                    </Button>
                </a>
            </div>
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">"{message.message}"</p>
        </div>
    )
}

    
