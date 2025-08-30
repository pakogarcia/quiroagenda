
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type Appointment, type Client } from '@/lib/types';
import { Send, Smartphone, MessageSquare, Instagram, Facebook, Youtube, Link as LinkIcon, Globe } from 'lucide-react';
import { generateNewAppointmentWhatsapp } from '@/ai/flows/generate-new-appointment-whatsapp';
import { generateVoucherUpdateWhatsapp } from '@/ai/flows/generate-voucher-update-whatsapp';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { useAppData } from '@/context/app-data-context';

type DialogMode = 'newAppointment' | 'voucherUpdate';

type NewAppointmentConfirmationDialogProps = {
  appointment?: Appointment | null;
  voucherUpdateData?: { client: Client; remainingSessions: number } | null;
  onOpenChange: (isOpen: boolean) => void;
};


export function NewAppointmentConfirmationDialog({ appointment, voucherUpdateData, onOpenChange }: NewAppointmentConfirmationDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedMessage, setGeneratedMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [socials, setSocials] = React.useState({ website: true, instagram: true, facebook: true, tiktok: true, youtube: true });
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { profile: businessProfile } = useAppData();

  const mode: DialogMode | null = appointment ? 'newAppointment' : voucherUpdateData ? 'voucherUpdate' : null;
  
  const generateMessage = React.useCallback(async () => {
    if (!mode || !businessProfile) return;
    
    setIsGenerating(true);
    setGeneratedMessage('');
    setError('');

    try {
        if (mode === 'newAppointment' && appointment) {
             if (!businessProfile.address) {
                setError('No se ha configurado la dirección del negocio en la sección "Quién eres". Por favor, completa tu perfil.');
                return;
            }
             const result = await generateNewAppointmentWhatsapp({
                clientName: appointment.clientName.split(' ')[0],
                appointmentDateTime: format(appointment.dateTime, "EEEE, d 'de' MMMM 'de' yyyy 'a las' p", { locale: es }),
                businessAddress: businessProfile.address,
                businessName: businessProfile.name,
                website: socials.website ? businessProfile.website : undefined,
                instagram: socials.instagram ? businessProfile.instagram : undefined,
                facebook: socials.facebook ? businessProfile.facebook : undefined,
                tiktok: socials.tiktok ? businessProfile.tiktok : undefined,
                youtube: socials.youtube ? businessProfile.youtube : undefined,
            });
            setGeneratedMessage(result.whatsappMessage);
        } else if (mode === 'voucherUpdate' && voucherUpdateData) {
            const result = await generateVoucherUpdateWhatsapp({
                clientName: voucherUpdateData.client.name.split(' ')[0],
                remainingSessions: voucherUpdateData.remainingSessions,
                businessName: businessProfile?.name,
                website: socials.website ? businessProfile?.website : undefined,
                instagram: socials.instagram ? businessProfile?.instagram : undefined,
                facebook: socials.facebook ? businessProfile?.facebook : undefined,
                tiktok: socials.tiktok ? businessProfile?.tiktok : undefined,
                youtube: socials.youtube ? businessProfile?.youtube : undefined,
            });
            setGeneratedMessage(result.whatsappMessage);
        }

    } catch (e) {
      console.error("Failed to generate confirmation message.", e);
      setError('No se pudo generar el mensaje de confirmación.');
    } finally {
      setIsGenerating(false);
    }
  }, [appointment, voucherUpdateData, businessProfile, socials, mode]);


  React.useEffect(() => {
    if (businessProfile && (appointment || voucherUpdateData)) {
        generateMessage();
    }
  }, [businessProfile, generateMessage, appointment, voucherUpdateData]);
  
  if (!mode) return null;
  
  const clientData = mode === 'newAppointment' ? appointment : voucherUpdateData?.client;
  const whatsappLink = `https://wa.me/${clientData?.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(generatedMessage)}`;

  const handleClose = () => {
    onOpenChange(false);
  }
  
  const handleSocialsChange = (social: keyof typeof socials, checked: boolean) => {
    setSocials(s => ({...s, [social]: checked }));
  }

  const showSocials = !isLoading && businessProfile && (businessProfile.website || businessProfile.instagram || businessProfile.facebook || businessProfile.tiktok || businessProfile.youtube);

  const getDialogTitle = () => {
    if (mode === 'voucherUpdate') return "Bono Actualizado";
    return "Cita Confirmada";
  }
  
  const getDialogDescription = () => {
      if (mode === 'voucherUpdate') return "Se ha descontado una sesión del bono. Puedes enviar una notificación por WhatsApp.";
      return "La cita ha sido creada/actualizada. Puedes enviar una confirmación por WhatsApp.";
  }

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
          {(isLoading || isGenerating) && (
            <div className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
          {error && !isGenerating && (
            <Alert variant="destructive">
              <MessageSquare className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {generatedMessage && !isGenerating && (
            <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
              <p className='font-semibold text-primary flex items-center gap-2 mb-2'><Smartphone className="w-4 h-4"/>{clientData?.name}</p>
              <p>{generatedMessage}</p>
            </div>
          )}
        </div>

        {showSocials && (
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
        
        <DialogFooter className="pt-4 flex w-full justify-between items-center">
          <Button type="button" variant="ghost" onClick={generateMessage} disabled={isGenerating}>
              Regenerar Mensaje
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>Cerrar</Button>
            {generatedMessage && !isGenerating && clientData?.phone && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={handleClose}>
                    <Button>
                        <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp
                    </Button>
                </a>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
