
'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateWhatsappReminder } from '@/ai/flows/generate-whatsapp-reminder';
import type { Appointment, BusinessProfile } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Send, CheckCircle, Smartphone, Instagram, Facebook, Youtube, Link as LinkIcon, Globe } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

type Reminder = {
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  message: string;
};

type WhatsappReminderDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointments: Appointment[];
  onRemindersSent: (appointmentIds: string[]) => void;
};

export function WhatsappReminderDialog({ isOpen, onOpenChange, appointments, onRemindersSent }: WhatsappReminderDialogProps) {
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<string[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'generate' | 'finished'>('select');
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [socials, setSocials] = React.useState({ website: false, instagram: false, facebook: false, tiktok: false, youtube: false });


  const appointmentsToRemind = appointments.filter(apt => !apt.reminderSent);
  
  React.useEffect(() => {
    if (isOpen) {
      try {
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) {
          setBusinessProfile(JSON.parse(storedProfile));
        }
      } catch (error) {
        console.error("Failed to load business profile.", error);
      }
    } else {
        // Reset state on close
        setTimeout(() => {
            setStep('select');
            setReminders([]);
            setSelectedAppointmentIds([]);
        }, 300);
    }
  }, [isOpen]);

  const handleGenerateReminders = useCallback(async () => {
    setIsLoading(true);
    setStep('generate');
    setReminders([]);

    const selectedAppointments = appointmentsToRemind.filter(apt => selectedAppointmentIds.includes(apt.id));

    const generatedReminders: Reminder[] = [];
    for (const apt of selectedAppointments) {
      try {
        const result = await generateWhatsappReminder({
          clientName: apt.clientName.split(' ')[0],
          appointmentDateTime: format(apt.dateTime, "EEEE, d 'de' MMMM 'de' yyyy 'a las' p", { locale: es }),
          clientPhoneNumber: apt.clientPhone,
          businessName: businessProfile?.name,
          website: socials.website ? businessProfile?.website : undefined,
          instagram: socials.instagram ? businessProfile?.instagram : undefined,
          facebook: socials.facebook ? businessProfile?.facebook : undefined,
          tiktok: socials.tiktok ? businessProfile?.tiktok : undefined,
          youtube: socials.youtube ? businessProfile?.youtube : undefined,
        });
        generatedReminders.push({
          appointmentId: apt.id,
          clientName: apt.clientName,
          clientPhone: apt.clientPhone,
          message: result.whatsappMessage,
        });
      } catch (error) {
        console.error('Failed to generate reminder for', apt.clientName, error);
      }
    }
    
    setReminders(generatedReminders);
    setIsLoading(false);
    setStep('finished');
  }, [appointmentsToRemind, selectedAppointmentIds, businessProfile, socials]);

  const handleMarkAsSent = () => {
    onRemindersSent(reminders.map(r => r.appointmentId));
    onOpenChange(false);
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedAppointmentIds(appointmentsToRemind.map(apt => apt.id));
    } else {
        setSelectedAppointmentIds([]);
    }
  };

  const showSocials = step === 'select' && businessProfile && (businessProfile.website || businessProfile.instagram || businessProfile.facebook || businessProfile.tiktok || businessProfile.youtube);

  const renderContent = () => {
    if (step === 'generate') {
      return (
        <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground animate-pulse">Generando recordatorios personalizados...</p>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      );
    }
    
    if(step === 'finished') {
        if (reminders.length === 0) {
            return (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        No se pudieron generar los recordatorios. Por favor, inténtalo de nuevo.
                    </AlertDescription>
                </Alert>
            );
        }
        return (
            <ScrollArea className="h-[400px] pr-4">
                 <div className="space-y-4">
                    <AnimatePresence>
                    {reminders.map((reminder) => (
                        <motion.div 
                            key={reminder.appointmentId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                        <Card reminder={reminder} />
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        )
    }

    // Step 'select'
    if (appointmentsToRemind.length === 0) {
        return (
            <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>¡Todo listo!</AlertTitle>
                <AlertDescription>
                    No hay citas futuras pendientes de recordatorio.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b pb-4">
                <Checkbox 
                    id="select-all" 
                    onCheckedChange={handleSelectAll}
                    checked={selectedAppointmentIds.length === appointmentsToRemind.length && appointmentsToRemind.length > 0}
                />
                <Label htmlFor="select-all" className="font-bold text-base">
                    Seleccionar Todo
                </Label>
            </div>
            <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                    {appointmentsToRemind.map(apt => (
                        <div key={apt.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                            <Checkbox
                                id={apt.id}
                                onCheckedChange={(checked) => {
                                    setSelectedAppointmentIds(prev => 
                                        checked ? [...prev, apt.id] : prev.filter(id => id !== apt.id)
                                    );
                                }}
                                checked={selectedAppointmentIds.includes(apt.id)}
                            />
                            <Label htmlFor={apt.id} className="flex flex-col flex-grow cursor-pointer">
                                <span className="font-semibold">{apt.clientName}</span>
                                <span className="text-sm text-muted-foreground">
                                    {format(apt.dateTime, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                </span>
                            </Label>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
  }

  const renderFooter = () => {
    if (step === 'finished') {
        return (
             <Button variant="default" onClick={handleMarkAsSent}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como Enviados y Cerrar
            </Button>
        )
    }
    if (step === 'select') {
        return (
            <Button onClick={handleGenerateReminders} disabled={isLoading || selectedAppointmentIds.length === 0}>
                <Send className="mr-2 h-4 w-4" />
                {isLoading ? 'Generando...' : `Generar ${selectedAppointmentIds.length} Recordatorio(s)`}
            </Button>
        )
    }
    return null; // No footer during generation
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Recordatorios de WhatsApp</DialogTitle>
          <DialogDescription>
            Selecciona las citas a las que quieres enviar un recordatorio.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{renderContent()}</div>
        {showSocials && (
             <>
                <Separator />
                <div className="py-4 space-y-4">
                     <h4 className="font-medium text-sm">Incluir Web y Redes Sociales</h4>
                     <div className="flex flex-wrap items-center gap-4">
                        {businessProfile?.website && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="web-reminder" checked={socials.website} onCheckedChange={(checked) => setSocials(s => ({...s, website: !!checked}))} />
                                <label htmlFor="web-reminder" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Globe /> Web</label>
                             </div>
                        )}
                        {businessProfile?.instagram && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="ig-reminder" checked={socials.instagram} onCheckedChange={(checked) => setSocials(s => ({...s, instagram: !!checked}))} />
                                <label htmlFor="ig-reminder" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Instagram /> Instagram</label>
                             </div>
                        )}
                         {businessProfile?.facebook && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="fb-reminder" checked={socials.facebook} onCheckedChange={(checked) => setSocials(s => ({...s, facebook: !!checked}))} />
                                <label htmlFor="fb-reminder" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Facebook /> Facebook</label>
                             </div>
                        )}
                         {businessProfile?.tiktok && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="tt-reminder" checked={socials.tiktok} onCheckedChange={(checked) => setSocials(s => ({...s, tiktok: !!checked}))} />
                                <label htmlFor="tt-reminder" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><LinkIcon /> TikTok</label>
                             </div>
                        )}
                         {businessProfile?.youtube && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="yt-reminder" checked={socials.youtube} onCheckedChange={(checked) => setSocials(s => ({...s, youtube: !!checked}))} />
                                <label htmlFor="yt-reminder" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Youtube /> YouTube</label>
                             </div>
                        )}
                     </div>
                </div>
            </>
        )}
        <DialogFooter className="sm:justify-end gap-2 pt-4">
            {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Card({ reminder }: { reminder: Reminder }) {
    const whatsappLink = `https://wa.me/${reminder.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(reminder.message)}`;
    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="font-semibold text-primary flex items-center gap-2"><Smartphone className="w-4 h-4"/>{reminder.clientName}</div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                        <Send className="mr-2 h-4 w-4" /> Enviar
                    </Button>
                </a>
            </div>
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground italic">"{reminder.message}"</p>
        </div>
    )
}
