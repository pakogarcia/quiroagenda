
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VoucherSaleForm } from './voucher-sale-form';
import { ShoppingCart } from 'lucide-react';

type VoucherSaleDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function VoucherSaleDialog({ isOpen, onOpenChange }: VoucherSaleDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'><ShoppingCart className='w-5 h-5'/>Vender Nuevo Bono</DialogTitle>
          <DialogDescription>
            Selecciona el cliente y define los detalles del bono que se va a comprar.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <VoucherSaleForm 
            closeDialog={() => onOpenChange(false)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

    

    

    