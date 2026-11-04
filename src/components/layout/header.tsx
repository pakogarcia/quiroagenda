'use client';

import * as React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CalendarDays, Leaf, Users, Calculator, Info, BookOpen, Tag, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BusinessProfile } from '@/lib/types';

const PROFILE_STORAGE_KEY = 'quiroagenda_profile';

const navItems = [
  // Fila 1 en móvil (4 acciones del día a día)
  {
    href: '/',
    mobileLabel: 'Ver Web',
    desktopLabel: 'Ver Web',
    icon: Sparkles,
    external: true,
    gradient: true,
  },
  {
    href: '/admin',
    mobileLabel: 'Agenda',
    desktopLabel: 'Agenda',
    icon: CalendarDays,
  },
  {
    href: '/clients',
    mobileLabel: 'Clientes',
    desktopLabel: 'Clientes',
    icon: Users,
  },
  {
    href: '/contabilidad',
    mobileLabel: 'Cobros',
    desktopLabel: 'Contabilidad',
    icon: Calculator,
  },
  // Fila 2 en móvil (4 configuraciones y herramientas)
  {
    href: '/servicios',
    mobileLabel: 'Servicios',
    desktopLabel: 'Servicios',
    icon: Tag,
  },
  {
    href: '/comunicaciones',
    mobileLabel: 'Mensajes',
    desktopLabel: 'Comunicaciones',
    icon: Send,
  },
  {
    href: '/quien-eres',
    mobileLabel: 'Perfil',
    desktopLabel: 'Quién eres',
    icon: Info,
  },
  {
    href: '/manual',
    mobileLabel: 'Ayuda',
    desktopLabel: 'Ayuda',
    icon: BookOpen,
  },
];

export function AppHeader({ className }: { className?: string }) {
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const pathname = usePathname();

  const loadProfile = () => {
    try {
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to load profile for header.', error);
      setProfile(null);
    }
  };

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
      "flex flex-col md:flex-row items-stretch md:items-center justify-between p-3 md:p-4 border-b bg-card gap-3 md:gap-4", 
      className
    )}>
      {/* Logotipo y Título de QuiroAgenda */}
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
          {profile?.logo ? (
            <Image src={profile.logo} alt="Logo" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <Leaf className="h-8 w-8" />
          )}
          <h1 className="text-xl md:text-2xl font-bold font-headline">{profile?.name || 'QuiroAgenda'}</h1>
        </Link>
      </div>

      {/* Barra de accesos: Cuadrícula simétrica 4x2 en móvil, fila horizontal en ordenador */}
      <nav className="grid grid-cols-4 gap-1.5 w-full md:w-auto md:flex md:items-center md:gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              className="w-full md:w-auto"
            >
              <Button
                variant={item.gradient ? 'default' : isActive ? 'secondary' : 'outline'}
                size="sm"
                className={cn(
                  "w-full h-12 flex flex-col items-center justify-center p-1 gap-1 text-[10px] font-semibold rounded-xl transition-all shadow-xs",
                  "md:h-9 md:flex-row md:px-3 md:py-2 md:gap-1.5 md:text-xs md:w-auto md:rounded-md",
                  item.gradient && "bg-gradient-to-r from-amber-700 to-rose-700 hover:from-amber-800 hover:to-rose-800 text-white font-bold shadow-sm border-0",
                  isActive && !item.gradient && "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="leading-none tracking-tight md:hidden truncate max-w-full">{item.mobileLabel}</span>
                <span className="hidden md:inline">{item.desktopLabel}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
