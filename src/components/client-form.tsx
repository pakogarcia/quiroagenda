
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Client } from '@/lib/types';
import { Separator } from './ui/separator';
import { Gift, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const createClientSchema = (allClients: Client[], editingClientId?: string) => 
  z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
    phone: z.string().min(9, { message: 'Por favor, introduce un número de teléfono válido.' }),
    voucherSessions: z.coerce.number().optional(),
    voucherPrice: z.coerce.number().optional(),
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

type ClientFormValues = z.infer<ReturnType<typeof createClientSchema>>;

type ClientFormProps = {
  onSubmit: (data: Omit<Client, 'id'>) => void;
  client?: Client;
  allClients: Client[];
};

export function ClientForm({ onSubmit, client, allClients }: ClientFormProps) {
  const { toast } = useToast();
  const clientSchema = createClientSchema(allClients, client?.id);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      lastName: client?.lastName || '',
      phone: client?.phone || '+34 ',
      voucherSessions: client?.voucher?.totalSessions || '',
      voucherPrice: client?.voucher?.price || '',
    },
  });

  const handleSubmit = (values: ClientFormValues) => {
    let voucher;
    if (values.voucherSessions && values.voucherSessions > 0) {
        voucher = {
            sessions: values.voucherSessions,
            totalSessions: values.voucherSessions,
            price: values.voucherPrice || 0,
        };
    } else {
      voucher = undefined;
    }

    onSubmit({
      name: values.name,
      lastName: values.lastName,
      phone: values.phone,
      voucher: voucher,
    });

    toast({
        title: client ? "Cliente actualizado" : "Cliente creado",
        description: "La información del cliente se ha guardado correctamente.",
    });
  };
  
  const handleRemoveVoucher = () => {
    form.setValue('voucherSessions', undefined);
    form.setValue('voucherPrice', undefined);
    onSubmit({
      name: form.getValues('name'),
      lastName: form.getValues('lastName'),
      phone: form.getValues('phone'),
      voucher: undefined,
    });
     toast({
        title: "Bono eliminado",
        description: "Se ha eliminado el bono del cliente.",
        variant: "destructive"
    });
  };
  
  const currentVoucher = client?.voucher;

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
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4"><Gift /> Gestión de Bono</h3>
          
          {currentVoucher && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md text-sm">
                <p>Este cliente tiene un bono activo con <span className="font-bold">{currentVoucher.sessions} de {currentVoucher.totalSessions}</span> sesiones restantes.</p>
                <p>Para modificar el bono, debe eliminar el actual y crear uno nuevo.</p>
                 <Button type="button" variant="destructive" size="sm" className="mt-2" onClick={handleRemoveVoucher}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Bono Actual
                </Button>
            </div>
          )}

          {!currentVoucher && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="voucherSessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº de Sesiones</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="p. ej., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="voucherPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio del Bono (€)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="p. ej., 150" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
        
        <Button type="submit" className="w-full">{client ? 'Actualizar Cliente' : 'Crear Cliente'}</Button>
      </form>
    </Form>
  );
}
