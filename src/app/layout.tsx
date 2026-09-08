import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LicenseGate } from '@/components/license-gate';
import { AppDataProvider } from '@/context/app-data-context';
import { PasswordGate } from '@/components/password-gate';

export const metadata: Metadata = {
  title: 'Quiromasajista Pako García · Pide tu Cita Online',
  description: 'Especialista en quiromasaje descontracturante, alivio de sobrecargas y bienestar en Córdoba. Reserva tu cita online de forma rápida y cómoda.',
  openGraph: {
    title: 'Quiromasajista Pako García · Pide tu Cita Online',
    description: 'Especialista en quiromasaje descontracturante, alivio de sobrecargas y bienestar en Córdoba. Reserva tu cita online de forma rápida y cómoda.',
    url: 'https://citas.pakogarcia.es',
    siteName: 'Pako García Quiromasajes',
    images: [
      {
        url: '/logo-quiro.jpg',
        width: 800,
        height: 800,
        alt: 'Pako García Quiromasajes',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Quiromasajista Pako García · Pide tu Cita Online',
    description: 'Especialista en quiromasaje descontracturante, alivio de sobrecargas y bienestar en Córdoba. Reserva tu cita online de forma rápida y cómoda.',
    images: ['/logo-quiro.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <LicenseGate>
          <PasswordGate>
            <AppDataProvider>
              {children}
            </AppDataProvider>
          </PasswordGate>
        </LicenseGate>
        <Toaster />
      </body>
    </html>
  );
}
