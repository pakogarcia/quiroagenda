'use client';

import * as React from 'react';
import Image from 'next/image';
import { Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BusinessProfile } from '@/lib/types';

const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

export function SplashScreen() {
    const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        try {
            const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (storedProfile) {
                setProfile(JSON.parse(storedProfile));
            }
        } catch (error) {
            console.error("Failed to load profile for splash screen.", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const hasLogo = profile?.logo;
    const businessName = profile?.name || 'QuiroAgenda';

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
        className="flex flex-col items-center gap-4"
      >
        {!isLoading && (
            hasLogo ? (
                <Image 
                    src={profile.logo!} 
                    alt="Business Logo" 
                    width={96} 
                    height={96} 
                    className="h-24 w-24 rounded-full object-cover shadow-md"
                    priority
                />
            ) : (
                <Leaf className="h-24 w-24 text-primary" />
            )
        )}
        
        <h1 className="text-4xl font-bold font-headline text-primary tracking-wider">
          {businessName}
        </h1>

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5}}
        >
            <p className="text-muted-foreground">Cargando aplicación...</p>
        </motion.div>
        
      </motion.div>
    </div>
  );
}
