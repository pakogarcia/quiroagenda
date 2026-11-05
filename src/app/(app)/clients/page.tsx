
'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Plus, User, Phone, Gift, CalendarClock, Users, AlertCircle, MessageSquare, Tag } from 'lucide-react';
import type { Client, Appointment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ClientForm } from '@/components/client-form';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, startOfToday, isBefore, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppData } from '@/context/app-data-context';
import { SplashScreen } from '@/components/layout/splash-screen';


export default function ClientsPage() {
    const { clients, setClients, appointments, isLoading, addClient, updateClient } = useAppData();
    const [today, setToday] = React.useState<Date | null>(null);

    React.useEffect(() => {
        setToday(startOfToday());
    }, []);

    const lastAppointmentByClient = React.useMemo(() => {
        if (!today) return new Map<string, Date>();
        
        const map = new Map<string, Date>();
        
        const phoneToClientId = new Map<string, string>();
        clients.forEach(client => {
            phoneToClientId.set(client.phone, client.id);
        });

        const clientAppointments: { [key: string]: Date[] } = {};

        appointments.forEach(apt => {
            if (apt.status === 'completed') {
                const clientId = phoneToClientId.get(apt.clientPhone);
                if (clientId) {
                    if (!clientAppointments[clientId]) {
                        clientAppointments[clientId] = [];
                    }
                    clientAppointments[clientId].push(apt.dateTime);
                }
            }
        });

        for (const clientId in clientAppointments) {
            const latestDate = clientAppointments[clientId]
                .filter(date => isBefore(date, today) || isSameDay(date, today))
                .sort((a, b) => b.getTime() - a.getTime())[0];

            if (latestDate) {
                map.set(clientId, latestDate);
            }
        }
        
        return map;
    }, [clients, appointments, today]);

    const clientsWithPendingPayments = React.useMemo(() => {
        const phoneToClientId = new Map<string, string>();
        clients.forEach(client => {
            phoneToClientId.set(client.phone, client.id);
        });

        const clientIds = new Set<string>();
        appointments.forEach(apt => {
            if (apt.status === 'completed' && !apt.payment) {
                const clientId = phoneToClientId.get(apt.clientPhone);
                if (clientId) {
                    clientIds.add(clientId);
                }
            }
        });
        return clientIds;
    }, [clients, appointments]);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingClient, setEditingClient] = React.useState<Client | undefined>(undefined);
    
    const handleAddClient = async (data: Omit<Client, 'id'>) => {
        const newClient: Client = { ...data, id: crypto.randomUUID() };
        try {
            await addClient(newClient);
        } catch (e) {
            console.error("Error al añadir cliente:", e);
        }
        setIsFormOpen(false);
    };

    const handleUpdateClient = async (id: string, data: Omit<Client, 'id'>) => {
        try {
            await updateClient(id, data);
        } catch (e) {
            console.error("Error al actualizar cliente:", e);
        }
        setIsFormOpen(false);
        setEditingClient(undefined);
    };

    const handleWhatsAppClick = (e: React.MouseEvent, phone: string) => {
        e.stopPropagation();
        e.preventDefault();
        const whatsappLink = `https://wa.me/${phone.replace(/\D/g, '')}`;
        window.open(whatsappLink, '_blank', 'noopener,noreferrer');
    }
    
    if (isLoading || !today) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold font-headline text-primary">Clientes</h1>
                    <Button onClick={() => { setEditingClient(undefined); setIsFormOpen(true); }}>
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Añadir Cliente</span>
                    </Button>
                </div>
                
                {clients.length > 0 ? (
                    <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence>
                        {clients.map(client => {
                            const lastAppointmentDate = lastAppointmentByClient.get(client.id);
                            const daysSinceLastAppointment = lastAppointmentDate ? differenceInDays(today, lastAppointmentDate) : null;
                            const hasPendingPayment = clientsWithPendingPayments.has(client.id);

                            return (
                                <motion.div
                                  key={client.id}
                                  layout
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="origin-top"
                                >
                                <Link href={`/clients/${client.id}`} className="h-full block">
                                  <Card className={cn('shadow-md hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col', {
                                        'border-yellow-500/50': hasPendingPayment,
                                    })}>
                                      <CardHeader>
                                          <div className="flex justify-between items-start">
                                              <div>
                                                  <CardTitle className="text-xl text-accent flex flex-wrap items-center gap-2">
                                                      <User className="w-5 h-5"/>
                                                      <span>{`${client.name} ${client.lastName}`}</span>
                                                      {client.discount && client.discount.value > 0 && (
                                                          <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1" title={`Descuento fidelidad: ${client.discount.type === 'percentage' ? `${client.discount.value}%` : `${client.discount.value}€`}`}>
                                                              <Tag className="w-3 h-3 text-emerald-600" />
                                                              -{client.discount.type === 'percentage' ? `${client.discount.value}%` : `${client.discount.value}€`}
                                                          </span>
                                                      )}
                                                       {hasPendingPayment && (
                                                          <TooltipProvider>
                                                              <Tooltip>
                                                                  <TooltipTrigger>
                                                                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                                                                  </TooltipTrigger>
                                                                  <TooltipContent>
                                                                      <p>Tiene pagos pendientes</p>
                                                                  </TooltipContent>
                                                              </Tooltip>
                                                          </TooltipProvider>
                                                      )}
                                                  </CardTitle>
                                                  <CardDescription className="flex items-center gap-2 pt-2">
                                                        <button
                                                          onClick={(e) => handleWhatsAppClick(e, client.phone)}
                                                          className="flex items-center gap-2 hover:text-primary transition-colors text-muted-foreground z-10"
                                                        >
                                                          <MessageSquare className="w-4 h-4"/>
                                                          <span>{client.phone}</span>
                                                        </button>
                                                  </CardDescription>
                                              </div>
                                          </div>
                                      </CardHeader>
                                      <CardContent className="flex-grow space-y-3">
                                        {client.voucher && client.voucher.sessions > 0 ? (
                                            <div className="p-3 bg-muted/50 rounded-md">
                                                <p className="font-semibold text-sm flex items-center gap-2 text-primary"><Gift className="w-4 h-4" /> Bono Activo</p>
                                                <p className="text-muted-foreground text-sm mt-1">Sesiones restantes: <span className="font-bold">{client.voucher.sessions}</span></p>
                                            </div>
                                        ) : (
                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                                <p>Sin bono activo</p>
                                            </div>
                                        )}
                                        <div className="p-3 bg-muted/50 rounded-md">
                                            <p className="font-semibold text-sm flex items-center gap-2 text-primary"><CalendarClock className="w-4 h-4" /> Última Visita</p>
                                            {lastAppointmentDate ? (
                                                <div className="text-muted-foreground text-sm mt-1">
                                                    <p>{format(lastAppointmentDate, "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                                                    {daysSinceLastAppointment !== null && <p className="font-bold">{`Hace ${daysSinceLastAppointment} día(s)`}</p>}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-sm mt-1">No hay citas pasadas registradas</p>
                                            )}
                                        </div>
                                      </CardContent>
                                  </Card>
                                </Link>
                                </motion.div>
                            )
                        })}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg mt-8">
                        <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-semibold text-muted-foreground">No hay clientes guardados.</h3>
                        <p className="text-muted-foreground mt-1">Añade tu primer cliente para empezar.</p>
                    </div>
                )}
            </main>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</DialogTitle>
                         <DialogDescription>
                            {editingClient ? 'Modifica los datos del cliente.' : 'Añade un nuevo cliente a tu lista.'}
                         </DialogDescription>
                    </DialogHeader>
                    <ClientForm 
                        onSubmit={editingClient ? (data) => handleUpdateClient(editingClient.id, data) : handleAddClient}
                        client={editingClient}
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
}
