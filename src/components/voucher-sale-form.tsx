
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client, Voucher, VoucherSale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/context/app-data-context';

const voucherSaleSchema = z.object({
  clientId: z.string({ required_error: 'Debes seleccionar un cliente.' }),
  sessions: z.coerce.number().min(1, 'El bono debe tener al menos 1 sesión.'),
  amount: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  paymentMethod: z.enum(['cash', 'bizum', 'paypal'], { required_error: 'Debes seleccionar un método de pago.' }),
});

type VoucherSaleFormValues = z.infer<typeof voucherSaleSchema>;

type VoucherSaleFormProps = {
  closeDialog: () => void;
};

export function VoucherSaleForm({ closeDialog }: VoucherSaleFormProps) {
  const { clients, setClients, voucherSales, setVoucherSales } = useAppData();
  const { toast } = useToast();

  const form = useForm<VoucherSaleFormValues>({
    resolver: zodResolver(voucherSaleSchema),
    defaultValues: {
      clientId: '',
      sessions: 5,
      amount: undefined,
      paymentMethod: 'cash',
    },
  });

  const handleSubmit = (values: VoucherSaleFormValues) => {
    const selectedClient = clients.find(c => c.id === values.clientId);
    if (!selectedClient) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cliente no encontrado.' });
      return;
    }

    // 1. Create or update the client's voucher
    const existingVoucher = selectedClient.voucher;
    const updatedVoucher: Voucher = {
        sessions: (existingVoucher?.sessions || 0) + values.sessions,
        totalSessions: (existingVoucher?.totalSessions || 0) + values.sessions,
        price: (existingVoucher?.price || 0) + values.amount,
    };
    
    const updatedClient: Client = { ...selectedClient, voucher: updatedVoucher };
    setClients(prevClients => prevClients.map(c => c.id === updatedClient.id ? updatedClient : c));

    // 2. Create and save the voucher sale transaction
    const newSale: VoucherSale = {
        id: crypto.randomUUID(),
        clientId: values.clientId,
        clientName: `${selectedClient.name} ${selectedClient.lastName}`,
        date: new Date(),
        sessions: values.sessions,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
    };

    setVoucherSales([...voucherSales, newSale]);

    toast({
        title: 'Bono Vendido',
        description: `Se ha vendido un bono de ${values.sessions} sesiones a ${selectedClient.name}.`
    });
    
    closeDialog();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {`${client.name} ${client.lastName}`}
                      {client.voucher && ` (Bono actual: ${client.voucher.sessions} ses.)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="sessions"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nº de Sesiones a Añadir</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="p. ej., 5" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Precio Total (€)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" placeholder="p. ej., 150" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
            <FormItem className="space-y-3">
                <FormLabel>Método de Pago</FormLabel>
                <FormControl>
                <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex items-center space-x-4"
                >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                        <RadioGroupItem value="cash" />
                    </FormControl>
                    <FormLabel className="font-normal">Efectivo</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                        <RadioGroupItem value="bizum" />
                    </FormControl>
                    <FormLabel className="font-normal">Bizum</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                        <RadioGroupItem value="paypal" />
                    </FormControl>
                    <FormLabel className="font-normal">PayPal</FormLabel>
                    </FormItem>
                </RadioGroup>
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={closeDialog}>Cancelar</Button>
            <Button type="submit">Vender Bono</Button>
        </div>
      </form>
    </Form>
  );
}
