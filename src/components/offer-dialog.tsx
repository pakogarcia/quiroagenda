
'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateOfferWhatsapp } from '@/ai/flows/generate-offer-whatsapp';
import type { Client, BusinessProfile } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Gift, Send, Calendar as CalendarIcon, Smartphone, MessageSquare, Instagram, Facebook, Youtube, Link as LinkIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';

const CLIENTS_STORAGE_KEY = 'quiroagenda_clients';
const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

type Offer = {
  clientId: string;
  clientName: string;
  clientPhone: string;
  message: string;
};

type OfferDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function OfferDialog({ isOpen, onOpenChange }: OfferDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [offerMessage, setOfferMessage] = useState('');
  const [generatedOffers, setGeneratedOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [socials, setSocials] = React.useState({ website: false, instagram: false, facebook: false, tiktok: false, youtube: false });


  React.useEffect(() => {
    if (isOpen) {
      try {
        const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (storedClients) {
          setClients(JSON.parse(storedClients));
        }
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) {
          setBusinessProfile(JSON.parse(storedProfile));
        }
      } catch (error) {
        console.error("Failed to load data from storage.", error);
      }
    } else {
      setIsGenerated(false);
      setGeneratedOffers([]);
      setOfferMessage('');
      setDateRange(undefined);
    }
  }, [isOpen]);

  const handleGenerateOffers = useCallback(async () => {
    if (!dateRange?.from || !offerMessage || clients.length === 0) {
      return;
    }

    setIsLoading(true);
    setIsGenerated(false);
    setGeneratedOffers([]);

    const formattedDateRange = `del ${format(dateRange.from, "d 'de' MMMM", { locale: es })} ${dateRange.to ? `al ${format(dateRange.to, "d 'de' MMMM 'de' yyyy", { locale: es })}` : ''}`;

    const newOffers: Offer[] = [];
    for (const client of clients) {
      try {
        const result = await generateOfferWhatsapp({
          clientName: client.name,
          offerMessage: offerMessage,
          dateRange: formattedDateRange,
          businessName: businessProfile?.name,
          website: socials.website ? businessProfile?.website : undefined,
          instagram: socials.instagram ? businessProfile?.instagram : undefined,
          facebook: socials.facebook ? businessProfile?.facebook : undefined,
          tiktok: socials.tiktok ? businessProfile?.tiktok : undefined,
          youtube: socials.youtube ? businessProfile?.youtube : undefined,
        });
        newOffers.push({
          clientId: client.id,
          clientName: client.name,
          clientPhone: client.phone,
          message: result.whatsappMessage,
        });
        setGeneratedOffers([...newOffers]);
      } catch (error) {
        console.error('Failed to generate offer for', client.name, error);
      }
    }
    
    setIsLoading(false);
    setIsGenerated(true);
  }, [dateRange, offerMessage, clients, businessProfile, socials]);

  const showSocials = !isGenerated && businessProfile && (businessProfile.website || businessProfile.instagram || businessProfile.facebook || businessProfile.tiktok || businessProfile.youtube);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-center text-muted-foreground animate-pulse">Generando ofertas personalizadas para {clients.length} clientes...</p>
          {[...Array(Math.min(3, clients.length))].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      );
    }

    if (isGenerated) {
      return (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            <AnimatePresence>
              {generatedOffers.map((offer) => (
                <motion.div
                  key={offer.clientId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <OfferCard offer={offer} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="offerMessage">Mensaje de la Oferta</Label>
          <Textarea
            id="offerMessage"
            placeholder="p. ej., 20% de descuento en masajes relajantes."
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Período de Validez</Label>
           <Popover>
              <PopoverTrigger asChild>
                  <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !dateRange && "text-muted-foreground"
                      )}
                  >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                          dateRange.to ? (
                              <>
                                  {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                  {format(dateRange.to, "LLL dd, y", { locale: es })}
                              </>
                          ) : (
                              format(dateRange.from, "LLL dd, y", { locale: es })
                          )
                      ) : (
                          <span>Elige un rango de fechas</span>
                      )}
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      locale={es}
                  />
              </PopoverContent>
          </Popover>
        </div>
         {clients.length === 0 && (
             <Alert variant="destructive">
                <MessageSquare className="h-4 w-4" />
                <AlertTitle>No hay clientes</AlertTitle>
                <AlertDescription>
                    No tienes clientes guardados. Añade algunos en la sección de "Clientes" para poder enviar ofertas.
                </AlertDescription>
            </Alert>
         )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear y Enviar Oferta</DialogTitle>
          <DialogDescription>
            Diseña tu oferta y genera mensajes de WhatsApp para todos tus clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">{renderContent()}</div>

        {showSocials && (
             <>
                <Separator />
                <div className="py-4 space-y-4">
                     <h4 className="font-medium text-sm">Incluir Redes Sociales</h4>
                     <div className="flex flex-wrap items-center gap-4">
                        {businessProfile?.website && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="web-offer" checked={socials.website} onCheckedChange={(checked) => setSocials(s => ({...s, website: !!checked}))} />
                                <label htmlFor="web-offer" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><LinkIcon /> Web</label>
                             </div>
                        )}
                        {businessProfile?.instagram && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="ig-offer" checked={socials.instagram} onCheckedChange={(checked) => setSocials(s => ({...s, instagram: !!checked}))} />
                                <label htmlFor="ig-offer" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Instagram /> Instagram</label>
                             </div>
                        )}
                         {businessProfile?.facebook && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="fb-offer" checked={socials.facebook} onCheckedChange={(checked) => setSocials(s => ({...s, facebook: !!checked}))} />
                                <label htmlFor="fb-offer" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Facebook /> Facebook</label>
                             </div>
                        )}
                         {businessProfile?.tiktok && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="tt-offer" checked={socials.tiktok} onCheckedChange={(checked) => setSocials(s => ({...s, tiktok: !!checked}))} />
                                <label htmlFor="tt-offer" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><LinkIcon /> TikTok</label>
                             </div>
                        )}
                         {businessProfile?.youtube && (
                             <div className="flex items-center space-x-2">
                                <Checkbox id="yt-offer" checked={socials.youtube} onCheckedChange={(checked) => setSocials(s => ({...s, youtube: !!checked}))} />
                                <label htmlFor="yt-offer" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"><Youtube /> YouTube</label>
                             </div>
                        )}
                     </div>
                </div>
            </>
        )}

        <DialogFooter>
          {!isGenerated ? (
            <Button onClick={handleGenerateOffers} disabled={isLoading || !dateRange?.from || !offerMessage || clients.length === 0}>
              <Gift className="mr-2 h-4 w-4" />
              {isLoading ? 'Generando...' : `Generar para ${clients.length} clientes`}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
    const whatsappLink = `https://wa.me/${offer.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(offer.message)}`;
    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="font-semibold text-primary flex items-center gap-2"><Smartphone className="w-4 h-4"/>{offer.clientName}</div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                        <Send className="mr-2 h-4 w-4" /> Enviar
                    </Button>
                </a>
            </div>
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground italic">"{offer.message}"</p>
        </div>
    );
}
