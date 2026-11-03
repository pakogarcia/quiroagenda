'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  ChevronRight
} from 'lucide-react';
import type { Client, Appointment } from '@/lib/types';

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

  // Logged-in client state
  const [sessionClient, setSessionClient] = React.useState<Client | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = React.useState<Appointment[]>([]);
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Restore session from localStorage if present
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(CLIENT_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.client && parsed.phone) {
          setSessionClient(parsed.client);
          setUpcomingAppointments(parsed.upcomingAppointments || []);
          setPastAppointments(parsed.pastAppointments || []);
          setPhoneInput(parsed.phone);
        }
      }
    } catch (e) {
      console.error('Error restaurando sesión de cliente:', e);
    } finally {
      setIsInitializing(false);
    }
  }, []);

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
      const newSession = {
        phone: phoneInput,
        client: data.client,
        upcomingAppointments: data.upcomingAppointments || [],
        pastAppointments: data.pastAppointments || [],
      };
      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(newSession));
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
      const newSession = {
        phone: phoneInput,
        client: data.client,
        upcomingAppointments: data.upcomingAppointments || [],
        pastAppointments: data.pastAppointments || [],
      };
      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(newSession));
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
    setSessionClient(null);
    setLookupState('initial');
    setPhoneInput('');
    setPin('');
    setConfirmPin('');
    setErrorMessage(null);
  };

  // Helper for Google Calendar Link
  const makeGoogleCalendarUrl = (apt: Appointment) => {
    const aptDate = new Date(apt.dateTime);
    const startStr = aptDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(aptDate.getTime() + 60 * 60 * 1000);
    const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(`Cita Masaje: ${apt.serviceName || 'Pako García Quiromasajes'}`);
    const details = encodeURIComponent(`Cita en Gabinete de Quiromasaje Pako García.\nServicio: ${apt.serviceName || ''}\nImporte: ${apt.servicePrice ? `${apt.servicePrice}€` : 'Consultar'}`);
    const location = encodeURIComponent('Pako García Quiromasajes, Córdoba');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfbf7] dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-body">

      {/* HEADER ELEGANTE */}
      <header className="border-b border-amber-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image 
              src="/logo-quiro.jpg" 
              alt="Pako García" 
              width={38} 
              height={38} 
              className="rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" 
            />
            <div className="flex flex-col">
              <span className="font-headline font-bold text-base text-amber-950 dark:text-amber-100 leading-tight">
                Pako García
              </span>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Área de Clientes
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-slate-600 hover:text-amber-900">
              <Link href="/">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Catálogo de Citas
              </Link>
            </Button>
            {sessionClient && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100/50"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Salir
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">

        {/* 1. VISTA DE INICIO DE SESIÓN / IDENTIFICACIÓN */}
        {!sessionClient ? (
          <div className="max-w-md mx-auto pt-6 pb-12">
            
            <Card className="border-amber-200 shadow-xl bg-white/95 dark:bg-slate-900/95 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-800 to-rose-900 text-white p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-amber-300 mb-3 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-bold font-headline text-white">
                  Acceso a tu Área Privada
                </CardTitle>
                <CardDescription className="text-amber-100 text-xs mt-1 leading-relaxed">
                  Consulta tus bonos activos, tus próximas citas y tu historial de masajes
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-5">

                {/* PASO 1: INTRODUCIR TELÉFONO */}
                {(lookupState === 'initial' || lookupState === 'lookup_loading') && (
                  <form onSubmit={handleLookupPhone} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cPhone" className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-amber-700" />
                        Tu Teléfono Móvil
                      </Label>
                      <Input
                        id="cPhone"
                        type="tel"
                        placeholder="ej. 657 34 72 32"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        required
                        className="h-12 text-base font-mono bg-slate-50 dark:bg-slate-800 border-amber-300/60 focus-visible:ring-amber-600 rounded-xl"
                      />
                      <p className="text-[11px] text-slate-500">
                        Introduce el mismo móvil que usaste al reservar o con el que Pako te tiene registrado.
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={lookupState === 'lookup_loading'}
                      className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-700 to-rose-800 hover:from-amber-800 hover:to-rose-900 text-white shadow-lg rounded-xl transition-all"
                    >
                      {lookupState === 'lookup_loading' ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Comprobando ficha...
                        </span>
                      ) : (
                        'Continuar'
                      )}
                    </Button>
                  </form>
                )}

                {/* PASO 2A: CREAR PIN DE 4 DÍGITOS (PRIMERA VEZ) */}
                {lookupState === 'needs_pin' && (
                  <form onSubmit={handleSetPin} className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        ¡Hola, {clientGreetingName}!
                      </p>
                      <p className="leading-relaxed">
                        Es tu primera vez en tu Área de Clientes. Para proteger tu privacidad, elige un PIN personal de 4 dígitos.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPin" className="text-sm font-bold flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-700" />
                        Elige tu PIN de 4 números
                      </Label>
                      <Input
                        id="newPin"
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        required
                        className="h-12 text-center text-2xl tracking-[0.5em] font-mono bg-slate-50 dark:bg-slate-800 border-amber-300/60 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confPin" className="text-sm font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Confirma tu PIN de 4 números
                      </Label>
                      <Input
                        id="confPin"
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        required
                        className="h-12 text-center text-2xl tracking-[0.5em] font-mono bg-slate-50 dark:bg-slate-800 border-amber-300/60 rounded-xl"
                      />
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setLookupState('initial'); setErrorMessage(null); setPin(''); setConfirmPin(''); }}
                        className="w-1/3 h-12 font-medium rounded-xl"
                      >
                        Atrás
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmittingPin || pin.length !== 4 || confirmPin.length !== 4}
                        className="flex-1 h-12 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg rounded-xl"
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

                {/* PASO 2B: INTRODUCIR PIN EXISTENTE */}
                {lookupState === 'enter_pin' && (
                  <form onSubmit={handleLoginPin} className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ¡Hola de nuevo, {clientGreetingName}!
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        Introduce tu PIN de 4 dígitos para acceder a tus citas.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loginPin" className="text-sm font-bold flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-700" />
                        Tu PIN de 4 números
                      </Label>
                      <Input
                        id="loginPin"
                        type="password"
                        maxLength={4}
                        autoFocus
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        required
                        className="h-12 text-center text-2xl tracking-[0.5em] font-mono bg-slate-50 dark:bg-slate-800 border-amber-300/60 rounded-xl"
                      />
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setLookupState('initial'); setErrorMessage(null); setPin(''); }}
                        className="w-1/3 h-12 font-medium rounded-xl"
                      >
                        Cambiar Móvil
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmittingPin || pin.length !== 4}
                        className="flex-1 h-12 text-sm font-bold bg-gradient-to-r from-amber-700 to-rose-800 hover:from-amber-800 hover:to-rose-900 text-white shadow-lg rounded-xl"
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
                          `Hola Pako, he olvidado el PIN de mi área de clientes para el número ${phoneInput}. ¿Podrías restablecérmelo por favor?`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-800 hover:text-amber-900 underline font-medium inline-flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                        ¿Has olvidado tu PIN? Pide a Pako que te lo restablezca
                      </a>
                    </div>
                  </form>
                )}

              </CardContent>
            </Card>

          </div>
        ) : (
          /* 2. VISTA PRIVADA DEL CLIENTE AUTENTICADO */
          <div className="space-y-8 animate-in fade-in duration-300 pb-16">

            {/* TARJETA DE BIENVENIDA */}
            <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-rose-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs text-amber-300 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Tu Espacio Personal de Bienestar
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-headline text-white">
                  Hola, {sessionClient.name} {sessionClient.lastName}
                </h1>
                <p className="text-amber-200/80 text-xs sm:text-sm">
                  Teléfono registrado: {sessionClient.phone}
                </p>
              </div>

              <Button asChild className="h-11 px-6 font-bold bg-white text-amber-950 hover:bg-amber-100 shadow-md rounded-xl">
                <Link href="/">
                  <CalendarDays className="w-4 h-4 mr-2 text-amber-700" />
                  Reservar Nuevo Masaje
                </Link>
              </Button>
            </div>

            {/* ESTADO DEL BONO ACTIVO */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-700" />
                Tus Bonos de Masajes
              </h2>

              {sessionClient.voucher && sessionClient.voucher.sessions > 0 ? (
                <Card className="border-emerald-300/80 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 shadow-md rounded-2xl overflow-hidden ring-1 ring-emerald-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-700 text-white font-bold px-3 py-1 text-xs">
                        ⭐ Bono Activo Disponible
                      </Badge>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Sin Caducidad
                      </span>
                    </div>
                    <CardTitle className="text-2xl font-bold font-headline text-slate-900 dark:text-white mt-2">
                      {sessionClient.voucher.sessions} de {sessionClient.voucher.totalSessions} Sesiones Disponibles
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300 text-xs">
                      Puedes disfrutar de cualquiera de tus sesiones restantes reservando directamente en tu agenda.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Barra de progreso */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(sessionClient.voucher.sessions / sessionClient.voucher.totalSessions) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-amber-300/70 bg-amber-50/40 dark:bg-slate-900/40 rounded-2xl p-5 text-sm text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      No tienes bonos de masajes activos en este momento.
                    </p>
                    <p className="text-xs text-slate-500">
                      Adquiriendo un bono de 5 o 10 sesiones disfrutas de tarifas con descuento especial y total flexibilidad.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="border-amber-400 text-amber-900 hover:bg-amber-100 font-semibold shrink-0">
                    <a 
                      href="https://wa.me/34634432487?text=Hola%20Pako,%20quisiera%20informaci%C3%B3n%20para%20adquirir%20un%20bono%20de%20masajes" 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
                      Consultar Bonos
                    </a>
                  </Button>
                </Card>
              )}
            </div>

            {/* PRÓXIMAS CITAS */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-700" />
                Tus Próximas Citas ({upcomingAppointments.length})
              </h2>

              {upcomingAppointments.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-amber-200 rounded-2xl bg-white dark:bg-slate-900 text-center space-y-3">
                  <p className="text-slate-600 font-medium">No tienes ninguna cita programada próximamente.</p>
                  <Button asChild className="font-bold bg-amber-800 hover:bg-amber-900 text-white">
                    <Link href="/">
                      Elegir día y hora para un masaje
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingAppointments.map((apt) => (
                    <Card key={apt.id} className="border-amber-300/80 shadow-md rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                      <CardHeader className="pb-3 border-b border-amber-100 dark:border-slate-800 bg-amber-50/50 dark:bg-slate-800/40">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-emerald-600 text-white text-xs font-bold">
                            Cita Confirmada
                          </Badge>
                          {apt.servicePrice && (
                            <span className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                              {apt.servicePrice}€
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg font-bold font-headline text-slate-900 dark:text-white mt-1">
                          {apt.serviceName || 'Masaje Personalizado'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                          <CalendarCheck className="w-4 h-4 text-amber-700" />
                          <span>
                            {format(new Date(apt.dateTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                          <Clock className="w-4 h-4 text-amber-700" />
                          <span>A las {format(new Date(apt.dateTime), 'HH:mm')} h</span>
                        </div>

                        {apt.notes && (
                          <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                            Nota: {apt.notes}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-amber-100 dark:border-slate-800 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild className="text-xs font-semibold flex-1">
                          <a href={makeGoogleCalendarUrl(apt)} target="_blank" rel="noreferrer">
                            Añadir a Google Calendar
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                          <a 
                            href={`https://wa.me/34634432487?text=${encodeURIComponent(
                              `Hola Pako, te escribo en relación a mi cita del ${format(new Date(apt.dateTime), "d 'de' MMMM a las HH:mm'h'", { locale: es })}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1" />
                            Avisar por WhatsApp
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* HISTORIAL DE VISITAS */}
            {pastAppointments.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-amber-200/50">
                <h2 className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-700" />
                  Tu Historial de Visitas Pasadas ({pastAppointments.length})
                </h2>

                <div className="bg-white dark:bg-slate-900 border border-amber-200/60 rounded-2xl overflow-hidden shadow-sm divide-y divide-amber-100 dark:divide-slate-800">
                  {pastAppointments.slice(0, 10).map((apt) => (
                    <div key={apt.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-4 text-xs sm:text-sm">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          {apt.serviceName || 'Sesión de Masaje'}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {format(new Date(apt.dateTime), "d 'de' MMMM 'de' yyyy 'a las' HH:mm 'h'", { locale: es })}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 border-slate-300 text-slate-600 shrink-0">
                        Completada
                      </Badge>
                    </div>
                  ))}
                </div>
                {pastAppointments.length > 10 && (
                  <p className="text-xs text-center text-slate-400">
                    Mostrando las últimas 10 sesiones de tu historial.
                  </p>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-amber-950 text-amber-200 py-6 border-t border-amber-900 mt-auto text-center text-xs space-y-1">
        <p className="font-headline font-bold text-amber-100">Pako García Quiromasajes · Gabinete Profesional</p>
        <p className="text-amber-300/70">Tus datos están protegidos y solo son accesibles con tu PIN personal confidencial.</p>
      </footer>

    </div>
  );
}
