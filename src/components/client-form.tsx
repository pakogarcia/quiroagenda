
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Client, Voucher } from '@/lib/types';
import { Separator } from './ui/separator';
import { Gift, Trash2, FileText, Cake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { useAppData } from '@/context/app-data-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import React from 'react';

const createClientSchema = (allClients: Client[], editingClientId?: string) => 
  z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
    phone: z.string().min(9, { message: 'Por favor, introduce un número de teléfono válido.' }),
    birthDate: z.string().optional(),
    details: z.string().optional(),
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
};

export function ClientForm({ onSubmit, client }: ClientFormProps) {
  const { clients } = useAppData();
  const { toast } = useToast();
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = React.useState(false);

  const clientSchema = createClientSchema(clients, client?.id);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      lastName: client?.lastName || '',
      phone: client?.phone || '+34 ',
      birthDate: client?.birthDate || '',
      details: client?.details || '',
      voucherSessions: client?.voucher?.totalSessions || undefined,
      voucherPrice: client?.voucher?.price || undefined,
    },
  });

  const handleSubmit = (values: ClientFormValues) => {
    let voucher: Voucher | undefined;
    
    if (client?.voucher && client.voucher.sessions > 0) {
        voucher = client.voucher;
    } else if (values.voucherSessions && values.voucherSessions > 0) {
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
      birthDate: values.birthDate,
      details: values.details,
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
      birthDate: form.getValues('birthDate'),
      details: form.getValues('details'),
      voucher: undefined,
    });
     toast({
        title: "Bono eliminado",
        description: "Se ha eliminado el bono del cliente.",
        variant: "destructive"
    });
    setIsRemoveConfirmOpen(false);
  };
  
  const currentVoucher = client?.voucher;
  const hasActiveVoucher = !!currentVoucher && currentVoucher.sessions > 0;

  return (
    <>
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
             <div className="grid grid-cols-2 gap-4">
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
                <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><Cake className="w-4 h-4"/> Fecha de Nacimiento</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-2"><FileText className="w-4 h-4" /> Detalles / Notas</FormLabel>
                <FormControl>
                    <Textarea placeholder="Alergia a los aceites de frutos secos, prefiere música suave, etc." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <Separator />
            
            <div>
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4"><Gift /> Gestión de Bono</h3>
            
            {hasActiveVoucher ? (
                <div className="mb-4 p-3 bg-muted/50 rounded-md text-sm">
                    <p>Este cliente tiene un bono activo con <span className="font-bold">{currentVoucher.sessions} de {currentVoucher.totalSessions}</span> sesiones restantes.</p>
                    <p className='mt-1'>La venta de un nuevo bono reemplazará al actual.</p>
                    <Button type="button" variant="destructive" size="sm" className="mt-2" onClick={() => setIsRemoveConfirmOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Bono Actual
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="voucherSessions"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nº de Sesiones</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="p. ej., 5" {...field} value={field.value || ''}/>
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
                        <Input type="number" placeholder="p. ej., 150" {...field} value={field.value || ''} />
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
        <AlertDialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar Bono?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará el bono activo del cliente, incluyendo las sesiones restantes.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveVoucher} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
