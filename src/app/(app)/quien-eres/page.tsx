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
import type { BusinessProfile } from '@/lib/types';
import { Building, Phone, MapPin, Instagram, Facebook, Globe, Download, Upload, AlertTriangle, KeyRound, Save, Clock, CalendarDays, Trash2, CalendarIcon as Calendar, Plus, Image as ImageIcon } from 'lucide-react';
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
  vacations: z.array(z.object({ from: z.string(), to: z.string() })).optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { profile, setProfile, exportData, importData, isLoading } = useAppData();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [newVacation, setNewVacation] = React.useState<DateRange | undefined>();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile || {
        name: '',
        address: '',
        phone: '',
        website: '',
        instagram: '',
        facebook: '',
        tiktok: '',
        youtube: '',
        openingHours: {
            morning: { start: '09:00', end: '14:00', enabled: true },
            afternoon: { start: '16:00', end: '20:00', enabled: true }
        },
        vacations: []
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset(profile);
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

  const handleAddVacation = () => {
    if (newVacation?.from && newVacation?.to) {
        const currentVacations = form.getValues('vacations') || [];
        const updatedVacations = [...currentVacations, { from: newVacation.from.toISOString(), to: newVacation.to.toISOString() }];
        form.setValue('vacations', updatedVacations, { shouldDirty: true });
        setNewVacation(undefined);
    }
  }

  const handleRemoveVacation = (index: number) => {
    const currentVacations = form.getValues('vacations') || [];
    const updatedVacations = currentVacations.filter((_, i) => i !== index);
    form.setValue('vacations', updatedVacations, { shouldDirty: true });
  }

  const onSubmit = (data: ProfileFormValues) => {
    try {
      setProfile(data as BusinessProfile);
      toast({
        title: 'Perfil guardado',
        description: 'La información de tu negocio ha sido actualizada.',
      });
      form.reset(data, { keepValues: true }); 
    } catch (error) {
      console.error('Failed to save profile.', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la información de tu negocio.',
      });
    }
  };

  const handleExportConfirmed = () => {
    exportData();
    toast({
        title: 'Exportación completada',
        description: 'Tus datos se han guardado en un archivo de copia de seguridad.'
    });
    setIsExportConfirmOpen(false);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                throw new Error("El archivo no es válido.");
            }
            importData(text);
            toast({
                title: 'Importación completada',
                description: 'Tus datos han sido restaurados. La aplicación se recargará ahora.'
            });
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('Failed to import data', error);
            toast({
                variant: 'destructive',
                title: 'Error de importación',
                description: 'El archivo de copia de seguridad no es válido.'
            });
        }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return <SplashScreen />;
  }
  
  const logoPreview = form.watch('logo');
  const vacations = form.watch('vacations') || [];
  const morningEnabled = form.watch('openingHours.morning.enabled');
  const afternoonEnabled = form.watch('openingHours.afternoon.enabled');

  return (
    <>
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8">
            <header className="text-center">
                <h1 className="text-3xl font-bold font-headline text-primary">Configuración del Gabinete</h1>
                <p className="text-muted-foreground">Gestiona tu identidad, horarios y seguridad.</p>
            </header>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                        <CardTitle className="text-xl font-bold font-headline text-primary">¿Quién eres?</CardTitle>
                        <CardDescription>Información básica de tu negocio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {logoPreview && (
                                <div className="flex flex-col items-center">
                                    <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-primary/50 shadow-md">
                                        <Image src={logoPreview} alt="Logo" fill style={{ objectFit: 'cover' }} />
                                    </div>
                                </div>
                            )}
                            <FormField control={form.control} name="logo" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center justify-center gap-2 cursor-pointer"><ImageIcon className="w-4 h-4" />Logotipo (.jpg)</FormLabel>
                                    <FormControl>
                                      <div className="flex flex-col gap-2">
                                        <input type="file" accept=".jpg, .jpeg" className="hidden" ref={fileInputRef} onChange={handleFileChange}/>
                                        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>{logoPreview ? 'Cambiar Logotipo' : 'Seleccionar Logotipo'}</Button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Building className="w-4 h-4" />Nombre del Negocio</FormLabel>
                                    <FormControl><Input placeholder="Nombre" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4" />Dirección</FormLabel>
                                    <FormControl><Input placeholder="Dirección física" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4" />Teléfono</FormLabel>
                                    <FormControl><Input placeholder="+34" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                        <CardTitle className="text-xl font-bold font-headline text-primary">Redes Sociales</CardTitle>
                        <CardDescription>Enlaces para mensajes de WhatsApp.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="website" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Globe className="w-4 h-4" />Web</FormLabel>
                                    <FormControl><Input placeholder="https://..." {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="instagram" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Instagram className="w-4 h-4" />Instagram</FormLabel>
                                    <FormControl><Input placeholder="https://instagram.com/..." {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="facebook" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Facebook className="w-4 h-4" />Facebook</FormLabel>
                                    <FormControl><Input placeholder="https://facebook.com/..." {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )}/>
                        </CardContent>
                    </Card>

                     <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold font-headline text-primary">Horarios y Vacaciones</CardTitle>
                            <CardDescription>Define tu disponibilidad para la agenda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <FormLabel className="text-base font-bold flex items-center gap-2"><Clock className="w-5 h-5"/>Turnos de Trabajo</FormLabel>
                                <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                                    <div className={cn("space-y-2", !morningEnabled && "opacity-50")}>
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-sm text-slate-900">Turno Mañana</p>
                                            <FormField control={form.control} name="openingHours.morning.enabled" render={({ field }) => (
                                                <FormItem><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                            )}/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FormField control={form.control} name="openingHours.morning.start" render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl><Input type="time" {...field} disabled={!morningEnabled} /></FormControl>
                                                </FormItem>
                                            )}/>
                                            <span className="text-muted-foreground">-</span>
                                            <FormField control={form.control} name="openingHours.morning.end" render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl><Input type="time" {...field} disabled={!morningEnabled} /></FormControl>
                                                </FormItem>
                                            )}/>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className={cn("space-y-2", !afternoonEnabled && "opacity-50")}>
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-sm text-slate-900">Turno Tarde</p>
                                            <FormField control={form.control} name="openingHours.afternoon.enabled" render={({ field }) => (
                                                <FormItem><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                            )}/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FormField control={form.control} name="openingHours.afternoon.start" render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl><Input type="time" {...field} disabled={!afternoonEnabled} /></FormControl>
                                                </FormItem>
                                            )}/>
                                            <span className="text-muted-foreground">-</span>
                                            <FormField control={form.control} name="openingHours.afternoon.end" render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl><Input type="time" {...field} disabled={!afternoonEnabled} /></FormControl>
                                                </FormItem>
                                            )}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <FormLabel className="text-base font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5"/>Períodos de Vacaciones</FormLabel>
                                <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                                    {vacations.length > 0 ? (
                                        <ul className="space-y-2">
                                            {vacations.map((vac, index) => (
                                                <li key={index} className="flex items-center justify-between text-sm p-2 bg-background border rounded-md shadow-sm">
                                                    <span className="font-medium text-slate-900">{format(parseISO(vac.from), 'dd/MM/yy', {locale: es})} - {format(parseISO(vac.to), 'dd/MM/yy', {locale: es})}</span>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveVacation(index)} className="h-8 w-8"><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-sm text-muted-foreground text-center py-4">Sin vacaciones configuradas.</p>}
                                    <Separator />
                                    <div className="flex flex-col gap-2">
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newVacation && "text-muted-foreground")}>
                                              <Calendar className="h-4 w-4 mr-2" />
                                              {newVacation?.from ? (newVacation.to ? `${format(newVacation.from, "LLL dd", { locale: es })} - ${format(newVacation.to, "LLL dd", { locale: es })}` : format(newVacation.from, "LLL dd", { locale: es })) : "Elige un rango"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarPicker initialFocus mode="range" defaultMonth={newVacation?.from} selected={newVacation} onSelect={setNewVacation} numberOfMonths={2} locale={es} />
                                          </PopoverContent>
                                        </Popover>
                                        <Button type="button" onClick={handleAddVacation} disabled={!newVacation?.from || !newVacation?.to} className="w-full"><Plus className="w-4 h-4 mr-2"/> Añadir Vacaciones</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-primary/10">
                          <CardHeader>
                              <CardTitle className="text-xl font-bold font-headline text-primary">Gestión de Datos y Seguridad</CardTitle>
                              <CardDescription>Cifrado y copias de seguridad locales.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <Button type="button" variant="outline" onClick={() => setIsExportConfirmOpen(true)} className="h-12"><Download className="mr-2 h-4 w-4" />Exportar Datos</Button>
                                  <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} className="h-12"><Upload className="mr-2 h-4 w-4" />Importar Datos</Button>
                                  <Button type="button" variant="secondary" onClick={() => setIsChangePasswordOpen(true)} className="h-12 sm:col-span-2"><KeyRound className="mr-2 h-4 w-4" />Cambiar Contraseña</Button>
                                  <input type="file" accept=".json" className="hidden" ref={importInputRef} onChange={handleImportData}/>
                              </div>
                              <Alert variant="destructive" className="bg-destructive/5">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>¡Atención!</AlertTitle>
                                  <AlertDescription>Las copias de seguridad contienen tus datos completos. Guárdalas en un lugar seguro.</AlertDescription>
                              </Alert>
                          </CardContent>
                    </Card>
                
                <div className="flex justify-center pt-8 pb-12">
                     <Button type="submit" size="lg" className="w-full max-w-sm h-14 text-lg font-bold shadow-2xl hover:scale-105 transition-transform" disabled={!form.formState.isDirty}>
                        <Save className="mr-2 h-6 w-6" />
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