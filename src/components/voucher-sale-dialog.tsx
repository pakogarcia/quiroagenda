
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VoucherSaleForm } from './voucher-sale-form';

type VoucherSaleDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onVoucherSold: () => void;
};

export function VoucherSaleDialog({ isOpen, onOpenChange, onVoucherSold }: VoucherSaleDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vender Nuevo Bono</DialogTitle>
          <DialogDescription>
            Selecciona el cliente y define los detalles del bono que se va a comprar.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <VoucherSaleForm 
            onVoucherSold={onVoucherSold} 
            closeDialog={() => onOpenChange(false)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
