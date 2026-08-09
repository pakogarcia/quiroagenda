
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SplashScreen } from './layout/splash-screen';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';

const HASH_KEY = 'quiroagenda_pwd_hash';

// --- Crypto Helper Functions (using browser's SubtleCrypto) ---

// Converts a string to an ArrayBuffer
function str2ab(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Creates a SHA-256 hash of a string
export async function createHash(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Verifies a password against a stored hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await createHash(password);
  return newHash === hash;
}


// --- Zod Schemas for Validation ---

const createPasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  password: z.string().min(1, 'Por favor, introduce tu contraseña.'),
});

type CreatePasswordFormValues = z.infer<typeof createPasswordSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;


// --- Main PasswordGate Component ---

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<'loading' | 'unlocked' | 'locked' | 'setup'>('loading');
  const [storedHash, setStoredHash] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const hash = localStorage.getItem(HASH_KEY);
      setStoredHash(hash);
      if (hash) {
        setStatus('locked');
      } else {
        setStatus('setup');
      }
    } catch (error) {
      console.error('Could not access localStorage', error);
      // If localStorage is unavailable, we can't proceed.
      // In a real app, you might show an error message.
      // For now, we'll just unlock to not block development.
      setStatus('unlocked');
    }
  }, []);

  const handlePasswordSet = (hash: string) => {
    localStorage.setItem(HASH_KEY, hash);
    setStoredHash(hash);
    setStatus('unlocked');
  };

  const handleLoginSuccess = () => {
    setStatus('unlocked');
  };

  if (status === 'loading') {
    return <SplashScreen />;
  }

  if (status === 'unlocked') {
    return <>{children}</>;
  }
  
  if (status === 'setup') {
    return <CreatePasswordScreen onPasswordSet={handlePasswordSet} />;
  }
  
  if (status === 'locked' && storedHash) {
    return <LoginScreen storedHash={storedHash} onLoginSuccess={handleLoginSuccess} />;
  }

  // Fallback, should not be reached
  return <SplashScreen />;
}


// --- Sub-components for Setup and Login ---

function CreatePasswordScreen({ onPasswordSet }: { onPasswordSet: (hash: string) => void }) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  const form = useForm<CreatePasswordFormValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: CreatePasswordFormValues) => {
    try {
      const hash = await createHash(data.password);
      onPasswordSet(hash);
      toast({
        title: '¡Contraseña establecida!',
        description: 'Has protegido el acceso a tu aplicación.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la contraseña. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };
  
  return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold mt-2">Crea tu Contraseña de Acceso</CardTitle>
                <CardDescription>
                  Esta contraseña protegerá el acceso a la aplicación en este navegador. Guárdala en un lugar seguro.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Confirmar Contraseña</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  Guardar Contraseña y Entrar
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
  );
}


function LoginScreen({ storedHash, onLoginSuccess }: { storedHash: string; onLoginSuccess: () => void }) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    const isValid = await verifyPassword(data.password, storedHash);
    if (isValid) {
      onLoginSuccess();
    } else {
      toast({
        title: 'Contraseña Incorrecta',
        description: 'La contraseña que has introducido no es correcta.',
        variant: 'destructive',
      });
      form.reset();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="text-center">
               <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    <KeyRound className="h-10 w-10 text-primary" />
                </div>
              <CardTitle className="text-2xl font-bold mt-2">Bienvenido de Nuevo</CardTitle>
              <CardDescription>Introduce tu contraseña para acceder a la aplicación.</CardDescription>
            </CardHeader>
            <CardContent>
               <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    Desbloquear
                </Button>
                <p className="text-xs text-muted-foreground text-center px-4">
                    Si has olvidado la contraseña, deberás borrar los datos de navegación para restablecer el acceso.
                </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
