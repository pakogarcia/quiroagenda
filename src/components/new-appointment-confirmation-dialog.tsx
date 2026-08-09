
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type Appointment, type Client, type BusinessProfile } from '@/lib/types';
import { Send, Smartphone, MessageSquare, Instagram, Facebook, Youtube, Link as LinkIcon, Globe, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { useAppData } from '@/context/app-data-context';
import { Textarea } from './ui/textarea';

type DialogMode = 'newAppointment' | 'voucherUpdate' | 'voucherPurchase';

type NewAppointmentConfirmationDialogProps = {
  appointment?: Appointment | null;
  voucherUpdateData?: { client: Client; remainingSessions: number; informativeOnly?: boolean } | null;
  voucherPurchaseData?: { client: Client; sessions: number; totalSessions: number } | null;
  onOpenChange: (isOpen: boolean) => void;
};


export function NewAppointmentConfirmationDialog({ appointment, voucherUpdateData, voucherPurchaseData, onOpenChange }: NewAppointmentConfirmationDialogProps) {
  const [generatedMessage, setGeneratedMessage] = React.useState('');
  const [editedMessage, setEditedMessage] = React.useState('');
  const [socials, setSocials] = React.useState({ website: false, instagram: false, facebook: false, tiktok: false, youtube: false });
  const { profile: businessProfile, services } = useAppData();

  const mode: DialogMode | null = appointment ? 'newAppointment' : voucherUpdateData ? 'voucherUpdate' : voucherPurchaseData ? 'voucherPurchase' : null;
  
  const generateMessage = React.useCallback(() => {
    if (!mode || !businessProfile) return;

    let finalMessage = '';
    const clientData = mode === 'newAppointment' ? appointment : mode === 'voucherUpdate' ? voucherUpdateData?.client : voucherPurchaseData?.client;
    
    if (mode === 'newAppointment' && appointment) {
        const serviceLine = appointment.serviceName ? `💆 *Servicio:* ${appointment.serviceName}\n` : '';
        const socialLinks = [];

        if (socials.website && businessProfile.website) socialLinks.push(`Página Web: ${businessProfile.website}`);
        if (socials.instagram && businessProfile.instagram) socialLinks.push(`Instagram: ${businessProfile.instagram}`);
        if (socials.facebook && businessProfile.facebook) socialLinks.push(`Facebook: ${businessProfile.facebook}`);
        if (socials.tiktok && businessProfile.tiktok) socialLinks.push(`TikTok: ${businessProfile.tiktok}`);
        if (socials.youtube && businessProfile.youtube) socialLinks.push(`YouTube: ${businessProfile.youtube}`);

        const socialBlock = socialLinks.length > 0 ? `\n\nSíguenos en nuestras redes:\n${socialLinks.join('\n')}` : '';

        finalMessage = `¡Hola ${appointment.clientName.split(' ')[0]}!\n\nTe confirmo tu cita en *${businessProfile.name}*.\n\nAquí tienes los detalles:\n🗓️ *Fecha:* ${format(appointment.dateTime, "EEEE, d 'de' MMMM", { locale: es })}\n⏰ *Hora:* ${format(appointment.dateTime, "p", { locale: es })}\n${serviceLine}\nNos vemos en:\n📍 ${businessProfile.address}\n\n*Recuerda, el pago es siempre en efectivo.*\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\n¡Muchas gracias!\n${businessProfile.name}${socialBlock}`;
    } else if (mode === 'voucherUpdate' && voucherUpdateData && clientData) {
        const rawName = 'name' in clientData ? clientData.name : clientData.clientName;
        const clientName = rawName.split(' ')[0];
        const remaining = voucherUpdateData.remainingSessions;
        if (remaining > 1) {
            finalMessage = `¡Hola ${clientName}! Te informamos que, tras tu última sesión, a tu bono le quedan *${remaining} sesiones*. ¡Esperamos verte pronto para la siguiente! Un saludo, ${businessProfile.name}.`;
        } else if (remaining === 1) {
            finalMessage = `¡Hola ${clientName}! Te informamos que, tras tu última sesión, a tu bono le queda solo *1 sesión*. ¡Te esperamos para la última! Un saludo, ${businessProfile.name}.`;
        } else {
            finalMessage = `¡Hola ${clientName}! Te informamos que has agotado las sesiones de tu bono. ¡Ha sido un placer! Si quieres renovarlo o probar otro servicio, no dudes en consultarnos. Un saludo, ${businessProfile.name}.`;
        }
    } else if (mode === 'voucherPurchase' && voucherPurchaseData && clientData) {
        const rawName = 'name' in clientData ? clientData.name : clientData.clientName;
        const clientName = rawName.split(' ')[0];
        const total = voucherPurchaseData.totalSessions;
        finalMessage = `¡Hola ${clientName}!\n\nMuchísimas gracias por adquirir tu nuevo bono de *${total} sesiones* en ${businessProfile.name}.\n\nEs un placer seguir cuidando de tu bienestar. Puedes solicitar tu próxima cita cuando prefieras.\n\n¡Nos vemos pronto!\n\nUn saludo,\n${businessProfile.name}`;
    }

    setGeneratedMessage(finalMessage);
    setEditedMessage(finalMessage);

  }, [mode, businessProfile, appointment, voucherUpdateData, voucherPurchaseData, services, socials]);


  React.useEffect(() => {
    if (businessProfile && (appointment || voucherUpdateData || voucherPurchaseData)) {
        generateMessage();
    }
  }, [businessProfile, appointment, voucherUpdateData, voucherPurchaseData, generateMessage]);
  
  // Effect to regenerate message when socials change
  React.useEffect(() => {
      if (businessProfile && (appointment || voucherUpdateData || voucherPurchaseData)) {
          generateMessage();
      }
  }, [socials, generateMessage, businessProfile, appointment, voucherUpdateData, voucherPurchaseData]);
  
  const handleClose = () => {
    onOpenChange(false);
  }
  
  const handleSocialsChange = (social: keyof typeof socials, checked: boolean) => {
    setSocials(s => ({...s, [social]: checked }));
  }

  const getDialogTitle = () => {
    if (mode === 'voucherPurchase') return "¡Nuevo Bono Adquirido!";
    if (mode === 'voucherUpdate') return voucherUpdateData?.informativeOnly ? "Notificar Sesiones Restantes" : "Bono Actualizado";
    return appointment?.id === 'new-client-welcome' ? "Mensaje de Bienvenida" : "Cita Confirmada";
  }
  
  const getDialogDescription = () => {
      if (mode === 'voucherPurchase') return "Se ha registrado la compra del bono. Puedes enviar un mensaje de agradecimiento al cliente por WhatsApp.";
      if (mode === 'voucherUpdate') return voucherUpdateData?.informativeOnly ? "Envía un mensaje a tu cliente para informarle de las sesiones que le quedan." : "Se ha descontado una sesión del bono. Puedes enviar una notificación por WhatsApp.";
      return appointment?.id === 'new-client-welcome' ? "Envía un mensaje de presentación con tus servicios y datos de contacto a este nuevo cliente potencial." : "La cita ha sido creada/actualizada. Puedes enviar una confirmación por WhatsApp.";
  }
  
  const clientData = mode === 'newAppointment' ? appointment : mode === 'voucherUpdate' ? voucherUpdateData?.client : voucherPurchaseData?.client;
  const clientPhoneNumber = mode === 'newAppointment' ? appointment?.clientPhone : mode === 'voucherUpdate' ? voucherUpdateData?.client.phone : voucherPurchaseData?.client.phone;
  const whatsappLink = clientPhoneNumber ? `https://wa.me/${clientPhoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(editedMessage)}` : '';

  const showSocials = businessProfile && (businessProfile.website || businessProfile.instagram || businessProfile.facebook || businessProfile.tiktok || businessProfile.youtube);

  if (!mode) return null;

  return (
    <Dialog open={!!mode} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 space-y-4">
          {!generatedMessage ? (
             <div className="space-y-3">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-16 w-full" />
             </div>
          ) : (
            <div className="p-4 bg-muted rounded-md text-sm">
              <p className='font-semibold text-primary flex items-center gap-2 mb-2'><Smartphone className="w-4 h-4"/>{clientData ? ('clientName' in clientData ? clientData.clientName : clientData.name) : ''}</p>
               <Textarea 
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="min-h-[200px] text-muted-foreground whitespace-pre-wrap bg-background"
              />
            </div>
          )}
        </div>

        {showSocials && mode === 'newAppointment' && (
             <>
                <Separator />
                <div className="pt-4 space-y-4">
                     <h4 className="font-medium text-sm">Incluir Redes Sociales</h4>
                     <div className="flex flex-wrap items-center gap-4">
                        {businessProfile?.website && (
                            <div className="flex items-center space-x-2">
                                <Checkbox id="web-confirm" checked={socials.website} onCheckedChange={(checked) => handleSocialsChange('website', !!checked)} />
                                <label htmlFor="web-confirm" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Globe /> Web</label>
                            </div>
                        )}
                        {businessProfile?.instagram && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="ig-confirm" checked={socials.instagram} onCheckedChange={(checked) => handleSocialsChange('instagram', !!checked)} />
                                <label htmlFor="ig-confirm" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Instagram /> Instagram</label>
                             </div>
                        )}
                         {businessProfile?.facebook && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="fb-confirm" checked={socials.facebook} onCheckedChange={(checked) => handleSocialsChange('facebook', !!checked)} />
                                <label htmlFor="fb-confirm" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Facebook /> Facebook</label>
                             </div>
                        )}
                         {businessProfile?.tiktok && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="tt-confirm" checked={socials.tiktok} onCheckedChange={(checked) => handleSocialsChange('tiktok', !!checked)} />
                                <label htmlFor="tt-confirm" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><LinkIcon /> TikTok</label>
                             </div>
                        )}
                         {businessProfile?.youtube && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="yt-confirm" checked={socials.youtube} onCheckedChange={(checked) => handleSocialsChange('youtube', !!checked)} />
                                <label htmlFor="yt-confirm" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Youtube /> YouTube</label>
                             </div>
                        )}
                     </div>
                </div>
            </>
        )}
        
        <DialogFooter className="pt-4">
            <div className="flex flex-col gap-2 w-full">
              {generatedMessage && clientPhoneNumber && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={handleClose} className="w-full">
                      <Button className="w-full">
                          <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp
                      </Button>
                  </a>
              )}
              <Button variant="outline" onClick={handleClose} className="w-full">
                  Cerrar
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
