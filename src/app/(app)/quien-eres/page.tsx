'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { BusinessProfile, WeeklySchedule } from '@/lib/types';
import { 
  Building, 
  Phone, 
  MapPin, 
  Instagram, 
  Facebook, 
  Globe, 
  Download, 
  Upload, 
  AlertTriangle, 
  KeyRound, 
  Save, 
  Clock, 
  CalendarDays, 
  Trash2, 
  CalendarIcon as Calendar, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Copy, 
  CheckCircle2, 
  Ban,
  Sun,
  Moon
} from 'lucide-react';
import { SplashScreen } from '@/components/layout/splash-screen';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAppData } from '@/context/app-data-context';
import { PasswordConfirmationDialog } from '@/components/password-confirmation-dialog';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DAYS_OF_WEEK_CONFIG, DEFAULT_WEEKLY_SCHEDULE } from '@/lib/schedule';
import type { DayOfWeek } from '@/lib/types';

const shiftSchema = z.object({
  start: z.string(),
  end: z.string(),
  enabled: z.boolean(),
});

const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  morning: shiftSchema,
  afternoon: shiftSchema,
});

const weeklyScheduleSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre del negocio es obligatorio.'),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().url().or(z.literal('')).optional(),
  instagram: z.string().url().or(z.literal('')).optional(),
  facebook: z.string().url().or(z.literal('')).optional(),
  tiktok: z.string().url().or(z.literal('')).optional(),
  youtube: z.string().url().or(z.literal('')).optional(),
  openingHours: z.object({
      morning: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
      afternoon: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() })
  }).optional(),
  weeklySchedule: weeklyScheduleSchema.optional(),
  vacations: z.array(z.object({ from: z.string(), to: z.string() })).optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const buildInitialWeeklySchedule = (profile: BusinessProfile | null): WeeklySchedule => {
  if (profile?.weeklySchedule) {
    return profile.weeklySchedule;
  }
  const schedule: WeeklySchedule = JSON.parse(JSON.stringify(DEFAULT_WEEKLY_SCHEDULE));
  if (profile?.openingHours) {
    const morning = profile.openingHours.morning || { start: '08:30', end: '14:00', enabled: true };
    const afternoon = profile.openingHours.afternoon || { start: '16:30', end: '20:30', enabled: true };
    (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]).forEach(day => {
      schedule[day] = {
        enabled: true,
        morning: { ...morning },
        afternoon: { ...afternoon }
      };
    });
  }
  return schedule;
};

