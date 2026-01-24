
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
import type { BusinessProfile, Vacation } from '@/lib/types';
import { Building, Phone, MapPin, Instagram, Facebook, Link as LinkIcon, Youtube, Image as ImageIcon, Globe, Download, Upload, AlertTriangle, KeyRound, Save, Clock, CalendarDays, Trash2, CalendarIcon as Calendar, Plus } from 'lucide-react';
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
      morning: z.object({ start: z.string(), end: z.string() }),
      afternoon: z.object({ start: z.string(), end: z.string() })
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
    defaultValues: profile || {},
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
      form.reset(data, { keepValues: true }); // Resets dirty state
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
                description: 'El archivo de copia de seguridad no es válido o está corrupto.'
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

  return (
    <>
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-7xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <Card className="shadow-lg">
                        <CardHeader>
                        <CardTitle className="text-2xl font-bold font-headline text-primary">¿Quién eres?</CardTitle>
                        <CardDescription>Completa la información de tu negocio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {logoPreview && (
                                <div className="flex flex-col items-center">
                                    <FormLabel>Vista previa del Logotipo</FormLabel>
                                    <div className="mt-2 relative h-24 w-24 rounded-full overflow-hidden border-2 border-primary/50">
                                        <Image src={logoPreview} alt="Vista previa del logo" layout="fill" objectFit="cover" />
                                    </div>
                                </div>
                            )}
                            <FormField control={form.control} name="logo" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center justify-center gap-2"><ImageIcon className="w-4 h-4" />Logotipo (.jpg)</FormLabel> <FormControl> <div> <Input type="file" accept=".jpg, .jpeg" className="hidden" ref={fileInputRef} onChange={handleFileChange} /> <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}> {logoPreview ? 'Cambiar Logotipo' : 'Seleccionar Logotipo'} </Button> </div> </FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center gap-2"><Building className="w-4 h-4" />Nombre del Negocio</FormLabel> <FormControl> <Input placeholder="p. ej., Centro de Masajes Zen" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4" />Situación</FormLabel> <FormControl> <Input placeholder="p. ej., Calle Falsa 123, Ciudad" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4" />Teléfono de Contacto</FormLabel> <FormControl> <Input placeholder="+34 987 654 321" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg">
                        <CardHeader>
                        <CardTitle className="text-2xl font-bold font-headline text-primary">Web y Redes Sociales</CardTitle>
                        <CardDescription>Añade tus enlaces para que aparezcan en los mensajes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="website" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center gap-2"><Globe className="w-4 h-4" />Página Web</FormLabel> <FormControl> <Input placeholder="https://tu-pagina-web.com" {...field} value={field.value ?? ''} /> </FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="instagram" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center gap-2"><Instagram className="w-4 h-4" />Instagram</FormLabel> <FormControl> <Input placeholder="https://instagram.com/tu_usuario" {...field} value={field.value ?? ''} /> </FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="facebook" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center gap-2"><Facebook className="w-4 h-4" />Facebook</FormLabel> <FormControl> <Input placeholder="https://facebook.com/tu_pagina" {...field} value={field.value ?? ''} /> </FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="tiktok" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center gap-2"><LinkIcon className="w-4 h-4" />TikTok</FormLabel> <FormControl> <Input placeholder="https://tiktok.com/@tu_usuario" {...field} value={field.value ?? ''}/> </FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="youtube" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center gap-2"><Youtube className="w-4 h-4" />YouTube</FormLabel> <FormControl> <Input placeholder="https://youtube.com/c/tu_canal" {...field} value={field.value ?? ''}/> </FormControl> <FormMessage /> </FormItem> )}/>
                        </CardContent>
                    </Card>

                     <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold font-headline text-primary">Horario Laboral y Vacaciones</CardTitle>
                            <CardDescription>Define tus horas de trabajo y días libres.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <FormLabel className="text-base font-medium flex items-center gap-2 mb-2"><Clock className="w-5 h-5"/>Horario Laboral</FormLabel>
                                <div className="space-y-4 rounded-md border p-4">
                                    <div>
                                        <p className="font-medium text-sm text-muted-foreground">Mañanas</p>
                                        <div className="flex items-center gap-2">
                                            <FormField control={form.control} name="openingHours.morning.start" render={({ field }) => ( <FormItem className="flex-1"> <FormLabel className="text-xs">Desde</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> </FormItem> )}/>
                                            <FormField control={form.control} name="openingHours.morning.end" render={({ field }) => ( <FormItem className="flex-1"> <FormLabel className="text-xs">Hasta</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> </FormItem> )}/>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-muted-foreground">Tardes</p>
                                        <div className="flex items-center gap-2">
                                            <FormField control={form.control} name="openingHours.afternoon.start" render={({ field }) => ( <FormItem className="flex-1"> <FormLabel className="text-xs">Desde</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> </FormItem> )}/>
                                            <FormField control={form.control} name="openingHours.afternoon.end" render={({ field }) => ( <FormItem className="flex-1"> <FormLabel className="text-xs">Hasta</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> </FormItem> )}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <FormLabel className="text-base font-medium flex items-center gap-2 mb-2"><CalendarDays className="w-5 h-5"/>Períodos Vacacionales</FormLabel>
                                <div className="space-y-2 rounded-md border p-4">
                                    {vacations.length > 0 ? (
                                        <ul className="space-y-2">
                                            {vacations.map((vac, index) => (
                                                <li key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                                    <span>{format(parseISO(vac.from), 'dd/MM/yy', {locale: es})} - {format(parseISO(vac.to), 'dd/MM/yy', {locale: es})}</span>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveVacation(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-sm text-muted-foreground text-center py-2">No hay vacaciones definidas.</p>}
                                    
                                    <Separator className="my-2"/>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button id="date" variant={"outline"} className={cn("flex-1 justify-start text-left font-normal", !newVacation && "text-muted-foreground" )}>
                                                    <span className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        <span>
                                                            {newVacation?.from ? 
                                                                (newVacation.to ? 
                                                                    `${format(newVacation.from, "LLL dd, y", { locale: es })} - ${format(newVacation.to, "LLL dd, y", { locale: es })}` 
                                                                    : format(newVacation.from, "LLL dd, y", { locale: es })) 
                                                                : 'Elige un rango'}
                                                        </span>
                                                    </span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarPicker initialFocus mode="range" defaultMonth={newVacation?.from} selected={newVacation} onSelect={setNewVacation} numberOfMonths={2} locale={es} />
                                            </PopoverContent>
                                        </Popover>
                                        <Button type="button" onClick={handleAddVacation} disabled={!newVacation?.from || !newVacation?.to}><Plus className="w-4 h-4"/> Añadir</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <Card className="shadow-lg">
                          <CardHeader>
                              <CardTitle className="text-2xl font-bold font-headline text-primary">Gestión de Datos</CardTitle>
                              <CardDescription>Crea o restaura una copia de seguridad y gestiona tu contraseña.</CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-4">
                              <div className="flex flex-col md:flex-row gap-4">
                                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsExportConfirmOpen(true)}><Download className="mr-2 h-4 w-4" />Exportar Copia</Button>
                                  <Button type="button" variant="outline" className="w-full" onClick={() => importInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Importar Copia</Button>
                                  <Input type="file" accept=".json" className="hidden" ref={importInputRef} onChange={handleImportData}/>
                                  <Button type="button" variant="secondary" className="w-full" onClick={() => setIsChangePasswordOpen(true)}><KeyRound className="mr-2 h-4 w-4" />Cambiar Contraseña</Button>
                              </div>
                              <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>¡Atención!</AlertTitle><AlertDescription>El archivo de copia de seguridad contiene datos sensibles no encriptados. Guárdalo en un lugar seguro y privado.</AlertDescription></Alert>
                          </CardContent>
                      </Card>
                      <div className="flex items-center justify-center">
                         <Button type="submit" className="w-full lg:w-auto h-12 px-10" disabled={!form.formState.isDirty}>
                            <Save className="mr-2 h-5 w-5" />
                            Guardar Todos los Cambios
                        </Button>
                      </div>
                    </div>
              </form>
            </Form>
        </div>
      </main>
    </div>
    <PasswordConfirmationDialog isOpen={isExportConfirmOpen} onOpenChange={setIsExportConfirmOpen} onConfirm={handleExportConfirmed} title="Confirmar Exportación" description="Por seguridad, introduce tu contraseña para descargar la copia de seguridad."/>
    <ChangePasswordDialog isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}/>
    </>
  );
}
