'use client';

import * as React from 'react';
import OnlineBookingPage from '@/app/(app)/reservas/page';
import AgendaView from '@/components/agenda-view';

export default function Home() {
  const [isLegacyAdminHost, setIsLegacyAdminHost] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname.toLowerCase();
      // Si entran por la URL tecnica antigua de Firebase, mostrar AgendaView para compatibilidad
      if (host.includes('hosted.app') || host.includes('localhost') || host.includes('127.0.0.1')) {
        setIsLegacyAdminHost(true);
      } else {
        setIsLegacyAdminHost(false);
      }
    }
  }, []);

  // Si entran a la raiz en https://citas.pakogarcia.es, ven la pagina publica de reservas
  if (!isLegacyAdminHost) {
    return <OnlineBookingPage />;
  }

  // Compatibilidad temporal para desarrollo local / hosted.app
  return <AgendaView />;
}
