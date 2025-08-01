
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
import { Building, Phone, MapPin, Instagram, Facebook, Link as LinkIcon, Youtube, Image as ImageIcon, Globe, Download, Upload, AlertTriangle, KeyRound, Save } from 'lucide-react';
import { SplashScreen } from '@/components/layout/splash-screen';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAppData } from '@/context/app-data-context';
import { PasswordConfirmationDialog } from '@/components/password-confirmation-dialog';
import { ChangePasswordDialog } from '@/components/change-password-dialog';

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
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { profile, setProfile, exportData, importData, isLoading } = useAppData();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      logo: '',
      website: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      youtube: '',
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

  const onSubmit = (data: ProfileFormValues) => {
    try {
      const profileToSave: BusinessProfile = {
          name: data.name,
          address: data.address || '',
          phone: data.phone || '',
          logo: data.logo || undefined,
          website: data.website || undefined,
          instagram: data.instagram || undefined,
          facebook: data.facebook || undefined,
          tiktok: data.tiktok || undefined,
          youtube: data.youtube || undefined,
      };
      setProfile(profileToSave);
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

  return (
    <>
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-6xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold font-headline text-primary">¿Quién eres?</CardTitle>
                      <CardDescription>
                        Completa la información de tu negocio.
                      </CardDescription>
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
                        
                        <FormField
                            control={form.control}
                            name="logo"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center justify-center gap-2"><ImageIcon className="w-4 h-4" />Logotipo (.jpg)</FormLabel>
                                <FormControl>
                                    <div>
                                        <Input
                                            type="file"
                                            accept=".jpg, .jpeg"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                        />
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="w-full"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {logoPreview ? 'Cambiar Logotipo' : 'Seleccionar Logotipo'}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Building className="w-4 h-4" />Nombre del Negocio</FormLabel>
                                <FormControl>
                                <Input placeholder="p. ej., Centro de Masajes Zen" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4" />Situación</FormLabel>
                                <FormControl>
                                <Input placeholder="p. ej., Calle Falsa 123, Ciudad" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4" />Teléfono de Contacto</FormLabel>
                                <FormControl>
                                <Input placeholder="+34 987 654 321" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                  </Card>
                  
                   <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold font-headline text-primary">Web y Redes Sociales</CardTitle>
                      <CardDescription>
                        Añade tus enlaces para que aparezcan en los mensajes.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Globe className="w-4 h-4" />Página Web</FormLabel>
                                <FormControl>
                                <Input placeholder="https://tu-pagina-web.com" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="instagram"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Instagram className="w-4 h-4" />Instagram</FormLabel>
                                <FormControl>
                                <Input placeholder="https://instagram.com/tu_usuario" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="facebook"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Facebook className="w-4 h-4" />Facebook</FormLabel>
                                <FormControl>
                                <Input placeholder="https://facebook.com/tu_pagina" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tiktok"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><LinkIcon className="w-4 h-4" />TikTok</FormLabel>
                                <FormControl>
                                <Input placeholder="https://tiktok.com/@tu_usuario" {...field} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="youtube"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Youtube className="w-4 h-4" />YouTube</FormLabel>
                                <FormControl>
                                <Input placeholder="https://youtube.com/c/tu_canal" {...field} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <Button type="submit" className="w-full" disabled={!form.formState.isDirty}>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Información
                        </Button>
                    </CardContent>
                  </Card>

                   <div className="lg:col-span-2">
                      <Card className="shadow-lg">
                          <CardHeader>
                              <CardTitle className="text-2xl font-bold font-headline text-primary">Gestión de Datos</CardTitle>
                              <CardDescription>
                                  Crea o restaura una copia de seguridad y gestiona tu contraseña.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-4">
                              <div className="flex flex-col md:flex-row gap-4">
                                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsExportConfirmOpen(true)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Exportar Copia
                                  </Button>
                                  <Button type="button" variant="outline" className="w-full" onClick={() => importInputRef.current?.click()}>
                                      <Upload className="mr-2 h-4 w-4" />
                                      Importar Copia
                                  </Button>
                                  <Input 
                                      type="file"
                                      accept=".json"
                                      className="hidden"
                                      ref={importInputRef}
                                      onChange={handleImportData}
                                  />
                                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsChangePasswordOpen(true)}>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Cambiar Contraseña
                                  </Button>
                              </div>
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>¡Atención!</AlertTitle>
                                <AlertDescription>
                                  El archivo de copia de seguridad contiene datos sensibles no encriptados. Guárdalo en un lugar seguro y privado.
                                </AlertDescription>
                              </Alert>
                          </CardContent>
                      </Card>
                    </div>
              </form>
            </Form>
        </div>
      </main>
    </div>
    <PasswordConfirmationDialog
        isOpen={isExportConfirmOpen}
        onOpenChange={setIsExportConfirmOpen}
        onConfirm={handleExportConfirmed}
        title="Confirmar Exportación"
        description="Por seguridad, introduce tu contraseña para descargar la copia de seguridad."
    />
    <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
    />
    </>
  );
}
