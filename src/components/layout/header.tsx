'use client';

import { Button } from '@/components/ui/button';
import { CalendarDays, Leaf, Users, Calculator, Info, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AppHeader({ className }: { className?: string }) {
  return (
    <header className={cn(
      "flex flex-col md:flex-row md:items-center md:justify-between p-4 border-b bg-card gap-4 md:gap-2", 
      className
    )}>
      <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors self-start">
        <Leaf className="h-8 w-8" />
        <h1 className="text-2xl font-bold font-headline">QuiroAgenda</h1>
      </Link>
      <nav className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
        <Link href="/quien-eres">
          <Button variant="outline" size="sm">
            <Info className="h-4 w-4" />
            <span>Quién eres</span>
          </Button>
        </Link>
         <Link href="/">
           <Button variant="outline" size="sm">
            <CalendarDays className="h-4 w-4" />
            <span>Agenda</span>
          </Button>
         </Link>
        <Link href="/clients">
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4" />
            <span>Clientes</span>
          </Button>
        </Link>
        <Link href="/contabilidad">
          <Button variant="outline" size="sm">
            <Calculator className="h-4 w-4" />
            <span>Contabilidad</span>
          </Button>
        </Link>
        <Link href="/manual">
          <Button variant="outline" size="sm">
            <BookOpen className="h-4 w-4" />
            <span>Ayuda</span>
          </Button>
        </Link>
      </nav>
    </header>
  );
}
