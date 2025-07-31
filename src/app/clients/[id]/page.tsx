
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, User, Phone, Gift, Euro, History, CheckCircle, XCircle } from 'lucide-react';
import type { Client, Appointment, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ClientForm } from '@/components/client-form';
import { SplashScreen } from '@/components/layout/splash-screen';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const CLIENTS_STORAGE_KEY = 'quiroagenda_clients';
const APPOINTMENTS_STORAGE_KEY = 'quiroagenda_appointments';

export default function ClientDetailPage() {
    const [clients, setClients] = React.useState<Client[]>([]);
    const [client, setClient] = React.useState<Client | null>(null);
    const [clientAppointments, setClientAppointments] = React.useState<Appointment[]>([]);
    const [isClientLoaded, setIsClientLoaded] = React.useState(false);
    const router = useRouter();
    const params = useParams();
    const clientId = params.id as string;

    React.useEffect(() => {
        if (clientId) {
            try {
                const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
                const allClients: Client[] = storedClients ? JSON.parse(storedClients) : [];
                setClients(allClients);

                const currentClient = allClients.find(c => c.id === clientId);
                if (currentClient) {
                    setClient(currentClient);

                    const storedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
                    const allAppointments: Appointment[] = storedAppointments
                        ? JSON.parse(storedAppointments).map((apt: any) => ({
                              ...apt,
                              dateTime: new Date(apt.dateTime),
                          }))
                        : [];
                    
                    const appointmentsForClient = allAppointments
                        .filter(apt => apt.clientPhone === currentClient.phone)
                        .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
                    
                    setClientAppointments(appointmentsForClient);
                } else {
                    router.push('/clients');
                }
            } catch (error) {
                console.error("Failed to load data.", error);
                router.push('/clients');
            }
        }
        setIsClientLoaded(true);
    }, [clientId, router]);

    React.useEffect(() => {
        if (isClientLoaded) {
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
        }
    }, [clients, isClientLoaded]);
    
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);

    const handleUpdateClient = (id: string, data: Omit<Client, 'id'>) => {
        const updatedClient = { ...client, ...data } as Client;
        setClient(updatedClient);
        setClients(prev => prev.map(c => (c.id === id ? updatedClient : c)));
        setIsFormOpen(false);
    };

    const handleDeleteClient = () => {
        setClients(prev => prev.filter(c => c.id !== clientId));
        router.push('/clients');
    };

    const clientStats = React.useMemo(() => {
        const stats = {
            totalRevenue: 0,
            completedAppointments: 0,
            noShows: 0,
        };
        clientAppointments.forEach(apt => {
            if (apt.status === 'completed') {
                stats.completedAppointments++;
                if (apt.payment && apt.payment.method !== 'voucher') {
                    stats.totalRevenue += apt.payment.amount;
                }
            } else if (apt.status === 'no-show') {
                stats.noShows++;
            }
        });
        return stats;
    }, [clientAppointments]);

    const getStatusBadge = (status: Appointment['status']) => {
        switch (status) {
          case 'completed': return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Completada</Badge>;
          case 'no-show': return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3"/> No Presentado</Badge>;
          case 'scheduled': return <Badge variant="outline">Programada</Badge>;
          default: return null;
        }
    }
    
    const getPaymentMethodName = (method?: PaymentMethod) => {
        if (!method) return '';
        switch (method) {
            case 'cash': return 'Efectivo';
            case 'voucher': return 'Bono';
            case 'bizum': return 'Bizum';
            case 'paypal': return 'PayPal';
            default: return method;
        }
    };

    if (!isClientLoaded || !client) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <Button variant="outline" asChild>
                        <Link href="/clients">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a Clientes
                        </Link>
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                            <Edit className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Editar</span>
                        </Button>
                        <Button variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)}>
                            <Trash2 className="h-4 w-4 md:mr-2" />
                             <span className="hidden md:inline">Eliminar</span>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle className="text-2xl text-accent flex items-center gap-3"><User className="w-6 h-6"/>{`${client.name} ${client.lastName}`}</CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-2">
                                <Phone className="w-4 h-4"/>
                                {client.phone}
                            </CardDescription>
                        </CardHeader>
                         {client.voucher && (
                            <CardContent>
                                <div className="p-3 bg-muted/50 rounded-md max-w-sm">
                                    <p className="font-semibold text-sm flex items-center gap-2 text-primary"><Gift className="w-4 h-4" /> Bono Activo</p>
                                    <p className="text-muted-foreground text-sm mt-1">Sesiones restantes: <span className="font-bold">{client.voucher.sessions} de {client.voucher.totalSessions}</span></p>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
                
                 <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
                            <Euro className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{clientStats.totalRevenue.toFixed(2)}€</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Citas Completadas</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{clientStats.completedAppointments}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">No Presentado</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{clientStats.noShows}</div>
                        </CardContent>
                    </Card>
                </div>


                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><History className="w-5 h-5"/> Historial de Citas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Pago</TableHead>
                                    <TableHead className="text-right">Importe</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientAppointments.length > 0 ? clientAppointments.map(apt => (
                                    <TableRow key={apt.id}>
                                        <TableCell>{format(apt.dateTime, "P p", { locale: es })}</TableCell>
                                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                                        <TableCell>{getPaymentMethodName(apt.payment?.method)}</TableCell>
                                        <TableCell className="text-right">
                                            {apt.payment && apt.payment.method !== 'voucher' ? `${apt.payment.amount.toFixed(2)}€` : (apt.status === 'completed' && !apt.payment ? 'Pendiente' : '')}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            Este cliente no tiene citas registradas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                    </DialogHeader>
                    <ClientForm 
                        onSubmit={(data) => handleUpdateClient(client.id, data)}
                        client={client}
                        allClients={clients}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente y todo su historial.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    
