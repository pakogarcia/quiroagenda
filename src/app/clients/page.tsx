
'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Plus, User, Phone, Gift, CalendarClock, Users, AlertCircle, MessageSquare } from 'lucide-react';
import type { Client, Voucher, Appointment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ClientForm } from '@/components/client-form';
import { motion, AnimatePresence } from 'framer-motion';
import { SplashScreen } from '@/components/layout/splash-screen';
import { format, differenceInDays, startOfToday, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CLIENTS_STORAGE_KEY = 'quiroagenda_clients';
const APPOINTMENTS_STORAGE_KEY = 'quiroagenda_appointments';

export default function ClientsPage() {
    const [clients, setClients] = React.useState<Client[]>([]);
    const [appointments, setAppointments] = React.useState<Appointment[]>([]);
    const [isClient, setIsClient] = React.useState(false);
    const [today, setToday] = React.useState<Date | null>(null);

    React.useEffect(() => {
        try {
            const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
            if (storedClients) {
                const parsedClients = JSON.parse(storedClients);
                const migratedClients = parsedClients.map((client: any) => ({
                    ...client,
                    lastName: client.lastName || '',
                    voucher: client.voucher || undefined,
                }));
                setClients(migratedClients);
            }
            
            const storedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
            if (storedAppointments) {
                 const parsedAppointments = JSON.parse(storedAppointments)
                    .map((apt: any) => ({
                      ...apt,
                      dateTime: new Date(apt.dateTime),
                    }))
                    .filter((apt: Appointment) => apt.dateTime && !isNaN(apt.dateTime.getTime()));
                setAppointments(parsedAppointments);
            }

        } catch (error) {
            console.error("Failed to load data.", error);
        }
        setToday(startOfToday());
        setIsClient(true);
    }, []);

    React.useEffect(() => {
        if (isClient) {
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
        }
    }, [clients, isClient]);

    const lastAppointmentByClient = React.useMemo(() => {
        if (!today) return new Map<string, Date>();
        
        const map = new Map<string, Date>();
        
        const phoneToClientId = new Map<string, string>();
        clients.forEach(client => {
            phoneToClientId.set(client.phone, client.id);
        });

        const clientAppointments: { [key: string]: Date[] } = {};

        appointments.forEach(apt => {
            const clientId = phoneToClientId.get(apt.clientPhone);
            if (clientId) {
                if (!clientAppointments[clientId]) {
                    clientAppointments[clientId] = [];
                }
                clientAppointments[clientId].push(apt.dateTime);
            }
        });

        for (const clientId in clientAppointments) {
            const latestDate = clientAppointments[clientId]
                .filter(date => isBefore(date, today))
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
    
    const handleAddClient = (data: Omit<Client, 'id'>) => {
        const newClient: Client = { ...data, id: crypto.randomUUID() };
        setClients(prev => [...prev, newClient].sort((a, b) => {
            const nameComp = a.name.localeCompare(b.name);
            if (nameComp !== 0) return nameComp;
            return (a.lastName || '').localeCompare(b.lastName || '');
        }));
        setIsFormOpen(false);
    };

    const handleUpdateClient = (id: string, data: Omit<Client, 'id'>) => {
        setClients(prev => prev.map((client) => (client.id === id ? { ...client, ...data } : client)).sort((a, b) => {
            const nameComp = a.name.localeCompare(b.name);
            if (nameComp !== 0) return nameComp;
            return (a.lastName || '').localeCompare(b.lastName || '');
        }));
        setIsFormOpen(false);
        setEditingClient(undefined);
    };
    
    if (!isClient || !today) {
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
                            const whatsappLink = `https://wa.me/${client.phone.replace(/\D/g, '')}`;

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
                                                  <CardTitle className="text-xl text-accent flex items-center gap-2">
                                                      <User className="w-5 h-5"/>
                                                      {`${client.name} ${client.lastName}`}
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
                                                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                                                          <MessageSquare className="w-4 h-4"/>
                                                          <span>{client.phone}</span>
                                                        </a>
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

            {isClient && (
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
                          allClients={clients}
                      />
                  </DialogContent>
              </Dialog>
            )}

        </div>
    );
}

    