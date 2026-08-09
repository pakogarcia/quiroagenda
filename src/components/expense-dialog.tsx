'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Receipt, Plus } from 'lucide-react';
import { useAppData } from '@/context/app-data-context';
import { useToast } from '@/hooks/use-toast';
import type { Expense } from '@/lib/types';

type ExpenseDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ExpenseDialog({ isOpen, onOpenChange }: ExpenseDialogProps) {
    const { setExpenses } = useAppData();
    const { toast } = useToast();

    const [concept, setConcept] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const [dateStr, setDateStr] = React.useState(() => new Date().toISOString().substring(0, 10));
    const [notes, setNotes] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const numAmount = parseFloat(amount);
        if (!concept.trim()) {
            toast({ variant: 'destructive', title: 'Campo obligatorio', description: 'Por favor introduce el concepto del gasto.' });
            return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            toast({ variant: 'destructive', title: 'Importe no válido', description: 'Por favor introduce un importe mayor que 0.' });
            return;
        }

        const newExpense: Expense = {
            id: `exp_${Date.now()}`,
            concept: concept.trim(),
            amount: numAmount,
            date: new Date(dateStr),
            notes: notes.trim() || undefined,
        };

        setExpenses(prev => [newExpense, ...prev]);

        toast({
            title: 'Gasto registrado',
            description: `Se ha registrado el gasto "${newExpense.concept}" por ${newExpense.amount.toFixed(2)}€.`,
        });

        // Reset and close
        setConcept('');
        setAmount('');
        setDateStr(new Date().toISOString().substring(0, 10));
        setNotes('');
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Receipt className="w-5 h-5" /> Registrar Nuevo Gasto
                    </DialogTitle>
                    <DialogDescription>
                        Añade un gasto o egreso para descontarlo en tu informe contable.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="concept">Concepto del Gasto *</Label>
                        <Input
                            id="concept"
                            placeholder="Ej. Alquiler de local, Material sanitario, Luz..."
                            value={concept}
                            onChange={(e) => setConcept(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Importe (€) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={dateStr}
                                onChange={(e) => setDateStr(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas / Observaciones (Opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Detalles adicionales del gasto..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="destructive">
                            <Plus className="w-4 h-4 mr-1" /> Registrar Gasto
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
