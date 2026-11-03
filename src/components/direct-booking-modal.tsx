'use client';

import * as React from 'react';
import { format, addDays, isBefore } from 'date-fns';
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
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  MessageCircle,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Ticket
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
  const [step, setStep] = React.useState<'schedule' | 'client_choice' | 'client_existing' | 'client_new' | 'confirmed'>('schedule');
  const [selectedTier, setSelectedTier] = React.useState<ServiceTier | null>(null);

  // Default duration of 60 minutes for any massage with multiple tiers
  React.useEffect(() => {
    if (service) {
      if (service.availableTiers && service.availableTiers.length > 0) {
        const tier60 = service.availableTiers.find(t => t.durationMinutes === 60);
        // If an explicit duration was requested and it's not 60, respect it; otherwise default to 60 min
        const match = service.durationMinutes && service.durationMinutes !== 60
          ? (service.availableTiers.find(t => t.durationMinutes === service.durationMinutes) || tier60 || service.availableTiers[0])
          : (tier60 || service.availableTiers[0]);
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
  const [unavailableDates, setUnavailableDates] = React.useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [slotsError, setSlotsError] = React.useState<string | null>(null);

  // Client Details
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('+34 ');
  const [clientNotes, setClientNotes] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Existing Client Lookup State
  const [lookupPhone, setLookupPhone] = React.useState('+34 ');
  const [isLookingUp, setIsLookingUp] = React.useState(false);
  const [existingClientData, setExistingClientData] = React.useState<any>(null);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const [clientPin, setClientPin] = React.useState('');

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
      setLookupError(null);
      setExistingClientData(null);
      setClientPin('');

      // Check if user has an existing session in localStorage
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('quiro_client_session') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.client?.phone) {
            const clientObj = parsed.client;
            const fullName = `${clientObj.name || ''} ${clientObj.lastName || ''}`.trim() || clientObj.name;
            setLookupPhone(clientObj.phone);
            setClientPhone(clientObj.phone);
            setClientName(fullName);
            setExistingClientData({
              found: true,
              clientName: clientObj.name,
              lastName: clientObj.lastName || '',
              fullName: fullName,
              voucher: clientObj.voucher || null,
              hasPin: false,
            });
          }
        }
      } catch (e) {
        // Ignore localStorage error
      }
    }
  }, [isOpen, service]);

  // Check if a calendar day is unavailable
  const isDayUnavailable = React.useCallback((date: Date) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const dStr = format(date, 'yyyy-MM-dd');
    if (dStr < todayStr) return true;
    return unavailableDates.includes(dStr);
  }, [unavailableDates]);

  // If selectedDate becomes unavailable when dates load, advance to first available date
  React.useEffect(() => {
    if (unavailableDates.length > 0 && selectedDate) {
      const currentStr = format(selectedDate, 'yyyy-MM-dd');
      if (unavailableDates.includes(currentStr)) {
        const today = new Date();
        for (let i = 0; i <= 60; i++) {
          const candidate = addDays(today, i);
          const candStr = format(candidate, 'yyyy-MM-dd');
          if (!unavailableDates.includes(candStr)) {
            setSelectedDate(candidate);
            break;
          }
        }
      }
    }
  }, [unavailableDates]);

  // Fetch available slots & unavailable dates from backend whenever date or duration changes
  React.useEffect(() => {
    if (!isOpen || !selectedDate || !service) return;

    const fetchAvailability = async () => {
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
        if (data.unavailableDates) {
          setUnavailableDates(data.unavailableDates);
        }
      } catch (err: any) {
        console.error('Error cargando franjas horarias:', err);
        setSlotsError(err.message || 'Error de conexión.');
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [isOpen, selectedDate, service, activeDurationMinutes]);

  // Handle Lookup for Existing Client
  const handleLookupExistingClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);

    const clean = lookupPhone.replace(/\D/g, '');
    if (clean.length < 9) {
      setLookupError('Por favor introduce tu número de teléfono móvil completo (al menos 9 dígitos).');
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await fetch('/api/client-portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lookup', phone: lookupPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al buscar tu ficha.');
      }

      if (!data.found) {
        setLookupError('No encontramos ninguna ficha con este teléfono. Si es tu primera vez, pulsa en "Soy Cliente Nuevo" para darte de alta.');
        setExistingClientData(null);
        return;
      }

      setExistingClientData(data);
      setClientName(data.fullName || data.clientName);
      setClientPhone(lookupPhone);
    } catch (err: any) {
      console.error('Error en búsqueda de cliente:', err);
      setLookupError(err.message || 'Error de conexión.');
      setExistingClientData(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Submit Booking
  const handleConfirmBooking = async (e: React.FormEvent, isExisting: boolean = false) => {
    e.preventDefault();
    setFormError(null);

    const nameToUse = isExisting && existingClientData 
      ? (existingClientData.fullName || existingClientData.clientName) 
      : clientName;

    const phoneToUse = isExisting ? lookupPhone : clientPhone;

    if (!nameToUse || nameToUse.trim().length < 2) {
      setFormError('Por favor introduce tu nombre y apellidos.');
      return;
    }

    const cleanPhone = phoneToUse.replace(/\D/g, '');
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
        clientName: nameToUse.trim(),
        clientPhone: phoneToUse.trim(),
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

              {/* Badge si el usuario ya inició sesión previamente en su Área de Clientes */}
              {existingClientData && (
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sesión activa: <strong>{existingClientData.fullName || existingClientData.clientName}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setExistingClientData(null);
                      setLookupPhone('+34 ');
                      setClientPhone('+34 ');
                      setClientName('');
                    }}
                    className="text-xs text-emerald-700 dark:text-emerald-300 underline hover:no-underline font-medium"
                  >
                    Cambiar cuenta
                  </button>
                </div>
              )}

              {/* Selector de opciones de duración si tiene múltiples tarifas (por defecto 60 min) */}
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

              {/* Calendario con días cerrados o sin disponibilidad tachados visualmente */}
              <div>
                <Label className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  1. Selecciona el Día
                </Label>
                <div className="border rounded-xl p-3 bg-card shadow-sm space-y-2">
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        if (d && !isDayUnavailable(d)) {
                          setSelectedDate(d);
                        }
                      }}
                      disabled={isDayUnavailable}
                      modifiers={{
                        unavailable: isDayUnavailable,
                      }}
                      modifiersClassNames={{
                        unavailable: '!line-through text-slate-400 opacity-30 cursor-not-allowed pointer-events-none select-none bg-slate-100/40 dark:bg-slate-900/40',
                      }}
                      locale={es}
                      initialFocus
                      classNames={{
                        day_disabled: '!line-through text-slate-400 opacity-30 cursor-not-allowed pointer-events-none select-none bg-slate-100/40 dark:bg-slate-900/40',
                      }}
                      className="rounded-md"
                    />
                  </div>

                  {/* Leyenda visual intuitiva para saber qué días están libres o cerrados a simple vista */}
                  <div className="flex items-center justify-center gap-5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-muted-foreground select-none">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
                      Días con citas libres
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-400">
                      <span className="line-through font-bold text-slate-400">15</span>
                      Días completos o no disponibles
                    </span>
                  </div>
                </div>
              </div>

              {/* Horas disponibles para el día seleccionado */}
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
                    No quedan franjas libres para este día con la duración de este servicio ({activeDurationLabel}). Elige otro día disponible en el calendario.
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
                  className={`w-full h-12 text-base font-bold shadow-lg transition-all ${
                    existingClientData
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white'
                      : ''
                  }`}
                  disabled={!selectedDate || !selectedSlot}
                  onClick={() => {
                    if (existingClientData) {
                      setStep('client_existing');
                    } else {
                      setStep('client_choice');
                    }
                  }}
                >
                  {existingClientData
                    ? `Confirmar Cita para ${existingClientData.fullName || existingClientData.clientName} (${selectedSlot ? `${selectedSlot} h` : 'Elige hora'})`
                    : `Continuar con la Reserva (${selectedSlot ? `${selectedSlot} h` : 'Elige una hora'})`
                  }
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2: SELECCIÓN DE CLIENTE (NUEVO O HABITUAL) */}
          {step === 'client_choice' && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setStep('schedule')}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cambiar día u hora ({selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''} a las {selectedSlot} h)
              </button>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold font-headline text-foreground">¿Ya eres cliente de QuiroAgenda?</h3>
                <p className="text-sm text-muted-foreground">
                  Elige tu opción para agilizar tu reserva de {service.title} ({selectedSlot} h):
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* OPCIÓN A: CLIENTE HABITUAL */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('client_existing');
                    setLookupError(null);
                  }}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-600 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all text-center group cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-base text-foreground mb-1">Soy Cliente Habitual</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ya tengo ficha o he venido antes. Accede con tu teléfono para reservar en 1 clic y usar tus bonos.
                  </p>
                  <span className="mt-4 text-xs font-bold text-emerald-700 dark:text-emerald-300 group-hover:underline flex items-center gap-1">
                    Acceder a mi ficha →
                  </span>
                </button>

                {/* OPCIÓN B: CLIENTE NUEVO */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('client_new');
                    setFormError(null);
                  }}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-amber-600/30 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-600 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-all text-center group cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-600/10 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-base text-foreground mb-1">Soy Cliente Nuevo</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Es mi primera cita en el gabinete. Solo te pediremos tu nombre y teléfono móvil.
                  </p>
                  <span className="mt-4 text-xs font-bold text-amber-800 dark:text-amber-300 group-hover:underline flex items-center gap-1">
                    Pedir mi primera cita →
                  </span>
                </button>

              </div>
            </div>
          )}

          {/* PASO 3A: CLIENTE HABITUAL / ACCESO CON FICHA EXISTENTE */}
          {step === 'client_existing' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-muted">
                <button
                  type="button"
                  onClick={() => setStep('schedule')}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cambiar día u hora ({selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''} a las {selectedSlot} h)
                </button>
                <button
                  type="button"
                  onClick={() => setStep('client_choice')}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Elegir si soy cliente nuevo
                </button>
              </div>

              {!existingClientData ? (
                /* Formulario de búsqueda rápida por teléfono */
                <form onSubmit={handleLookupExistingClient} className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-headline text-foreground flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                      Acceso Cliente Habitual
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Introduce el teléfono móvil registrado en tu ficha para cargar tus datos automáticamente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lookupPhone" className="text-sm font-bold flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-primary" />
                      Teléfono Móvil *
                    </Label>
                    <Input
                      id="lookupPhone"
                      placeholder="+34 600 000 000"
                      value={lookupPhone}
                      onChange={(e) => setLookupPhone(e.target.value)}
                      required
                      autoFocus
                      className="h-11"
                    />
                  </div>

                  {lookupError && (
                    <div className="p-3 border border-amber-500/30 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{lookupError}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setClientPhone(lookupPhone);
                          setStep('client_new');
                        }}
                        className="self-start text-xs border-amber-600/40 hover:bg-amber-100"
                      >
                        Continuar como Cliente Nuevo →
                      </Button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLookingUp}
                    className="w-full h-11 font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md"
                  >
                    {isLookingUp ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Buscando tu ficha...
                      </span>
                    ) : (
                      'Localizar mi Ficha'
                    )}
                  </Button>
                </form>
              ) : (
                /* Ficha localizada: Confirmación en 1 Clic */
                <form onSubmit={(e) => handleConfirmBooking(e, true)} className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-base">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>¡Hola, {existingClientData.fullName || existingClientData.clientName}!</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExistingClientData(null)}
                        className="text-xs text-emerald-700 hover:underline font-semibold"
                      >
                        Cambiar teléfono
                      </button>
                    </div>
                    <p className="text-xs text-emerald-700/90 dark:text-emerald-300/80">
                      Hemos identificado tu ficha con el teléfono {lookupPhone}.
                    </p>

                    {/* Bono activo si dispone de sesiones */}
                    {existingClientData.voucher && existingClientData.voucher.remainingSessions > 0 && (
                      <div className="mt-2 p-2.5 bg-amber-100/80 dark:bg-amber-900/40 border border-amber-300 rounded-lg flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <Ticket className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          Tienes un Bono Activo ({existingClientData.voucher.remainingSessions} sesiones disponibles de {existingClientData.voucher.serviceName}).
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Resumen visible de la cita con botón para cambiar cualquier aspecto */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        Detalles de la cita a confirmar:
                      </span>
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: es }) : ''} a las {selectedSlot} h
                        </span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{service.title} ({activeDurationLabel}) · {activePriceLabel}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStep('schedule')}
                      className="h-8 text-xs font-bold border-amber-600/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 shrink-0"
                    >
                      Cambiar Cita
                    </Button>
                  </div>

                  {/* Notas opcionales */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cNotesExisting" className="text-sm font-bold">
                      Notas sobre tu dolencia o preferencia para esta cita (Opcional)
                    </Label>
                    <Textarea
                      id="cNotesExisting"
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

                  <div className="pt-2 flex flex-col gap-2">
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
                        `Confirmar Reserva en 1 Clic · ${activePriceLabel}`
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setStep('schedule')}
                      className="text-xs text-center text-muted-foreground hover:underline py-1"
                    >
                      ← ¿Quieres elegir otro día, hora o duración? Pulsa aquí
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* PASO 3B: FORMULARIO CLIENTE NUEVO (SIN CORREO) */}
          {step === 'client_new' && (
            <form onSubmit={(e) => handleConfirmBooking(e, false)} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-muted">
                <button
                  type="button"
                  onClick={() => setStep('schedule')}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cambiar día u hora ({selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''} a las {selectedSlot} h)
                </button>
                <button
                  type="button"
                  onClick={() => setStep('client_choice')}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Elegir si ya soy cliente
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold font-headline text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-700" />
                  Datos para tu Primera Cita
                </h3>
                <p className="text-xs text-muted-foreground">
                  Solo necesitamos tu nombre y tu teléfono móvil para agendar tu sesión.
                </p>
              </div>

              {/* Resumen visible de la cita con botón para cambiar cualquier aspecto */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Detalles de la cita a confirmar:
                  </span>
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: es }) : ''} a las {selectedSlot} h
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{service.title} ({activeDurationLabel}) · {activePriceLabel}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('schedule')}
                  className="h-8 text-xs font-bold border-amber-600/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 shrink-0"
                >
                  Cambiar Cita
                </Button>
              </div>

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

              <div className="pt-2 flex flex-col gap-2">
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
                <button
                  type="button"
                  onClick={() => setStep('schedule')}
                  className="text-xs text-center text-muted-foreground hover:underline py-1"
                >
                  ← ¿Quieres elegir otro día, hora o duración? Pulsa aquí
                </button>
              </div>
            </form>
          )}

          {/* PASO 4: CONFIRMACIÓN EXITOSA */}
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
