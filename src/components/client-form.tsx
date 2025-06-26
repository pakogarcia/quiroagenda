
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Client } from '@/lib/types';

const createClientSchema = (allClients: Client[], editingClientId?: string) => 
  z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
    phone: z.string().min(9, { message: 'Por favor, introduce un número de teléfono válido.' }),
  }).superRefine((data, ctx) => {
    const phoneExists = allClients.some(
      (c) => c.phone === data.phone && c.id !== editingClientId
    );
    if (phoneExists) {
      ctx.addIssue({
        code: 'custom',
        message: 'Este número de teléfono ya está registrado.',
        path: ['phone'],
      });
    }
  });

const baseSchema = z.object({
  name: z.string(),
  lastName: z.string(),
  phone: z.string(),
});
type ClientFormValues = z.infer<typeof baseSchema>;

type ClientFormProps = {
  onSubmit: (data: Omit<Client, 'id'>) => void;
  client?: Client;
  allClients: Client[];
};

export function ClientForm({ onSubmit, client, allClients }: ClientFormProps) {
  const clientSchema = createClientSchema(allClients, client?.id);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      lastName: client?.lastName || '',
      phone: client?.phone || '+34 ',
    },
  });

  const handleSubmit = (values: ClientFormValues) => {
    onSubmit({
      name: values.name,
      lastName: values.lastName,
      phone: values.phone,
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
              <FormLabel>Nombre del Cliente</FormLabel>
              <FormControl>
                <Input placeholder="p. ej., Ana" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellidos del Cliente</FormLabel>
              <FormControl>
                <Input placeholder="p. ej., Pérez García" {...field} />
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
              <FormLabel>Teléfono del Cliente</FormLabel>
              <FormControl>
                <Input placeholder="+34 123 456 789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{client ? 'Actualizar Cliente' : 'Crear Cliente'}</Button>
      </form>
    </Form>
  );
}
