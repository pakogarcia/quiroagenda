'use client';

import { Button } from '@/components/ui/button';
import { CalendarDays, Leaf, Users, Calculator } from 'lucide-react';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
        <Leaf className="h-8 w-8" />
        <h1 className="text-2xl font-bold font-headline">QuiroAgenda</h1>
      </Link>
      <nav className="flex items-center gap-2">
         <Link href="/">
           <Button variant="outline">
            <CalendarDays className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Agenda</span>
          </Button>
         </Link>
        <Link href="/clients">
          <Button variant="outline">
            <Users className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Clientes</span>
          </Button>
        </Link>
        <Link href="/contabilidad">
          <Button variant="outline">
            <Calculator className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Contabilidad</span>
          </Button>
        </Link>
      </nav>
    </header>
  );
}
