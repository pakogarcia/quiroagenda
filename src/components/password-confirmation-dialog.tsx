
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { verifyPassword } from './password-gate';
import { Eye, EyeOff } from 'lucide-react';

const HASH_KEY = 'quiroagenda_pwd_hash';

const passwordSchema = z.object({
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

type PasswordConfirmationDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
};

export function PasswordConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
}: PasswordConfirmationDialogProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    const storedHash = localStorage.getItem(HASH_KEY);
    if (!storedHash) {
      toast({
        variant: 'destructive',
        title: 'Error de seguridad',
        description: 'No se ha encontrado ninguna contraseña local configurada.',
      });
      return;
    }

    const isValid = await verifyPassword(values.password, storedHash);

    if (isValid) {
      onConfirm();
    } else {
      toast({
        variant: 'destructive',
        title: 'Contraseña incorrecta',
        description: 'La contraseña que has introducido no es correcta.',
      });
      form.reset();
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePasswordSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
