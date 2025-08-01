'use client';

import { ShieldAlert } from 'lucide-react';
import type { BusinessProfile } from '@/lib/types';
import * as React from 'react';

const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

export function InvalidLicense() {
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);

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

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <ShieldAlert className="h-24 w-24 text-destructive" />
        <h1 className="text-3xl font-bold font-headline text-destructive tracking-wider">
          Licencia no válida o caducada
        </h1>
        <p className="text-muted-foreground">
          El acceso a <span className="font-semibold text-primary">{profile?.name || 'QuiroAgenda'}</span> ha sido restringido. Por favor, contacta con el soporte o el administrador para renovar tu suscripción y restaurar el acceso.
        </p>
        <p className='text-sm text-muted-foreground mt-4'>
            Gracias por tu comprensión.
        </p>
      </div>
    </div>
  );
}
