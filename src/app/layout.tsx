import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LicenseGate } from '@/components/license-gate';
import { AppDataProvider } from '@/context/app-data-context';

export const metadata: Metadata = {
  title: 'QuiroAgenda',
  description: 'Gestión de citas para gabinetes de masajes y estética.',
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
          <AppDataProvider>
            {children}
          </AppDataProvider>
        </LicenseGate>
        <Toaster />
      </body>
    </html>
  );
}
