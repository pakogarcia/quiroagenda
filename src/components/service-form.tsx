
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const serviceSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  duration: z.coerce.number().min(1, { message: 'La duración debe ser de al menos 1 minuto.' }),
  price: z.coerce.number().min(0, { message: 'El precio no puede ser negativo.' }),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

type ServiceFormProps = {
  onSubmit: (data: Omit<Service, 'id'>) => void;
  service?: Service;
};

export function ServiceForm({ onSubmit, service }: ServiceFormProps) {
  const { toast } = useToast();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name || '',
      duration: service?.duration || 60,
      price: service?.price || 50,
    },
  });

  const handleSubmit = (values: ServiceFormValues) => {
    onSubmit(values);
    toast({
        title: service ? "Servicio actualizado" : "Servicio creado",
        description: "La información del servicio se ha guardado correctamente.",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Servicio</FormLabel>
              <FormControl>
                <Input placeholder="p. ej., Masaje Relajante" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Duración (minutos)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="p. ej., 60" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Precio (€)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" placeholder="p. ej., 50" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full">{service ? 'Actualizar Servicio' : 'Crear Servicio'}</Button>
      </form>
    </Form>
  );
}
