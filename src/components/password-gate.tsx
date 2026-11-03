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
import { usePathname } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const HASH_KEY = 'quiroagenda_pwd_hash';
const CLOUD_SETTINGS_DOC = doc(db, 'settings', 'security');

// Converts a string to an ArrayBuffer
function str2ab(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Creates a SHA-256 hash of a string
export async function createHash(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Verifies a password against a stored hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await createHash(password);
  return newHash === hash;
}

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

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = React.useState<'loading' | 'unlocked' | 'locked' | 'setup'>('loading');
  const [storedHash, setStoredHash] = React.useState<string | null>(null);

  const isPublicRoute = (
    pathname === '/' || 
    pathname?.startsWith('/reservas') || 
    pathname?.startsWith('/mi-cuenta') || 
    pathname?.startsWith('/api')
  ) && !pathname?.startsWith('/admin');

  React.useEffect(() => {
    if (isPublicRoute) {
      setStatus('unlocked');
      return;
    }

    const checkPassword = async () => {
      try {
        // 1. Check local hash first (instant)
        let hash = localStorage.getItem(HASH_KEY);

        // 2. Also check Cloud Firestore (so any new device knows the password immediately)
        try {
          const cloudSnap = await getDoc(CLOUD_SETTINGS_DOC);
          if (cloudSnap.exists() && cloudSnap.data()?.passwordHash) {
            hash = cloudSnap.data().passwordHash;
            localStorage.setItem(HASH_KEY, hash as string);
          }
        } catch (cloudErr) {
          console.warn("Could not check cloud password:", cloudErr);
        }

        setStoredHash(hash);
        if (hash) {
          setStatus('locked');
        } else {
          setStatus('setup');
        }
      } catch (error) {
        console.error('Could not access password check', error);
        // Fail-safe: ante error de red, mantener bloqueado por seguridad
        setStatus('locked');
      }
    };

    checkPassword();
  }, [isPublicRoute]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  const handlePasswordSet = async (hash: string) => {
    localStorage.setItem(HASH_KEY, hash);
    setStoredHash(hash);
    setStatus('unlocked');

    // Save password hash to Cloud Firestore for cross-device sync
    try {
      await setDoc(CLOUD_SETTINGS_DOC, {
        passwordHash: hash,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Could not save password to Firestore:", err);
    }
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

  return <SplashScreen />;
}

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
        title: 'Contraseña configurada',
        description: 'Tu agenda ahora está protegida en todos tus dispositivos.',
      });
    } catch (error) {
      console.error('Failed to set password:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la contraseña. Inténtalo de nuevo.',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold">Configurar Contraseña de Acceso</CardTitle>
          <CardDescription>
            Crea la contraseña de administración para acceder a tu panel de QuiroAgenda desde cualquier dispositivo.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
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
                     <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repite la contraseña"
                          {...field}
                        />
                      </FormControl>
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Establecer Contraseña y Entrar
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
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const isValid = await verifyPassword(data.password, storedHash);
      if (isValid) {
        onLoginSuccess();
      } else {
        toast({
          variant: 'destructive',
          title: 'Acceso denegado',
          description: 'La contraseña que has introducido es incorrecta.',
        });
        form.reset();
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al verificar la contraseña.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold">Panel QuiroAgenda</CardTitle>
          <CardDescription>Introduce tu contraseña de administración para acceder.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Tu contraseña"
                          {...field}
                          autoFocus
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Comprobando...' : 'Entrar a la Agenda'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