export default function ProfilePage() {
  const { 
    profile, 
    updateProfile, 
    blockedDays, 
    setCloudBlockedDays, 
    exportData, 
    importData, 
    isLoading 
  } = useAppData();
  
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  
  const [newVacation, setNewVacation] = React.useState<DateRange | undefined>();
  const [newBlockedDate, setNewBlockedDate] = React.useState<Date | undefined>();
  const [activeDayTab, setActiveDayTab] = React.useState<DayOfWeek>('monday');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      address: profile?.address || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      instagram: profile?.instagram || '',
      facebook: profile?.facebook || '',
      tiktok: profile?.tiktok || '',
      youtube: profile?.youtube || '',
      openingHours: profile?.openingHours || {
        morning: { start: '08:30', end: '14:00', enabled: true },
        afternoon: { start: '16:30', end: '20:30', enabled: true }
      },
      weeklySchedule: buildInitialWeeklySchedule(profile),
      vacations: profile?.vacations || []
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        address: profile.address || '',
        phone: profile.phone || '',
        website: profile.website || '',
        instagram: profile.instagram || '',
        facebook: profile.facebook || '',
        tiktok: profile.tiktok || '',
        youtube: profile.youtube || '',
        logo: profile.logo,
        openingHours: profile.openingHours || {
          morning: { start: '08:30', end: '14:00', enabled: true },
          afternoon: { start: '16:30', end: '20:30', enabled: true }
        },
        weeklySchedule: buildInitialWeeklySchedule(profile),
        vacations: profile.vacations || []
      });
    }
  }, [profile, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'image/jpeg') {
        const reader = new FileReader();
        reader.onloadend = () => {
          form.setValue('logo', reader.result as string, { shouldDirty: true });
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Formato inválido',
          description: 'Por favor, selecciona un archivo en formato JPG.',
        });
      }
    }
  };

  const handleCopySchedule = (fromDay: DayOfWeek, target: 'workdays' | 'all') => {
    const currentSchedule = form.getValues(`weeklySchedule.${fromDay}`);
    if (!currentSchedule) return;

    const targets: DayOfWeek[] = target === 'workdays' 
      ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    targets.forEach(day => {
      form.setValue(`weeklySchedule.${day}`, JSON.parse(JSON.stringify(currentSchedule)), { shouldDirty: true });
    });

    const dayName = DAYS_OF_WEEK_CONFIG.find(d => d.key === fromDay)?.label || fromDay;
    toast({
      title: 'Horario copiado',
      description: target === 'workdays' 
        ? `Horario de ${dayName} aplicado a Lunes - Viernes.`
        : `Horario de ${dayName} aplicado a toda la semana.`
    });
  };

  const handleAddVacation = () => {
    if (newVacation?.from && newVacation?.to) {
        const currentVacations = form.getValues('vacations') || [];
        const updatedVacations = [...currentVacations, { from: newVacation.from.toISOString(), to: newVacation.to.toISOString() }];
        form.setValue('vacations', updatedVacations, { shouldDirty: true });
        setNewVacation(undefined);
    }
  };

  const handleRemoveVacation = (index: number) => {
    const currentVacations = form.getValues('vacations') || [];
    const updatedVacations = currentVacations.filter((_, i) => i !== index);
    form.setValue('vacations', updatedVacations, { shouldDirty: true });
  };

  const handleAddBlockedDay = async () => {
    if (!newBlockedDate) return;
    const dateStr = format(newBlockedDate, 'yyyy-MM-dd');
    if (blockedDays.includes(dateStr)) {
      toast({ title: 'Aviso', description: 'Este día ya está marcado como inhábil.' });
      return;
    }
    const updated = [...blockedDays, dateStr].sort();
    await setCloudBlockedDays(updated);
    setNewBlockedDate(undefined);
    toast({ 
      title: 'Día Inhábil Añadido', 
      description: `${format(newBlockedDate, 'dd/MM/yyyy')} ha sido bloqueado con éxito.` 
    });
  };

  const handleRemoveBlockedDay = async (dateStr: string) => {
    const updated = blockedDays.filter(d => d !== dateStr);
    await setCloudBlockedDays(updated);
    toast({ 
      title: 'Día Desbloqueado', 
      description: `${dateStr} vuelve a estar habilitado.` 
    });
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Sincronizar también openingHours legado con lunes para máxima compatibilidad
      const monday = data.weeklySchedule?.monday;
      if (monday) {
        data.openingHours = {
          morning: monday.morning,
          afternoon: monday.afternoon,
        };
      }

      await updateProfile(data as BusinessProfile);
      toast({
        title: 'Configuración guardada',
        description: 'El perfil, horario semanal y vacaciones se han actualizado en la nube.',
      });
      form.reset(data, { keepValues: true }); 
    } catch (error) {
      console.error('Failed to save profile.', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la información de tu negocio en la nube.',
      });
    }
  };

  const handleExportConfirmed = () => {
    exportData();
    toast({
        title: 'Exportación completada',
        description: 'Tus datos se han guardado en un archivo de copia de seguridad.'
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          await importData(content);
          toast({
            title: 'Datos Importados',
            description: 'La base de datos se ha restaurado y sincronizado con la nube con éxito.',
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error de Importación',
            description: 'El archivo no es una copia de seguridad válida.',
          });
        }
      };
      reader.readAsText(file);
    }
    if (importInputRef.current) {
        importInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  const vacations = form.watch('vacations') || [];

  return (
    <>
    <div className="flex flex-col min-h-screen bg-background font-body">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold font-headline text-primary tracking-tight">Quién Eres</h1>
              <p className="text-muted-foreground mt-1">Configura la identidad de tu centro, tus horarios de trabajo por día y tus días inhábiles.</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
                    {/* Tarjeta: Datos Generales */}
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold font-headline text-primary">Datos del Gabinete</CardTitle>
                            <CardDescription>Información pública y de contacto de tu negocio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="logo"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="relative w-28 h-28 rounded-full border-2 border-primary/20 flex items-center justify-center bg-muted/40 overflow-hidden shadow-inner">
                                            {field.value ? (
                                                <Image src={field.value} alt="Logo de QuiroAgenda" fill className="object-cover" />
                                            ) : (
                                                <ImageIcon className="w-10 h-10 text-muted-foreground/60" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left">
                                            <FormLabel className="font-semibold text-slate-800">Logotipo del Gabinete</FormLabel>
                                            <p className="text-xs text-muted-foreground">Formato JPG recomendado (resolución cuadrada).</p>
                                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mt-1">
                                                <Upload className="w-4 h-4 mr-2" />
                                                Subir imagen JPG
                                            </Button>
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg" className="hidden" />
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Building className="w-4 h-4 text-primary" />Nombre del Negocio</FormLabel>
                                    <FormControl><Input placeholder="Pako García Quiromasajista" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Dirección</FormLabel>
                                    <FormControl><Input placeholder="C/ Ejemplo, 12, Ciudad" {...field} value={field.value ?? ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Teléfono de Contacto</FormLabel>
                                    <FormControl><Input placeholder="626 10 57 93" {...field} value={field.value ?? ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                    </Card>
                    
                    {/* Tarjeta: Redes Sociales */}
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold font-headline text-primary">Redes Sociales</CardTitle>
                            <CardDescription>Enlaces visibles en tu portal web y mensajes de WhatsApp.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="website" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Web Principal</FormLabel>
                                    <FormControl><Input placeholder="https://citas.pakogarcia.es" {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="instagram" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-600" />Instagram</FormLabel>
                                    <FormControl><Input placeholder="https://instagram.com/pakogarcia" {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="facebook" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-600" />Facebook</FormLabel>
                                    <FormControl><Input placeholder="https://facebook.com/..." {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="tiktok" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Video className="w-4 h-4 text-slate-800" />TikTok</FormLabel>
                                    <FormControl><Input placeholder="https://tiktok.com/@..." {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )}/>
                        </CardContent>
                    </Card>

                    {/* Tarjeta: Horarios por Día de la Semana (Estilo Cal.com / Google Calendar) */}
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                <CardTitle className="text-xl font-bold font-headline text-primary flex items-center gap-2">
                                  <Clock className="w-5 h-5 text-primary" />
                                  Turnos de Trabajo por Día de la Semana
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  Personaliza el horario de mañana y tarde para cada día (Lunes a Domingo). Las reservas online respetarán estos rangos exactos.
                                </CardDescription>
                              </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            <Tabs value={activeDayTab} onValueChange={(val) => setActiveDayTab(val as DayOfWeek)} className="w-full">
                                <TabsList className="grid grid-cols-7 w-full h-auto p-1.5 bg-muted/60 rounded-xl gap-1">
                                  {DAYS_OF_WEEK_CONFIG.map((day) => {
                                    const isDayEnabled = form.watch(`weeklySchedule.${day.key}.enabled`);
                                    return (
                                      <TabsTrigger 
                                        key={day.key} 
                                        value={day.key}
                                        className="flex flex-col items-center py-2 px-1 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                                      >
                                        <span className="hidden sm:inline">{day.label}</span>
                                        <span className="sm:hidden">{day.short}</span>
                                        <span className={cn(
                                          "w-2 h-2 rounded-full mt-1 transition-colors",
                                          isDayEnabled ? "bg-emerald-500" : "bg-slate-300"
                                        )} />
                                      </TabsTrigger>
                                    );
                                  })}
                                </TabsList>

                                {DAYS_OF_WEEK_CONFIG.map((day) => {
                                  const dayKey = day.key;
                                  const dayEnabled = form.watch(`weeklySchedule.${dayKey}.enabled`);
                                  const morningEnabled = form.watch(`weeklySchedule.${dayKey}.morning.enabled`);
                                  const afternoonEnabled = form.watch(`weeklySchedule.${dayKey}.afternoon.enabled`);

                                  return (
                                    <TabsContent key={dayKey} value={dayKey} className="mt-6 space-y-6">
                                      {/* Cabecera del día */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-muted/20 gap-4">
                                        <div className="flex items-center gap-3">
                                          <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                            dayEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                                          )}>
                                            {day.short}
                                          </div>
                                          <div>
                                            <h3 className="font-bold text-base text-slate-900">{day.label}</h3>
                                            <p className="text-xs text-muted-foreground">
                                              {dayEnabled ? "Gabinete abierto y disponible para citas" : "Gabinete cerrado (Día de descanso)"}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                          <span className="text-sm font-medium text-slate-700">
                                            {dayEnabled ? "Abierto" : "Cerrado"}
                                          </span>
                                          <FormField
                                            control={form.control}
                                            name={`weeklySchedule.${dayKey}.enabled`}
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormControl>
                                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </div>

                                      {/* Configuración de turnos si el día está abierto */}
                                      {dayEnabled ? (
                                        <div className="space-y-4">
                                          {/* Turno Mañana */}
                                          <div className={cn(
                                            "p-4 rounded-xl border transition-opacity space-y-3",
                                            morningEnabled ? "bg-background shadow-xs border-primary/20" : "bg-muted/30 opacity-60"
                                          )}>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <Sun className="w-4 h-4 text-amber-500" />
                                                <span className="font-bold text-sm text-slate-900">Turno de Mañana</span>
                                              </div>
                                              <FormField
                                                control={form.control}
                                                name={`weeklySchedule.${dayKey}.morning.enabled`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormControl>
                                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                              <FormField
                                                control={form.control}
                                                name={`weeklySchedule.${dayKey}.morning.start`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">Desde</FormLabel>
                                                    <FormControl>
                                                      <Input type="time" {...field} disabled={!morningEnabled} className="h-10 text-center font-mono" />
                                                    </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                              <FormField
                                                control={form.control}
                                                name={`weeklySchedule.${dayKey}.morning.end`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">Hasta</FormLabel>
                                                    <FormControl>
                                                      <Input type="time" {...field} disabled={!morningEnabled} className="h-10 text-center font-mono" />
                                                    </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                          </div>

                                          {/* Turno Tarde */}
                                          <div className={cn(
                                            "p-4 rounded-xl border transition-opacity space-y-3",
                                            afternoonEnabled ? "bg-background shadow-xs border-primary/20" : "bg-muted/30 opacity-60"
                                          )}>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <Moon className="w-4 h-4 text-indigo-500" />
                                                <span className="font-bold text-sm text-slate-900">Turno de Tarde</span>
                                              </div>
                                              <FormField
                                                control={form.control}
                                                name={`weeklySchedule.${dayKey}.afternoon.enabled`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormControl>
                                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                              <FormField
                                                control={form.control}
                                                name={`weeklySchedule.${dayKey}.afternoon.start`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">Desde</FormLabel>
                                                    <FormControl>
                                                      <Input type="time" {...field} disabled={!afternoonEnabled} className="h-10 text-center font-mono" />
                                                    </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                              <FormField
                                                control={form.control}
                                                name={`weeklySchedule.${dayKey}.afternoon.end`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">Hasta</FormLabel>
                                                    <FormControl>
                                                      <Input type="time" {...field} disabled={!afternoonEnabled} className="h-10 text-center font-mono" />
                                                    </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="p-8 text-center border-2 border-dashed rounded-xl bg-muted/10 space-y-2">
                                          <Ban className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                                          <p className="text-sm font-semibold text-slate-700">Día de descanso programado</p>
                                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                            Los clientes que intenten pedir cita este día verán el gabinete cerrado.
                                          </p>
                                        </div>
                                      )}

                                      {/* Botones de acción rápida: Copiar a otros días */}
                                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                                        <span className="text-xs font-semibold text-muted-foreground mr-1">Acciones rápidas:</span>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="text-xs h-8"
                                          onClick={() => handleCopySchedule(dayKey, 'workdays')}
                                        >
                                          <Copy className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                          Copiar a Lun - Vie
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="text-xs h-8"
                                          onClick={() => handleCopySchedule(dayKey, 'all')}
                                        >
                                          <Copy className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                          Copiar a Toda la Semana
                                        </Button>
                                      </div>
                                    </TabsContent>
                                  );
                                })}
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Tarjeta: Períodos de Vacaciones y Días Festivos / Inhábiles */}
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold font-headline text-primary flex items-center gap-2">
                              <CalendarDays className="w-5 h-5 text-primary"/>
                              Vacaciones y Días Festivos / Inhábiles
                            </CardTitle>
                            <CardDescription>
                              Bloquea rangos de fechas (vacaciones) o días festivos específicos. Esos días quedan completamente cerrados tanto en tu agenda como para las reservas online de los clientes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            
                            {/* Sección 1: Vacaciones (Rangos) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <FormLabel className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Sun className="w-4 h-4 text-amber-500" />
                                    Períodos de Vacaciones (Rangos)
                                  </FormLabel>
                                  <Badge variant="outline" className="text-xs font-semibold">
                                    {vacations.length} {vacations.length === 1 ? 'período' : 'períodos'}
                                  </Badge>
                                </div>

                                <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
                                    {vacations.length > 0 ? (
                                        <ul className="space-y-2">
                                            {vacations.map((vac, index) => (
                                                <li key={index} className="flex items-center justify-between text-sm p-3 bg-background border rounded-lg shadow-xs">
                                                    <span className="font-semibold text-slate-900">
                                                      {format(parseISO(vac.from), 'dd/MM/yyyy', {locale: es})} — {format(parseISO(vac.to), 'dd/MM/yyyy', {locale: es})}
                                                    </span>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveVacation(index)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                      <Trash2 className="w-4 h-4"/>
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                      <p className="text-xs text-muted-foreground text-center py-3">Sin vacaciones configuradas actualmente.</p>
                                    )}
                                    <Separator />
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal h-10", !newVacation && "text-muted-foreground")}>
                                              <Calendar className="h-4 w-4 mr-2 text-primary" />
                                              {newVacation?.from ? (
                                                newVacation.to 
                                                  ? `${format(newVacation.from, "dd MMM yyyy", { locale: es })} - ${format(newVacation.to, "dd MMM yyyy", { locale: es })}` 
                                                  : format(newVacation.from, "dd MMM yyyy", { locale: es })
                                              ) : "Seleccionar rango de vacaciones"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarPicker initialFocus mode="range" defaultMonth={newVacation?.from} selected={newVacation} onSelect={setNewVacation} numberOfMonths={2} locale={es} />
                                          </PopoverContent>
                                        </Popover>
                                        <Button type="button" onClick={handleAddVacation} disabled={!newVacation?.from || !newVacation?.to} className="sm:w-auto h-10">
                                          <Plus className="w-4 h-4 mr-1.5"/> Añadir Período
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Sección 2: Días Festivos / Inhábiles Concretos */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <FormLabel className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                      <Ban className="w-4 h-4 text-red-500" />
                                      Días Festivos e Inhábiles Sueltos
                                    </FormLabel>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      También puedes marcar o desmarcar cualquier día directamente desde el botón &ldquo;Bloquear Día&rdquo; en la agenda.
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-xs font-semibold">
                                    {blockedDays.length} {blockedDays.length === 1 ? 'día bloqueado' : 'días bloqueados'}
                                  </Badge>
                                </div>

                                <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
                                    {/* Selector para añadir día festivo */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal h-10", !newBlockedDate && "text-muted-foreground")}>
                                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                                            {newBlockedDate ? format(newBlockedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es }) : "Seleccionar día festivo o inhábil"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <CalendarPicker 
                                            mode="single" 
                                            selected={newBlockedDate} 
                                            onSelect={setNewBlockedDate} 
                                            locale={es} 
                                            initialFocus 
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <Button 
                                        type="button" 
                                        onClick={handleAddBlockedDay} 
                                        disabled={!newBlockedDate}
                                        className="sm:w-auto h-10"
                                      >
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        Bloquear Día
                                      </Button>
                                    </div>

                                    {/* Lista de días festivos e inhábiles registrados */}
                                    {blockedDays.length > 0 ? (
                                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                          {blockedDays.slice().sort().map((dateStr) => {
                                            const parts = dateStr.split('-');
                                            const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
                                            return (
                                              <div 
                                                key={dateStr}
                                                className="flex items-center justify-between px-3 py-2 bg-background border rounded-lg text-xs font-medium shadow-2xs hover:border-destructive/30 transition-colors"
                                              >
                                                <span className="font-mono text-slate-800">{displayDate}</span>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => handleRemoveBlockedDay(dateStr)}
                                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                  title="Desbloquear día"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground text-center py-3">No hay días inhábiles registrados.</p>
                                    )}
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Tarjeta: Gestión de Datos y Seguridad */}
                    <Card className="shadow-lg border-primary/10">
                          <CardHeader>
                              <CardTitle className="text-xl font-bold font-headline text-primary">Gestión de Datos y Seguridad</CardTitle>
                              <CardDescription>Descarga de copias de seguridad locales y restauración.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <Button type="button" variant="outline" onClick={() => setIsExportConfirmOpen(true)} className="h-12"><Download className="mr-2 h-4 w-4 text-primary" />Exportar Datos</Button>
                                  <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} className="h-12"><Upload className="mr-2 h-4 w-4 text-primary" />Importar Datos</Button>
                                  <Button type="button" variant="secondary" onClick={() => setIsChangePasswordOpen(true)} className="h-12 sm:col-span-2"><KeyRound className="mr-2 h-4 w-4" />Cambiar Contraseña Maestra</Button>
                                  <input type="file" accept=".json" className="hidden" ref={importInputRef} onChange={handleImportData}/>
                              </div>
                              <Alert variant="destructive" className="bg-destructive/5">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>Copia de Seguridad</AlertTitle>
                                  <AlertDescription>Las copias de seguridad contienen tus datos completos (citas, clientes, servicios, bonos y gastos). Guárdalas en un lugar seguro.</AlertDescription>
                              </Alert>
                          </CardContent>
                    </Card>
                
                    {/* Botón Guardar Flotante / Inferior */}
                    <div className="flex justify-center pt-4 pb-12 sticky bottom-4 z-10">
                         <Button 
                            type="submit" 
                            size="lg" 
                            className="w-full max-w-sm h-14 text-base font-bold shadow-2xl hover:scale-105 transition-transform" 
                            disabled={!form.formState.isDirty}
                         >
                            <Save className="mr-2 h-5 w-5" />
                            Guardar Configuración
                        </Button>
                    </div>
              </form>
            </Form>
        </div>
      </main>
    </div>
    <PasswordConfirmationDialog isOpen={isExportConfirmOpen} onOpenChange={setIsExportConfirmOpen} onConfirm={handleExportConfirmed} title="Seguridad de Exportación" description="Confirma tu contraseña para autorizar la descarga."/>
    <ChangePasswordDialog isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}/>
    </>
  );
}
