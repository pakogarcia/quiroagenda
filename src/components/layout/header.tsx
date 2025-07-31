
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CalendarDays, Leaf, Users, Calculator, Info, BookOpen, Tag } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BusinessProfile } from '@/lib/types';

const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

export function AppHeader({ className }: { className?: string }) {
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);

  const loadProfile = () => {
     try {
        const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Failed to load profile for header.", error);
        setProfile(null);
      }
  }

  React.useEffect(() => {
    loadProfile();
    
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === PROFILE_STORAGE_KEY || event.type === 'storage') {
            loadProfile();
        }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  return (
    <header className={cn(
      "flex flex-wrap items-center justify-between p-4 border-b bg-card gap-x-4 gap-y-2", 
      className
    )}>
      <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
        {profile?.logo ? (
          <Image src={profile.logo} alt="Logo" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <Leaf className="h-8 w-8" />
        )}
        <h1 className="text-xl md:text-2xl font-bold font-headline">{profile?.name || 'QuiroAgenda'}</h1>
      </Link>
      <nav className="flex items-center gap-1 md:gap-2 flex-wrap justify-start md:justify-end">
        <Link href="/quien-eres">
          <Button variant="outline" size="sm">
            <Info className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Quién eres</span>
          </Button>
        </Link>
         <Link href="/">
           <Button variant="outline" size="sm">
            <CalendarDays className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Agenda</span>
          </Button>
         </Link>
        <Link href="/clients">
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Clientes</span>
          </Button>
        </Link>
        <Link href="/servicios">
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Servicios</span>
          </Button>
        </Link>
        <Link href="/contabilidad">
          <Button variant="outline" size="sm">
            <Calculator className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Contabilidad</span>
          </Button>
        </Link>
        <Link href="/manual">
          <Button variant="outline" size="sm">
            <BookOpen className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Ayuda</span>
          </Button>
        </Link>
      </nav>
    </header>
  );
}
