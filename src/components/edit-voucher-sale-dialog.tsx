
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { type VoucherSale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Edit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const editVoucherSaleSchema = z.object({
  paymentMethod: z.enum(['cash', 'bizum', 'paypal']),
  amount: z.coerce.number().min(0, 'El importe no puede ser negativo.'),
});

type EditVoucherSaleFormValues = z.infer<typeof editVoucherSaleSchema>;

type EditVoucherSaleDialogProps = {
  sale: VoucherSale | null;
  onOpenChange: (isOpen: boolean) => void;
  onVoucherSaleUpdated: (updatedSale: VoucherSale) => void;
};

export function EditVoucherSaleDialog({ sale, onOpenChange, onVoucherSaleUpdated }: EditVoucherSaleDialogProps) {
  const { toast } = useToast();

  const form = useForm<EditVoucherSaleFormValues>({
    resolver: zodResolver(editVoucherSaleSchema),
    defaultValues: {
      amount: sale?.amount || 0,
      paymentMethod: sale?.paymentMethod || 'cash',
    },
  });

  React.useEffect(() => {
    if (sale) {
      form.reset({
        amount: sale.amount,
        paymentMethod: sale.paymentMethod,
      });
    }
  }, [sale, form]);

  const handleSaleUpdate = (values: EditVoucherSaleFormValues) => {
    if (!sale) return;

    const updatedSale: VoucherSale = {
      ...sale,
      amount: values.amount,
      paymentMethod: values.paymentMethod,
    };
    
    onVoucherSaleUpdated(updatedSale);
    
    toast({
      title: 'Venta Actualizada',
      description: 'Se ha actualizado la información de la venta del bono.',
    });
    onOpenChange(false);
  };

  if (!sale) return null;

  return (
    <Dialog open={!!sale} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5"/> Editar Venta de Bono</DialogTitle>
          <DialogDescription>
            Modifica el importe o el método de pago de esta transacción.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atención</AlertTitle>
            <AlertDescription>
                Cambiar estos valores solo afecta al registro contable. No modifica las sesiones del bono del cliente.
            </AlertDescription>
        </Alert>

        <Form {...form}>
          <form id="edit-voucher-sale-form" onSubmit={form.handleSubmit(handleSaleUpdate)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importe Abonado (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="cash" /></FormControl>
                        <FormLabel className="font-normal">Efectivo</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="bizum" /></FormControl>
                        <FormLabel className="font-normal">Bizum</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="paypal" /></FormControl>
                        <FormLabel className="font-normal">PayPal</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        
        <DialogFooter className="gap-2 sm:justify-end pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="edit-voucher-sale-form">Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
