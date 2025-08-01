'use client';

import { ShieldAlert, Copy } from 'lucide-react';
import type { BusinessProfile } from '@/lib/types';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';

const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

type InvalidLicenseProps = {
  licenseKey: string | null;
};

export function InvalidLicense({ licenseKey }: InvalidLicenseProps) {
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    try {
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }
    } catch (error) {
        console.error("Failed to load profile for invalid license screen.", error);
    }
  }, []);
  
  const handleCopy = () => {
    if (licenseKey) {
        navigator.clipboard.writeText(licenseKey);
        toast({
            title: "Copiado",
            description: "El código de licencia ha sido copiado al portapapeles."
        })
    }
  }

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-4 text-center">
      <div className="flex flex-col items-center gap-4 max-w-md">
        <ShieldAlert className="h-24 w-24 text-destructive" />
        <h1 className="text-3xl font-bold font-headline text-destructive tracking-wider">
          Licencia no Válida o Caducada
        </h1>
        <p className="text-muted-foreground">
          El acceso a <span className="font-semibold text-primary">{profile?.name || 'QuiroAgenda'}</span> ha sido restringido. Por favor, contacta con el administrador para activar tu licencia.
        </p>

        {licenseKey && (
          <div className="mt-4 w-full">
            <p className="text-sm text-muted-foreground">Proporciona el siguiente código de licencia:</p>
            <div className="mt-2 flex items-center justify-center gap-2 w-full">
                 <pre className="p-2 bg-muted rounded-md text-muted-foreground overflow-x-auto w-full max-w-xs">
                     <code>{licenseKey}</code>
                 </pre>
                 <Button variant="outline" size="icon" onClick={handleCopy} title="Copiar código">
                    <Copy className="h-4 w-4" />
                 </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
