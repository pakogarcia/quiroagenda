'use client';

import * as React from 'react';
import { format, addDays, isSameDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { 
  Clock, 
  CalendarDays, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  CalendarCheck,
  MessageCircle
} from 'lucide-react';

export interface ServiceTier {
  durationMinutes: number;
  durationLabel: string;
  price: number;
  priceLabel: string;
}

export interface ServiceModalInfo {
  id: string;
  title: string;
  durationMinutes: number;
  durationLabel: string;
  price: number;
  priceLabel: string;
  availableTiers?: ServiceTier[];
}

interface DirectBookingModalProps {
  service: ServiceModalInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DirectBookingModal({ service, isOpen, onClose }: DirectBookingModalProps) {
  const [step, setStep] = React.useState<'schedule' | 'client' | 'confirmed'>('schedule');
  const [selectedTier, setSelectedTier] = React.useState<ServiceTier | null>(null);

  // Synchronize tier with service when opened
  React.useEffect(() => {
    if (service) {
      if (service.availableTiers && service.availableTiers.length > 0) {
        const match = service.availableTiers.find(t => t.durationMinutes === service.durationMinutes) || service.availableTiers[0];
        setSelectedTier(match);
      } else {
        setSelectedTier({
          durationMinutes: service.durationMinutes,
          durationLabel: service.durationLabel,
          price: service.price,
          priceLabel: service.priceLabel
        });
      }
    }
  }, [service]);

  const activeDurationMinutes = selectedTier ? selectedTier.durationMinutes : (service?.durationMinutes || 60);
  const activeDurationLabel = selectedTier ? selectedTier.durationLabel : (service?.durationLabel || '');
  const activePrice = selectedTier ? selectedTier.price : (service?.price || 0);
  const activePriceLabel = selectedTier ? selectedTier.priceLabel : (service?.priceLabel || '');
  
  // Date and Slot Selection
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => addDays(new Date(), 1));
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [slotsError, setSlotsError] = React.useState<string | null>(null);

  // Client Details
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('+34 ');
  const [clientEmail, setClientEmail] = React.useState('');
  const [clientNotes, setClientNotes] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Confirmed Appointment Info
  const [confirmedData, setConfirmedData] = React.useState<any>(null);

  // Reset state when opening with a new service
  React.useEffect(() => {
    if (isOpen) {
      setStep('schedule');
      setSelectedDate(addDays(new Date(), 1));
      setSelectedSlot(null);
      setFormError(null);
      setConfirmedData(null);
    }
  }, [isOpen, service]);

  // Fetch available slots from backend whenever date, service, or active duration changes
  React.useEffect(() => {
    if (!isOpen || !selectedDate || !service) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSlotsError(null);
      setSelectedSlot(null);

      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await fetch(`/api/availability?date=${dateStr}&duration=${activeDurationMinutes}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'No se pudieron consultar los horarios.');
        }

        setAvailableSlots(data.availableSlots || []);
      } catch (err: any) {
        console.error('Error cargando franjas horarias:', err);
        setSlotsError(err.message || 'Error de conexión.');
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isOpen, selectedDate, service, activeDurationMinutes]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientName.trim() || clientName.trim().length < 2) {
      setFormError('Por favor introduce tu nombre y apellidos.');
      return;
    }

    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setFormError('Por favor introduce un número de teléfono válido.');
      return;
    }

    if (!selectedDate || !selectedSlot || !service) {
      setFormError('Falta seleccionar fecha y hora de la cita.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        serviceId: service.id,
        serviceTitle: service.title,
        durationMinutes: activeDurationMinutes,
        price: activePrice,
        dateStr: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlot,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        notes: clientNotes.trim(),
      };

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo registrar la reserva.');
      }

      setConfirmedData({
        ...payload,
        appointmentId: data.appointment?.id,
      });
      setStep('confirmed');
    } catch (err: any) {
      console.error('Error al reservar cita:', err);
      setFormError(err.message || 'Ocurrió un error al confirmar. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-[96vw] max-h-[92vh] overflow-y-auto p-0 rounded-2xl border-primary/20">
        
        {/* Cabecera Cálida de Bienestar */}
        <DialogHeader className="p-5 bg-gradient-to-r from-amber-900 to-rose-950 text-white flex flex-col gap-1">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Reserva Inmediata en Tiempo Real</span>
          </div>
          <DialogTitle className="text-xl md:text-2xl font-bold font-headline text-white">
            {service.title}
          </DialogTitle>
          <DialogDescription className="text-amber-100/90 text-sm flex items-center gap-3 font-medium">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-amber-300" />{activeDurationLabel}</span>
            <span>•</span>
            <span className="text-amber-200 font-bold text-base">{activePriceLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-6 bg-background">
          
          {/* PASO 1: SELECCIONAR DURACIÓN, FECHA Y HORA */}
          {step === 'schedule' && (
            <div className="space-y-6">

              {/* Selector de opciones de duración si tiene múltiples tarifas */}
              {service.availableTiers && service.availableTiers.length > 1 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Selecciona la duración de tu sesión:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {service.availableTiers.map((tier, idx) => {
                      const isSelected = activeDurationMinutes === tier.durationMinutes;
                      return (
                        <Button
                          key={idx}
                          type="button"
                          size="sm"
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => {
                            setSelectedTier(tier);
                            setSelectedSlot(null);
                          }}
                          className={`transition-all ${
                            isSelected 
                              ? 'bg-amber-800 hover:bg-amber-900 text-white shadow-sm ring-2 ring-amber-600/30 font-bold' 
                              : 'border-amber-300/60 hover:bg-amber-100/50 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {tier.durationLabel} · {tier.priceLabel}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  1. Selecciona el Día
                </Label>
                <div className="flex justify-center border rounded-xl p-2 bg-card shadow-sm">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    disabled={(d) => isBefore(d, addDays(new Date(), -1))}
                    locale={es}
                    initialFocus
                    className="rounded-md"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  2. Horas Disponibles para {selectedDate ? format(selectedDate, 'EEEE, d \'de\' MMMM', { locale: es }) : ''} ({activeDurationLabel})
                </Label>

                {isLoadingSlots ? (
                  <div className="flex items-center justify-center p-8 text-muted-foreground gap-2 border rounded-xl bg-muted/20">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Calculando huecos libres en tiempo real...</span>
                  </div>
                ) : slotsError ? (
                  <div className="p-4 border border-destructive/20 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{slotsError}</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-6 border border-dashed rounded-xl bg-muted/20 text-center text-muted-foreground text-sm">
                    No quedan franjas libres para este día con la duración de este servicio ({activeDurationLabel}). Prueba seleccionando otro día en el calendario.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={selectedSlot === slot ? 'default' : 'outline'}
                        className={`h-11 font-bold text-sm transition-all ${
                          selectedSlot === slot 
                            ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                            : 'hover:border-primary/40'
                        }`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button 
                  type="button" 
                  className="w-full h-12 text-base font-bold shadow-lg"
                  disabled={!selectedDate || !selectedSlot}
                  onClick={() => setStep('client')}
                >
                  Continuar con mis Datos ({selectedSlot ? `${selectedSlot} h` : 'Elige una hora'})
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2: FORMULARIO DE DATOS DEL CLIENTE */}
          {step === 'client' && (
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('schedule')}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cambiar día u hora ({selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''} a las {selectedSlot})
              </button>

              <div className="space-y-2">
                <Label htmlFor="cName" className="flex items-center gap-1.5 text-sm font-bold">
                  <User className="w-4 h-4 text-primary" />
                  Nombre y Apellidos *
                </Label>
                <Input
                  id="cName"
                  placeholder="Ej. María Carmen García"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  autoFocus
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cPhone" className="flex items-center gap-1.5 text-sm font-bold">
                  <Phone className="w-4 h-4 text-primary" />
                  Teléfono Móvil (WhatsApp) *
                </Label>
                <Input
                  id="cPhone"
                  placeholder="+34 600 000 000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-[11px] text-muted-foreground">Te enviaremos la confirmación y recordatorio a este número.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cEmail" className="flex items-center gap-1.5 text-sm font-bold">
                  <Mail className="w-4 h-4 text-primary" />
                  Correo Electrónico (Opcional)
                </Label>
                <Input
                  id="cEmail"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cNotes" className="text-sm font-bold">
                  Notas sobre tu dolencia o preferencia (Opcional)
                </Label>
                <Textarea
                  id="cNotes"
                  placeholder="Ej. Fuerte sobrecarga lumbar, molestia en el cuello o espalda..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {formError && (
                <div className="p-3 border border-destructive/20 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xl"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirmando reserva...
                    </span>
                  ) : (
                    `Confirmar Reserva · ${activePriceLabel}`
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* PASO 3: CONFIRMACIÓN EXITOSA */}
          {step === 'confirmed' && confirmedData && (
            <div className="text-center space-y-5 py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold font-headline text-foreground">¡Cita Confirmada!</h3>
                <p className="text-sm text-muted-foreground">Tu sesión ha quedado reservada en tiempo real en la agenda de Pako García.</p>
              </div>

              <div className="bg-muted/40 border rounded-xl p-4 text-left space-y-2 text-sm shadow-sm">
                <p className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">Servicio:</span>
                  <span className="font-bold text-foreground">{service.title} ({activeDurationLabel})</span>
                </p>
                <p className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">Fecha y Hora:</span>
                  <span className="font-bold text-primary">
                    {format(selectedDate!, "EEEE, d 'de' MMMM", { locale: es })} a las {confirmedData.timeSlot} h
                  </span>
                </p>
                <p className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">Paciente:</span>
                  <span className="font-bold text-foreground">{confirmedData.clientName}</span>
                </p>
                <p className="flex justify-between pt-1">
                  <span className="text-muted-foreground font-medium">Importe:</span>
                  <span className="font-bold text-foreground">{activePriceLabel} (pago en consulta)</span>
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={`https://wa.me/34634432487?text=${encodeURIComponent(
                    `Hola Pako, acabo de reservar cita para ${service.title} (${activeDurationLabel}) el ${format(selectedDate!, "d 'de' MMMM", { locale: es })} a las ${confirmedData.timeSlot}h a nombre de ${confirmedData.clientName}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  Avisar por WhatsApp
                </a>

                <Button variant="outline" onClick={onClose} className="h-11 font-medium">
                  Cerrar y volver al Catálogo
                </Button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
