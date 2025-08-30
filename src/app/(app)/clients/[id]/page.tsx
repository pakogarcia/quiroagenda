
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, User, Phone, Gift, Euro, History, CheckCircle, XCircle, AlertCircle, FileText, BarChart, Tag, MessageSquare } from 'lucide-react';
import type { Client, Appointment, Payment, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ClientForm } from '@/components/client-form';
import { SplashScreen } from '@/components/layout/splash-screen';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { FinishAppointmentDialog } from '@/components/finish-appointment-dialog';
import { cn } from '@/lib/utils';
import { useAppData } from '@/context/app-data-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ClientDetailPage() {
    const { clients, setClients, appointments, setAppointments, isLoading } = useAppData();
    const router = useRouter();
    const params = useParams();
    const clientId = params.id as string;

    const [client, setClient] = React.useState<Client | null>(null);
    const [clientAppointments, setClientAppointments] = React.useState<Appointment[]>([]);
    
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
    const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);

    React.useEffect(() => {
        if (!isLoading && clientId) {
            const currentClient = clients.find(c => c.id === clientId);
            if (currentClient) {
                setClient(currentClient);

                const appointmentsForClient = appointments
                    .filter(apt => apt.clientPhone === currentClient.phone)
                    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
                
                setClientAppointments(appointmentsForClient);
            } else {
                router.push('/clients');
            }
        }
    }, [clientId, router, clients, appointments, isLoading]);

    const handleUpdateClient = (id: string, data: Omit<Client, 'id'>) => {
        const updatedClient = { ...client, ...data } as Client;
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

    const serviceStats = React.useMemo(() => {
        const stats: { [key: string]: number } = {};
        clientAppointments.forEach(apt => {
            if (apt.status === 'completed' && apt.serviceName) {
                stats[apt.serviceName] = (stats[apt.serviceName] || 0) + 1;
            }
        });
        return Object.entries(stats)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [clientAppointments]);

     const handleAppointmentFinished = (updatedAppointment: Appointment) => {
        setAppointments(prev => prev.map(apt => 
            apt.id === updatedAppointment.id ? updatedAppointment : apt
        ));
        setEditingAppointment(null);
    };

    const getStatusBadge = (appointment: Appointment) => {
        switch (appointment.status) {
            case 'completed':
                if (appointment.payment) {
                    return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Completada</Badge>;
                } else {
                    return (
                         <Button variant="outline" size="sm" className="h-auto py-0.5 px-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700" onClick={() => setEditingAppointment(appointment)}>
                            <AlertCircle className="w-3 h-3 mr-1" /> Pendiente de Pago
                        </Button>
                    );
                }
            case 'no-show':
                return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> No Presentado</Badge>;
            case 'scheduled':
                return <Badge variant="outline">Programada</Badge>;
            default:
                return null;
        }
    };
    
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

    if (isLoading || !client) {
        return <SplashScreen />;
    }
    
    const whatsappLink = `https://wa.me/${client.phone.replace(/\D/g, '')}`;

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
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                    <MessageSquare className="w-4 h-4"/>
                                    <span>{client.phone}</span>
                                </a>
                            </CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            {client.details && (
                                <div className="p-3 bg-muted/50 rounded-md">
                                    <p className="font-semibold text-sm flex items-center gap-2 text-primary"><FileText className="w-4 h-4" /> Detalles Importantes</p>
                                    <p className="text-muted-foreground text-sm mt-1 whitespace-pre-wrap">{client.details}</p>
                                </div>
                            )}
                            {client.voucher && (
                                <div className="p-3 bg-muted/50 rounded-md max-w-sm">
                                    <p className="font-semibold text-sm flex items-center gap-2 text-primary"><Gift className="w-4 h-4" /> Bono Activo</p>
                                    <p className="text-muted-foreground text-sm mt-1">Sesiones restantes: <span className="font-bold">{client.voucher.sessions} de {client.voucher.totalSessions}</span></p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                 <div className="grid gap-6 md:grid-cols-4 mb-6">
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
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Servicios Frecuentes</CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {serviceStats.length > 0 ? (
                                <ul className="space-y-1 text-sm">
                                    {serviceStats.slice(0, 2).map(service => (
                                        <li key={service.name} className="flex justify-between">
                                            <span>{service.name}</span>
                                            <span className="font-bold">{service.count}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">Sin datos</p>
                            )}
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
                                    <TableHead>Servicio</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Pago</TableHead>
                                    <TableHead className="text-right">Importe</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientAppointments.length > 0 ? clientAppointments.map(apt => (
                                    <TableRow key={apt.id}>
                                        <TableCell>{format(apt.dateTime, "P p", { locale: es })}</TableCell>
                                        <TableCell>{apt.serviceName || 'N/A'}</TableCell>
                                        <TableCell>{getStatusBadge(apt)}</TableCell>
                                        <TableCell>{getPaymentMethodName(apt.payment?.method)}</TableCell>
                                        <TableCell className="text-right">
                                            {apt.payment && apt.payment.method !== 'voucher' ? `${apt.payment.amount.toFixed(2)}€` : (apt.status === 'completed' && !apt.payment ? 'Pendiente' : '')}
                                        </TableCell>
                                        <TableCell>
                                            {apt.status === 'completed' && apt.payment && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => setEditingAppointment(apt)}>
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Editar Pago</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
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
                         <DialogDescription>
                          Modifica los datos del cliente.
                        </DialogDescription>
                    </DialogHeader>
                    <ClientForm 
                        onSubmit={(data) => handleUpdateClient(client.id, data)}
                        client={client}
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
            
            <FinishAppointmentDialog
                appointment={editingAppointment}
                onOpenChange={() => setEditingAppointment(null)}
                onAppointmentFinished={handleAppointmentFinished}
                isEditing
            />
        </div>
    );
}

    