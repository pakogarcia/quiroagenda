'use client';

import { Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <Leaf className="h-24 w-24 text-primary" />
        <h1 className="text-4xl font-bold font-headline text-primary tracking-wider">
          QuiroAgenda
        </h1>
        <p className="text-muted-foreground animate-pulse">Cargando aplicación...</p>
      </motion.div>
    </div>
  );
}
