
'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, Bell, Cake, Clock, Gift, Users, AlertCircle, UserX } from 'lucide-react';
import { CampaignDialog, CampaignType } from '@/components/campaign-dialog';

const campaignOptions = [
  {
    type: 'reminders',
    title: 'Recordatorios de Citas',
    description: 'Envía recordatorios de citas futuras a tus clientes.',
    icon: Bell,
  },
  {
    type: 'pendingPayments',
    title: 'Notificar Pagos Pendientes',
    description: 'Contacta a clientes con citas completadas pero no abonadas.',
    icon: AlertCircle,
  },
    {
    type: 'noShow',
    title: 'Contactar por Ausencia (No Show)',
    description: 'Envía un mensaje a clientes que no se presentaron a su cita.',
    icon: UserX,
  },
  {
    type: 'voucherStatus',
    title: 'Notificar Sesiones de Bono',
    description: 'Informa a un cliente sobre las sesiones que le quedan en su bono.',
    icon: Gift,
  },
  {
    type: 'birthdays',
    title: 'Felicitaciones de Cumpleaños',
    description: 'Envía un mensaje a los clientes que cumplen años pronto.',
    icon: Cake,
  },
  {
    type: 'inactiveClients',
    title: 'Clientes Inactivos',
    description: 'Recupera clientes que no han vuelto en un tiempo determinado.',
    icon: Clock,
  },
  {
    type: 'newClients',
    title: 'Bienvenida a Nuevos Clientes',
    description: 'Envía un mensaje de bienvenida a los clientes recién añadidos.',
    icon: Users,
  },
  {
    type: 'offer',
    title: 'Campaña de Oferta',
    description: 'Lanza una promoción especial para todos o algunos de tus clientes.',
    icon: Gift,
  },
] as const;

export default function CommunicationsPage() {
  const [selectedCampaign, setSelectedCampaign] = React.useState<CampaignType | null>(null);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold font-headline text-primary">Centro de Comunicaciones</h1>
            <p className="text-muted-foreground mt-1">Selecciona una plantilla para empezar a crear tu campaña de mensajería.</p>
          </header>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaignOptions.map((campaign) => (
              <Card
                key={campaign.type}
                className="hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setSelectedCampaign(campaign.type)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-accent">
                    <campaign.icon className="h-6 w-6" />
                    {campaign.title}
                  </CardTitle>
                  <CardDescription>{campaign.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-end text-sm text-primary font-semibold group-hover:translate-x-1 transition-transform">
                    Configurar campaña <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>

      <CampaignDialog
        campaignType={selectedCampaign}
        onOpenChange={() => setSelectedCampaign(null)}
      />
    </>
  );
}
