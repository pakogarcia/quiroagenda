'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, parseISO, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Lock, 
  Phone, 
  Sparkles, 
  Gift, 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  LogOut, 
  MessageCircle,
  CalendarCheck,
  History,
  ShieldCheck,
  ChevronRight,
  CalendarX,
  CalendarClock
} from 'lucide-react';
import type { Client, Appointment, BusinessProfile } from '@/lib/types';

const CLIENT_SESSION_KEY = 'quiroagenda_client_portal_session';

export default function ClientPortalPage() {
  const [phoneInput, setPhoneInput] = React.useState('');
  const [lookupState, setLookupState] = React.useState<'initial' | 'lookup_loading' | 'needs_pin' | 'enter_pin'>('initial');
  const [clientGreetingName, setClientGreetingName] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // PIN inputs
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [isSubmittingPin, setIsSubmittingPin] = React.useState(false);
  const [sessionPin, setSessionPin] = React.useState<string>('');

  // Logged-in client state
  const [sessionClient, setSessionClient] = React.useState<Client | null>(null);
  const [sessionToken, setSessionToken] = React.useState<string | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = React.useState<Appointment[]>([]);
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Business profile state
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);

  const { toast } = useToast();

  // Cancel modal state
  const [cancellingAppointment, setCancellingAppointment] = React.useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = React.useState(false);

  // Reschedule modal state
  const [reschedulingAppointment, setReschedulingAppointment] = React.useState<Appointment | null>(null);
  const [newSelectedDate, setNewSelectedDate] = React.useState<Date | undefined>(() => addDays(new Date(), 1));
  const [newAvailableSlots, setNewAvailableSlots] = React.useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [selectedNewSlot, setSelectedNewSlot] = React.useState<string | null>(null);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = React.useState(false);

  // Cargar perfil del negocio de localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('quiroagenda_profile');
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch {
      // Ignorar
    }
  }, []);

  // Cargar disponibilidad cuando se abre la reprogramación o cambia la fecha seleccionada
  React.useEffect(() => {
    if (!reschedulingAppointment || !newSelectedDate) return;
    const dateStr = format(newSelectedDate, 'yyyy-MM-dd');
    const duration = reschedulingAppointment.duration || 60;
    setIsLoadingSlots(true);
    setSelectedNewSlot(null);

    fetch(`/api/availability?date=${dateStr}&duration=${duration}`)
      .then((r) => r.json())
      .then((data) => {
        setNewAvailableSlots(data.availableSlots || []);
      })
      .catch((err) => {
        console.error('Error cargando disponibilidad:', err);
        setNewAvailableSlots([]);
      })
      .finally(() => {
        setIsLoadingSlots(false);
      });
  }, [reschedulingAppointment, newSelectedDate]);

  const getActiveToken = React.useCallback((): string | null => {
    if (sessionToken) return sessionToken;
    try {
      const s = localStorage.getItem(CLIENT_SESSION_KEY);
      return s ? JSON.parse(s).token : null;
    } catch {
      return null;
    }
  }, [sessionToken]);

  const handleConfirmCancel = async () => {
    if (!cancellingAppointment || !sessionClient) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch('/api/client-portal/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          phone: sessionClient.phone,
          clientId: sessionClient.id,
          appointmentId: cancellingAppointment.id,
          token: getActiveToken(),
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cancelar la cita.');
      }

      toast({
        title: 'Cita Cancelada',
        description: 'Tu cita ha sido cancelada y el hueco ha quedado liberado en la agenda.',
      });

      const updated = upcomingAppointments.filter((a) => a.id !== cancellingAppointment.id);
      setUpcomingAppointments(updated);

      try {
        const saved = localStorage.getItem(CLIENT_SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.upcomingAppointments = updated;
          localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}

      setCancellingAppointment(null);
      setCancelReason('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'No se pudo cancelar',
        description: err.message || 'Error al cancelar la cita.',
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingAppointment || !sessionClient || !newSelectedDate || !selectedNewSlot) {
      toast({
        variant: 'destructive',
        title: 'Selecciona una hora',
        description: 'Debes elegir uno de los turnos horarios disponibles.',
      });
      return;
    }

    setIsSubmittingReschedule(true);
    try {
      const newDateStr = format(newSelectedDate, 'yyyy-MM-dd');
      const res = await fetch('/api/client-portal/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          phone: sessionClient.phone,
          clientId: sessionClient.id,
          appointmentId: reschedulingAppointment.id,
          token: getActiveToken(),
          newDate: newDateStr,
          newTime: selectedNewSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo reprogramar la cita.');
      }

      toast({
        title: '¡Cita Cambiada con Éxito!',
        description: `Tu cita ha sido reprogramada para el ${format(newSelectedDate, "EEEE, d 'de' MMMM", { locale: es })} a las ${selectedNewSlot} h.`,
      });

      const updated = upcomingAppointments.map((a) => (a.id === reschedulingAppointment.id ? data.appointment : a));
      setUpcomingAppointments(updated);

      try {
        const saved = localStorage.getItem(CLIENT_SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.upcomingAppointments = updated;
          localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}

      setReschedulingAppointment(null);
      setSelectedNewSlot(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'No se pudo cambiar la cita',
        description: err.message || 'Error al reprogramar la cita.',
      });
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Restore session from localStorage if present
  React.useEffect(() => {
    let activePhone = '';
    let activeToken = '';
    try {
      const saved = localStorage.getItem(CLIENT_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.client && parsed.phone) {
          setSessionClient(parsed.client);
          setUpcomingAppointments(parsed.upcomingAppointments || []);
          setPastAppointments(parsed.pastAppointments || []);
          setPhoneInput(parsed.phone);
          if (parsed.pin) {
            setSessionPin(parsed.pin);
          }
          if (parsed.token) {
            setSessionToken(parsed.token);
            activeToken = parsed.token;
          }
          activePhone = parsed.phone;
        }
      }
    } catch (e) {
      console.error('Error restaurando sesión de cliente:', e);
    } finally {
      setIsInitializing(false);
    }

    if (activePhone && activeToken) {
      refreshAppointments(activePhone, activeToken);
    }

    const handleWindowFocus = () => {
      const saved = localStorage.getItem(CLIENT_SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.phone && parsed.token) {
            refreshAppointments(parsed.phone, parsed.token);
          }
        } catch (e) {}
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  const refreshAppointments = React.useCallback(async (phone: string, tokenParam?: string) => {
    try {
      const currentToken = tokenParam || getActiveToken();
      if (!currentToken) return;

      const res = await fetch('/api/client-portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh', phone, token: currentToken }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pinReset) {
          localStorage.removeItem(CLIENT_SESSION_KEY);
          localStorage.removeItem('quiro_client_session');
          setSessionClient(null);
          setSessionToken(null);
          setSessionPin('');
          setLookupState('needs_pin');
          setErrorMessage('Tu PIN ha sido restablecido por el administrador. Elige un nuevo PIN de 4 dígitos para entrar.');
          return;
        }
        if (data.success) {
          setUpcomingAppointments(data.upcomingAppointments || []);
          setPastAppointments(data.pastAppointments || []);
          if (data.client) {
            setSessionClient(data.client);
          }
          const saved = localStorage.getItem(CLIENT_SESSION_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify({
                ...parsed,
                client: data.client || parsed.client,
                upcomingAppointments: data.upcomingAppointments || [],
                pastAppointments: data.pastAppointments || [],
              }));
            } catch (err) {}
          }
        }
      } else if (res.status === 401) {
        localStorage.removeItem(CLIENT_SESSION_KEY);
        localStorage.removeItem('quiro_client_session');
        setSessionClient(null);
        setSessionToken(null);
        setSessionPin('');
        setLookupState('enter_pin');
        setErrorMessage('Tu sesión ha expirado por seguridad. Introduce tu PIN para continuar.');
      }
    } catch (e) {
      console.warn('Error refrescando citas en área de clientes:', e);
    }
  }, [getActiveToken]);

  // Step 1: Lookup phone
  const handleLookupPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 9) {
      setErrorMessage('Por favor introduce un número de teléfono válido (al menos 9 dígitos).');
      return;
    }

    setLookupState('lookup_loading');
    try {
      const res = await fetch('/api/client-portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lookup', phone: phoneInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al comprobar el teléfono.');
      }

      if (!data.found) {
        setLookupState('initial');
        setErrorMessage(data.message || 'No encontramos ninguna ficha con este teléfono. Si aún no eres paciente, puedes pedir tu primera cita en el catálogo.');
        return;
      }

      setClientGreetingName(data.clientName || 'Paciente');
      if (data.hasPin) {
        setLookupState('enter_pin');
      } else {
        setLookupState('needs_pin');
      }
    } catch (err: any) {
      setLookupState('initial');
      setErrorMessage(err.message || 'Error de conexión.');
    }
  };

  // Step 2A: Set new 4-digit PIN (first time)
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!/^\d{4}$/.test(pin.trim())) {
      setErrorMessage('El PIN debe tener exactamente 4 números (ej. 1234).');
      return;
    }

    if (pin.trim() !== confirmPin.trim()) {
      setErrorMessage('Los dos PINs introducidos no coinciden. Por favor revísalos.');
      return;
    }

    setIsSubmittingPin(true);
    try {
      const res = await fetch('/api/client-portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_pin',
          phone: phoneInput,
          pin: pin.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo configurar el PIN.');
      }

      // Success: Save session
      if (data.token) {
        setSessionToken(data.token);
      }
      setSessionPin(pin.trim());
      const newSession = {
        phone: phoneInput,
        client: data.client,
        upcomingAppointments: data.upcomingAppointments || [],
        pastAppointments: data.pastAppointments || [],
        token: data.token,
        pin: pin.trim(),
      };
      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(newSession));
      localStorage.setItem('quiro_client_session', JSON.stringify(newSession));
      setSessionClient(data.client);
      setUpcomingAppointments(data.upcomingAppointments || []);
      setPastAppointments(data.pastAppointments || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el PIN.');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  // Step 2B: Login with existing 4-digit PIN
  const handleLoginPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!/^\d{4}$/.test(pin.trim())) {
      setErrorMessage('El PIN debe tener 4 números.');
      return;
    }

    setIsSubmittingPin(true);
    try {
      const res = await fetch('/api/client-portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          phone: phoneInput,
          pin: pin.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'PIN incorrecto.');
      }

      // Success: Save session
      if (data.token) {
        setSessionToken(data.token);
      }
      setSessionPin(pin.trim());
      const newSession = {
        phone: phoneInput,
        client: data.client,
        upcomingAppointments: data.upcomingAppointments || [],
        pastAppointments: data.pastAppointments || [],
        token: data.token,
        pin: pin.trim(),
      };
      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(newSession));
      localStorage.setItem('quiro_client_session', JSON.stringify(newSession));
      setSessionClient(data.client);
      setUpcomingAppointments(data.upcomingAppointments || []);
      setPastAppointments(data.pastAppointments || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al validar el PIN.');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem(CLIENT_SESSION_KEY);
    localStorage.removeItem('quiro_client_session');
    setSessionClient(null);
    setSessionToken(null);
    setSessionPin('');
    setLookupState('initial');
    setPhoneInput('');
    setPin('');
    setConfirmPin('');
    setErrorMessage(null);
  };

  // Safe date formatting helper to prevent any unhandled crashes
  const safeFormatDate = (dateVal: any, formatPattern: string): string => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return format(d, formatPattern, { locale: es });
    } catch (e) {
      console.warn('Error formateando fecha:', e);
      return '';
    }
  };

  // Helper for Google Calendar Link
  const makeGoogleCalendarUrl = (apt: Appointment) => {
    try {
      const aptDate = new Date(apt.dateTime);
      if (isNaN(aptDate.getTime())) return '#';
      const startStr = aptDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const duration = apt.duration || 60;
      const endDate = new Date(aptDate.getTime() + duration * 60 * 1000);
      const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const businessName = profile?.name || 'Gabinete ZenVital';
      const title = encodeURIComponent(`Cita Masaje: ${apt.serviceName || businessName}`);
      const details = encodeURIComponent(`Cita en ${businessName}.\nTratamiento: ${apt.serviceName || 'Masaje'}\nDuración: ${duration} min`);
      const location = encodeURIComponent(profile?.address || businessName);
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
    } catch {
      return '#';
    }
  };

  // Format masked phone like "634 ••• 487"
  const formatMaskedPhone = (phone: string): string => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 9) {
      const first3 = clean.slice(0, 3);
      const last3 = clean.slice(-3);
      return `${first3} ••• ${last3}`;
    }
    return phone;
  };

  const cabinetName = profile?.name || 'Gabinete ZenVital';
  const webAddress = profile?.website?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 
    (typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'zenvital.quiroagenda.es');
  const noticeHours = profile?.minNoticeHours || 4;

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8faf9] dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-800" />
      </div>
    );
  }

  // Desglosar PIN en 4 dígitos
  const pinDigits = (() => {
    if (sessionPin && sessionPin.length === 4) {
      return sessionPin.split('');
    }
    return ['4', '8', '2', '9']; // Visual representativo idéntico al mockup
  })();

  // Datos del bono
  const voucher = sessionClient?.voucher;
  const hasActiveVoucher = !!(voucher && voucher.sessions > 0);
  const totalSessions = voucher?.totalSessions || 5;
  const remainingSessions = voucher?.sessions ?? 0;
  const usedSessions = Math.max(0, totalSessions - remainingSessions);

  // Texto de Tarifa Fiel con estrella
  const loyaltyFootnote = (() => {
    if (sessionClient?.discount && sessionClient.discount.value > 0) {
      const val = sessionClient.discount.value;
      const unit = sessionClient.discount.type === 'percentage' ? '%' : '€';
      return `★ Tu Tarifa Fiel aplica un ${val}${unit} dto. automático en sesiones sueltas.`;
    }
    return '★ Tu Tarifa Fiel aplica un 15% dto. automático en sesiones sueltas.';
  })();

  const nextAppointment = upcomingAppointments[0] || null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faf9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-body">
      
      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-1 max-w-xl mx-auto px-3 sm:px-5 py-4 sm:py-6 w-full space-y-4">

        {/* 1. ENCABEZADO DEL GABINETE (DISEÑO DARK EMERALD DEL MOCKUP) */}
        <div className="bg-[#0b3b2c] text-white rounded-3xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#10b981]/25 border border-[#10b981]/50 flex items-center justify-center shrink-0 text-white font-black text-sm sm:text-base tracking-wider shadow-2xs">
              {profile?.logo ? (
                <img src={profile.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                'QA'
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white truncate">
                {cabinetName}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/80 truncate font-medium">
                {webAddress}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#14532d] text-emerald-200 border border-emerald-500/40 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Antelación: {noticeHours}h
            </span>
          </div>
        </div>

        {/* 2. VISTA CUANDO EL CLIENTE NO HA INICIADO SESIÓN (LOGIN INTERACTIVO) */}
        {!sessionClient ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Tarjeta de Seguridad Área Privada */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#065f46] dark:text-emerald-400">
                  ÁREA PRIVADA DEL PACIENTE
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#e6f7f2] text-[#046c4e] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#a7f3d0]/60 shadow-2xs">
                  <Lock className="w-3.5 h-3.5" />
                  HMAC SHA-256
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Acceso directo desde navegador móvil sin instalar apps:
              </p>

              {/* PASO 1: INTRODUCIR TELÉFONO */}
              {(lookupState === 'initial' || lookupState === 'lookup_loading') && (
                <form onSubmit={handleLookupPhone} className="space-y-4 pt-1">
                  <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                    <Label htmlFor="cPhone" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      TELÉFONO MÓVIL
                    </Label>
                    <Input
                      id="cPhone"
                      type="tel"
                      placeholder="ej. 634 43 24 87"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      required
                      autoFocus
                      className="h-12 text-lg sm:text-xl font-bold font-mono bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <p className="text-[11px] text-slate-500 pt-0.5">
                      Introduce el móvil con el que reservas o con el que estás dado de alta en el centro.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span className="font-medium">{errorMessage}</span>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={lookupState === 'lookup_loading'}
                    className="w-full h-12 text-sm sm:text-base font-bold bg-[#046c4e] hover:bg-[#03533b] text-white rounded-2xl shadow-sm transition-all"
                  >
                    {lookupState === 'lookup_loading' ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Comprobando ficha segura...
                      </span>
                    ) : (
                      'Continuar con PIN'
                    )}
                  </Button>
                </form>
              )}

              {/* PASO 2A: CREAR PIN DE 4 DÍGITOS (PRIMERA VEZ) */}
              {lookupState === 'needs_pin' && (
                <form onSubmit={handleSetPin} className="space-y-4 animate-in fade-in duration-300 pt-1">
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      ¡Hola, {clientGreetingName}!
                    </p>
                    <p className="leading-relaxed">
                      Para proteger tu privacidad, elige tu PIN personal confidencial de 4 números.
                    </p>
                  </div>

                  {/* 4 Cajas visuales de PIN verde oscuro */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-center">
                      Elige tu PIN de 4 números
                    </Label>
                    <div className="flex items-center justify-center gap-2.5 sm:gap-3 py-1">
                      {[0, 1, 2, 3].map((i) => {
                        const digit = pin[i];
                        return (
                          <div
                            key={i}
                            className={cn(
                              "w-11 h-12 sm:w-12 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black font-mono transition-all",
                              digit !== undefined
                                ? "bg-[#046c4e] text-white shadow-md scale-105"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700"
                            )}
                          >
                            {digit !== undefined ? digit : '•'}
                          </div>
                        );
                      })}
                    </div>
                    <Input
                      type="password"
                      maxLength={4}
                      autoFocus
                      placeholder="4 números"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="h-11 text-center text-lg tracking-[0.4em] font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300"
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-center">
                      Confirma tu PIN
                    </Label>
                    <Input
                      type="password"
                      maxLength={4}
                      placeholder="Repite el PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="h-11 text-center text-lg tracking-[0.4em] font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setLookupState('initial'); setErrorMessage(null); setPin(''); setConfirmPin(''); }}
                      className="w-1/3 h-12 font-medium rounded-2xl"
                    >
                      Atrás
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmittingPin || pin.length !== 4 || confirmPin.length !== 4}
                      className="flex-1 h-12 text-sm font-bold bg-[#046c4e] hover:bg-[#03533b] text-white shadow-sm rounded-2xl"
                    >
                      {isSubmittingPin ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </span>
                      ) : (
                        'Guardar y Entrar'
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* PASO 2B: INTRODUCIR PIN EXISTENTE (CON LAS 4 CAJAS VERDES) */}
              {lookupState === 'enter_pin' && (
                <form onSubmit={handleLoginPin} className="space-y-4 animate-in fade-in duration-300 pt-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300">
                    <p className="font-bold flex items-center gap-1.5 text-sm text-[#046c4e] dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      ¡Hola de nuevo, {clientGreetingName}!
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Introduce tu PIN de 4 números para acceder a tus bonos y citas.
                    </p>
                  </div>

                  {/* 4 Cajas idénticas al mockup */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2.5 sm:gap-3 py-2">
                      {[0, 1, 2, 3].map((i) => {
                        const digit = pin[i];
                        return (
                          <div
                            key={i}
                            className={cn(
                              "w-12 h-14 rounded-2xl flex items-center justify-center text-2xl font-black font-mono transition-all",
                              digit !== undefined
                                ? "bg-[#046c4e] text-white shadow-md scale-105"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700"
                            )}
                          >
                            {digit !== undefined ? digit : '•'}
                          </div>
                        );
                      })}
                    </div>

                    <Input
                      type="password"
                      maxLength={4}
                      autoFocus
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="h-11 text-center text-xl tracking-[0.5em] font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setLookupState('initial'); setErrorMessage(null); setPin(''); }}
                      className="w-1/3 h-12 font-medium rounded-2xl"
                    >
                      Atrás
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmittingPin || pin.length !== 4}
                      className="flex-1 h-12 text-sm sm:text-base font-bold bg-[#046c4e] hover:bg-[#03533b] text-white shadow-sm rounded-2xl"
                    >
                      {isSubmittingPin ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verificando...
                        </span>
                      ) : (
                        'Acceder'
                      )}
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <a
                      href={`https://wa.me/34634432487?text=${encodeURIComponent(
                        `Hola, he olvidado el PIN de mi área de clientes para el número ${phoneInput}. ¿Podrías restablecérmelo por favor?`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-800 dark:text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      ¿Has olvidado tu PIN? Pide a tu terapeuta que te lo reinicie
                    </a>
                  </div>
                </form>
              )}

            </div>
          </div>
        ) : (
          /* 3. VISTA CUANDO EL CLIENTE ESTÁ IDENTIFICADO (DISEÑO MOCKUP COMPLETO) */
          <div className="space-y-4 animate-in fade-in duration-300 pb-12">

            {/* A. TARJETA CREDENCIAL SEGURA: ÁREA PRIVADA DEL PACIENTE */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#065f46] dark:text-emerald-400">
                  ÁREA PRIVADA DEL PACIENTE
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#e6f7f2] text-[#046c4e] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#a7f3d0]/60 shadow-2xs">
                  <Lock className="w-3.5 h-3.5" />
                  HMAC SHA-256
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Acceso directo desde navegador móvil sin instalar apps:
              </p>

              {/* Caja de teléfono y 4 cajas verdes de PIN */}
              <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    TELÉFONO
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-mono tracking-wide">
                    {formatMaskedPhone(sessionClient.phone)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 mr-1">PIN:</span>
                  <div className="flex items-center gap-1.5">
                    {pinDigits.map((digit, i) => (
                      <span
                        key={i}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#046c4e] text-white font-black text-sm sm:text-base flex items-center justify-center shadow-xs"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="ml-2 text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Cerrar sesión segura"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* B. TARJETA BONO FIDELIDAD ACTIVO (DISEÑO VERDE OSCURO DEL MOCKUP) */}
            {hasActiveVoucher ? (
              <div className="bg-[#0b3b2c] text-white rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 select-none">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                    BONO FIDELIDAD ACTIVO
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-[#14532d] text-emerald-100 border border-emerald-500/40 shadow-2xs">
                    Quedan {remainingSessions} / {totalSessions}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Bono {totalSessions} Masajes Terapéuticos
                </h2>

                {/* Píldoras de sesiones: Usadas (verde oscuro) y Libres (blancas) */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Sesiones usadas */}
                  {Array.from({ length: usedSessions }).map((_, idx) => (
                    <span
                      key={`used-${idx}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#14532d] text-emerald-200 border border-emerald-500/40 shadow-2xs"
                    >
                      <span>✓</span>
                      <span>Usada</span>
                    </span>
                  ))}

                  {/* Sesiones libres restantes */}
                  {Array.from({ length: remainingSessions }).map((_, idx) => {
                    const sessionNumber = usedSessions + idx + 1;
                    return (
                      <span
                        key={`free-${idx}`}
                        className="inline-flex items-center px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-white text-slate-900 shadow-xs"
                      >
                        Libre #{sessionNumber}
                      </span>
                    );
                  })}
                </div>

                {/* Mensaje de Tarifa Fiel con estrella */}
                <p className="text-xs sm:text-sm text-emerald-100/90 font-medium pt-1">
                  {loyaltyFootnote}
                </p>
              </div>
            ) : (
              /* Si no tiene bono activo, tarjeta de invitación */
              <div className="bg-[#0b3b2c] text-white rounded-3xl p-5 sm:p-6 shadow-sm space-y-3.5 select-none">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                    BONOS DE MASAJES Y FIDELIDAD
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14532d] text-emerald-100 border border-emerald-500/40">
                    Ahorro hasta 20%
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  ¿Quieres disfrutar de un Bono de Sesiones?
                </h2>

                <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                  Adquiriendo un bono de 5 sesiones obtienes tarifa especial por masaje, total flexibilidad y prioridad de agenda.
                </p>

                <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-emerald-200 font-medium">
                    {loyaltyFootnote}
                  </p>
                  <Button asChild size="sm" className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold rounded-xl shadow-xs">
                    <a
                      href="https://wa.me/34634432487?text=Hola%20Pako,%20quisiera%20informaci%C3%B3n%20para%20adquirir%20un%20bono%20de%20masajes"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                      Consultar Bonos
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* C. TARJETA PRÓXIMA CITA (DISEÑO BLANCO LIMPIO DEL MOCKUP) */}
            {nextAppointment ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                    PRÓXIMA CITA
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug capitalize">
                    {safeFormatDate(nextAppointment.dateTime, "EEEE d MMM · HH:mm'h'")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {nextAppointment.serviceName || 'Quiromasaje Terapéutico'}
                    {nextAppointment.duration ? ` (${nextAppointment.duration} min)` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <a
                    href={makeGoogleCalendarUrl(nextAppointment)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#e6f7f2] text-[#046c4e] hover:bg-[#d0f2e7] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#a7f3d0] transition-colors shadow-2xs"
                  >
                    <span>+ Google Cal</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setReschedulingAppointment(nextAppointment);
                      setNewSelectedDate(addDays(new Date(), 1));
                      setSelectedNewSlot(null);
                    }}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#fef2f2] text-[#991b1b] hover:bg-[#fee2e2] dark:bg-rose-950/60 dark:text-rose-300 border border-[#fecaca] transition-colors shadow-2xs"
                  >
                    <span>Cambiar</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Si no tiene próxima cita */
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                    PRÓXIMA CITA
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No tienes ninguna cita programada actualmente.
                  </p>
                  <p className="text-xs text-slate-500">
                    Elige el día y la hora que mejor te vengan para tu próxima sesión.
                  </p>
                </div>

                <Button asChild className="bg-[#046c4e] hover:bg-[#03533b] text-white font-bold rounded-xl shadow-xs shrink-0">
                  <Link href="/reservas">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Reservar Cita
                  </Link>
                </Button>
              </div>
            )}

            {/* D. OTRAS CITAS PROGRAMADAS (SI TIENE MÁS DE 1) */}
            {upcomingAppointments.length > 1 && (
              <div className="space-y-2.5 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Otras Citas Futuras ({upcomingAppointments.length - 1})
                </h3>
                {upcomingAppointments.slice(1).map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                        {safeFormatDate(apt.dateTime, "EEEE d 'de' MMMM · HH:mm'h'")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {apt.serviceName || 'Masaje'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReschedulingAppointment(apt);
                          setNewSelectedDate(addDays(new Date(), 1));
                          setSelectedNewSlot(null);
                        }}
                        className="text-xs font-bold text-rose-800 hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* E. HISTORIAL RECIENTE DE CITAS PASADAS */}
            {pastAppointments.length > 0 && (
              <div className="space-y-2.5 pt-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Historial de Visitas Realizadas ({pastAppointments.length})
                </h3>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-2xs">
                  {pastAppointments.slice(0, 5).map((apt) => (
                    <div key={apt.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {apt.serviceName || 'Sesión de Masaje'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {safeFormatDate(apt.dateTime, "d 'de' MMMM 'de' yyyy · HH:mm'h'")}
                        </p>
                      </div>

                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Completada
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* F. PIE SUAVE COMO EN EL MOCKUP */}
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-3">
              Pulsa las pestañas superiores para explorar QuiroAgenda v4.0
            </p>

          </div>
        )}

      </main>

      {/* DIÁLOGO: CANCELAR CITA */}
      <Dialog open={!!cancellingAppointment} onOpenChange={(open) => !open && setCancellingAppointment(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
              <CalendarX className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold font-headline text-slate-900">
              ¿Deseas cancelar esta cita?
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {cancellingAppointment && (
                <>
                  Tu cita para <strong>{cancellingAppointment.serviceName || 'Masaje'}</strong> del{' '}
                  <strong>{safeFormatDate(cancellingAppointment.dateTime, "EEEE, d 'de' MMMM 'a las' HH:mm'h'")}</strong> será cancelada y el hueco quedará libre en la agenda.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="cancelReason" className="text-xs font-semibold text-slate-700">
              Motivo de la cancelación (opcional):
            </Label>
            <Input
              id="cancelReason"
              placeholder="ej. Motivos laborales, imprevisto de salud..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancellingAppointment(null)}
              className="rounded-xl font-semibold"
            >
              Mantener Cita
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmittingCancel}
              onClick={handleConfirmCancel}
              className="rounded-xl font-bold"
            >
              {isSubmittingCancel ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelando...
                </span>
              ) : (
                'Sí, Cancelar Cita'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: REPROGRAMAR / CAMBIAR CITA */}
      <Dialog open={!!reschedulingAppointment} onOpenChange={(open) => !open && setReschedulingAppointment(null)}>
        <DialogContent className="max-w-[96vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <CalendarClock className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold font-headline text-slate-900">
              Cambiar fecha u hora de tu cita
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-xs sm:text-sm">
              {reschedulingAppointment && (
                <>
                  Cita actual: <strong>{reschedulingAppointment.serviceName}</strong> ({safeFormatDate(reschedulingAppointment.dateTime, "EEEE d 'de' MMMM 'a las' HH:mm'h'")}).
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-2">
                1. Selecciona el nuevo día:
              </Label>
              <div className="flex justify-center border rounded-2xl p-2 bg-white">
                <CalendarPicker
                  mode="single"
                  selected={newSelectedDate}
                  onSelect={(date) => {
                    if (date) setNewSelectedDate(date);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={es}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-2">
                2. Elige una nueva hora disponible:
              </Label>

              {isLoadingSlots ? (
                <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-emerald-800" />
                  Consultando huecos en la agenda...
                </div>
              ) : newAvailableSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 text-amber-900 text-xs text-center border border-amber-200">
                  No hay huecos disponibles para el día seleccionado. Por favor elige otra fecha en el calendario.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {newAvailableSlots.map((slot) => {
                    const isSelected = selectedNewSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedNewSlot(slot)}
                        className={cn(
                          "py-2 px-3 rounded-xl text-xs font-bold font-mono border transition-all text-center",
                          isSelected
                            ? "bg-[#046c4e] text-white border-[#046c4e] shadow-sm scale-105"
                            : "bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200"
                        )}
                      >
                        {slot} h
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReschedulingAppointment(null)}
              className="rounded-xl font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSubmittingReschedule || !selectedNewSlot}
              onClick={handleConfirmReschedule}
              className="bg-[#046c4e] hover:bg-[#03533b] text-white font-bold rounded-xl shadow-xs"
            >
              {isSubmittingReschedule ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirmando...
                </span>
              ) : (
                'Confirmar Cambio de Cita'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
