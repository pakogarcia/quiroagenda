
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { BusinessProfile } from '@/lib/types';
import { Building, Phone, MapPin, Instagram, Facebook, Link as LinkIcon } from 'lucide-react';
import { SplashScreen } from '@/components/layout/splash-screen';
import { Separator } from '@/components/ui/separator';

const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre del negocio es obligatorio.'),
  address: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().url().or(z.literal('')).optional(),
  facebook: z.string().url().or(z.literal('')).optional(),
  tiktok: z.string().url().or(z.literal('')).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      instagram: '',
      facebook: '',
      tiktok: '',
    },
  });

  React.useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        const profileData: BusinessProfile = JSON.parse(storedProfile);
        form.reset(profileData);
      }
    } catch (error) {
      console.error('Failed to load profile.', error);
    }
    setIsClient(true);
  }, [form]);

  const onSubmit = (data: ProfileFormValues) => {
    try {
      const profileToSave: BusinessProfile = {
          name: data.name,
          address: data.address || '',
          phone: data.phone || '',
          instagram: data.instagram || undefined,
          facebook: data.facebook || undefined,
          tiktok: data.tiktok || undefined,
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileToSave));
      toast({
        title: 'Perfil guardado',
        description: 'La información de tu negocio ha sido actualizada.',
      });
    } catch (error) {
      console.error('Failed to save profile.', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la información de tu negocio.',
      });
    }
  };

  if (!isClient) {
    return <SplashScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline text-primary">¿Quién eres?</CardTitle>
            <CardDescription>
              Completa la información de tu negocio. Se usará para personalizar los mensajes automáticos y futuras integraciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
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
                </div>

                <Separator />

                <div className="space-y-4">
                     <h3 className="text-lg font-medium text-primary">Redes Sociales</h3>
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
                </div>


                <Button type="submit" className="w-full">
                  Guardar Información
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
