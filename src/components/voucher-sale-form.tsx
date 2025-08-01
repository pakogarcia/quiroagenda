
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
import { Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/context/app-data-context';

const VOUCHER_SALES_STORAGE_KEY = 'quiroagenda_voucher_sales';

const voucherSaleSchema = z.object({
  clientId: z.string({ required_error: 'Debes seleccionar un cliente.' }),
  sessions: z.coerce.number().min(1, 'El bono debe tener al menos 1 sesión.'),
  amount: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  paymentMethod: z.enum(['cash', 'bizum', 'paypal'], { required_error: 'Debes seleccionar un método de pago.' }),
});

type VoucherSaleFormValues = z.infer<typeof voucherSaleSchema>;

type VoucherSaleFormProps = {
  onVoucherSold: () => void;
  closeDialog: () => void;
};

export function VoucherSaleForm({ onVoucherSold, closeDialog }: VoucherSaleFormProps) {
  const { clients, setClients } = useAppData();
  const { toast } = useToast();

  const form = useForm<VoucherSaleFormValues>({
    resolver: zodResolver(voucherSaleSchema),
    defaultValues: {
      clientId: '',
      sessions: 5,
      amount: undefined, // Let's keep it undefined and handle the value in the input
      paymentMethod: 'cash',
    },
  });

  const handleSubmit = (values: VoucherSaleFormValues) => {
    const selectedClient = clients.find(c => c.id === values.clientId);
    if (!selectedClient) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cliente no encontrado.' });
      return;
    }

    // 1. Create the new voucher for the client
    const newVoucher = {
      sessions: values.sessions,
      totalSessions: values.sessions,
      price: values.amount,
    };
    
    // For now, we will replace the old voucher. A more complex system could allow multiple vouchers.
    const updatedClient: Client = { ...selectedClient, voucher: newVoucher };

    // 2. Save the updated client list
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
    
    // 3. Create and save the voucher sale transaction
    const newSale = {
        id: crypto.randomUUID(),
        clientId: values.clientId,
        clientName: `${selectedClient.name} ${selectedClient.lastName}`,
        date: new Date(),
        sessions: values.sessions,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
    };

    const existingSales = JSON.parse(localStorage.getItem(VOUCHER_SALES_STORAGE_KEY) || '[]');
    localStorage.setItem(VOUCHER_SALES_STORAGE_KEY, JSON.stringify([...existingSales, newSale]));

    toast({
        title: 'Bono Vendido',
        description: `Se ha vendido un bono de ${values.sessions} sesiones a ${selectedClient.name}.`
    });

    onVoucherSold();
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
                <FormLabel>Nº de Sesiones</FormLabel>
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
