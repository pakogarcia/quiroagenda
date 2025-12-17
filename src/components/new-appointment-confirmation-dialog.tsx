
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
import { CampaignType } from './campaign-dialog';

type DialogMode = 'newAppointment' | 'voucherUpdate';

type NewAppointmentConfirmationDialogProps = {
  appointment?: Appointment | null;
  voucherUpdateData?: { client: Client; remainingSessions: number; informativeOnly?: boolean } | null;
  onOpenChange: (isOpen: boolean) => void;
};


export function NewAppointmentConfirmationDialog({ appointment, voucherUpdateData, onOpenChange }: NewAppointmentConfirmationDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedMessage, setGeneratedMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [socials, setSocials] = React.useState({ website: true, instagram: true, facebook: true, tiktok: true, youtube: true });
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { profile: businessProfile, services } = useAppData();
  const [showAIOffline, setShowAIOffline] = React.useState(false);

  const mode: DialogMode | null = appointment ? 'newAppointment' : voucherUpdateData ? 'voucherUpdate' : null;
  
  const generateMessage = React.useCallback(async () => {
    if (!mode || !businessProfile) return;
    
    setShowAIOffline(true);

  }, [mode, businessProfile]);


  React.useEffect(() => {
    if (businessProfile && (appointment || voucherUpdateData)) {
        generateMessage();
    }
  }, [businessProfile, appointment, voucherUpdateData, generateMessage]);
  
  const handleClose = () => {
    onOpenChange(false);
  }
  
  const handleSocialsChange = (social: keyof typeof socials, checked: boolean) => {
    setSocials(s => ({...s, [social]: checked }));
  }

  const getDialogTitle = () => {
    if (mode === 'voucherUpdate') return voucherUpdateData?.informativeOnly ? "Notificar Sesiones Restantes" : "Bono Actualizado";
    return appointment?.id === 'new-client-welcome' ? "Mensaje de Bienvenida" : "Cita Confirmada";
  }
  
  const getDialogDescription = () => {
      if (mode === 'voucherUpdate') return voucherUpdateData?.informativeOnly ? "Envía un mensaje a tu cliente para informarle de las sesiones que le quedan." : "Se ha descontado una sesión del bono. Puedes enviar una notificación por WhatsApp.";
      return appointment?.id === 'new-client-welcome' ? "Envía un mensaje de presentación con tus servicios y datos de contacto a este nuevo cliente potencial." : "La cita ha sido creada/actualizada. Puedes enviar una confirmación por WhatsApp.";
  }

  if (!mode) return null;
  
  const clientData = mode === 'newAppointment' ? appointment : voucherUpdateData?.client;
  const clientPhoneNumber = mode === 'newAppointment' ? appointment?.clientPhone : voucherUpdateData?.client.phone;
  const whatsappLink = clientPhoneNumber ? `https://wa.me/${clientPhoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(generatedMessage)}` : '';

  const showSocials = !isLoading && businessProfile && (businessProfile.website || businessProfile.instagram || businessProfile.facebook || businessProfile.tiktok || businessProfile.youtube);

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
          {(isLoading || isGenerating || showAIOffline) && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Función no disponible</AlertTitle>
                <AlertDescription>
                    La generación de mensajes con IA ha sido desactivada temporalmente.
                </AlertDescription>
            </Alert>
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
              <p className='font-semibold text-primary flex items-center gap-2 mb-2'><Smartphone className="w-4 h-4"/>{clientData?.clientName || clientData?.name}</p>
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
        
        <DialogFooter className="pt-4">
            <div className="flex flex-col gap-2 w-full">
              {generatedMessage && !isGenerating && clientPhoneNumber && (
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

