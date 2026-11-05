
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, User, Phone, Gift, Euro, History, CheckCircle, XCircle, AlertCircle, FileText, BarChart, Tag, MessageSquare, ShoppingCart, CreditCard, Cake, ShieldCheck } from 'lucide-react';
import type { Client, Appointment, Payment, PaymentMethod, VoucherSale } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ClientForm } from '@/components/client-form';
import { SplashScreen } from '@/components/layout/splash-screen';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { FinishAppointmentDialog } from '@/components/finish-appointment-dialog';
import { cn } from '@/lib/utils';
import { useAppData } from '@/context/app-data-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EditVoucherSaleDialog } from '@/components/edit-voucher-sale-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NewAppointmentConfirmationDialog } from '@/components/new-appointment-confirmation-dialog';

type HistoryItem = (Appointment & { type: 'appointment' }) | (VoucherSale & { type: 'voucher_sale' });

export default function ClientDetailPage() {
    const { clients, setClients, appointments, setAppointments, voucherSales, setVoucherSales, isLoading } = useAppData();
    const router = useRouter();
    const params = useParams();
    const clientId = params.id as string;

    const [client, setClient] = React.useState<Client | null>(null);
    const [hasWebPin, setHasWebPin] = React.useState<boolean>(false);
    const [clientHistory, setClientHistory] = React.useState<HistoryItem[]>([]);
    
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
    const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
    const [editingVoucherSale, setEditingVoucherSale] = React.useState<VoucherSale | null>(null);
    const [voucherPurchaseData, setVoucherPurchaseData] = React.useState<{ client: Client; sessions: number; totalSessions: number } | null>(null);
    

    React.useEffect(() => {
        if (!isLoading && clientId) {
            const currentClient = clients.find(c => c.id === clientId);
            if (currentClient) {
                setClient(currentClient);

                const cleanClientPhone = (currentClient.phone || '').replace(/\D/g, '');
                const clientFullName = `${currentClient.name || ''} ${currentClient.lastName || ''}`.trim().toLowerCase();

                const appointmentsForClient: HistoryItem[] = appointments
                    .filter(apt => {
                        // 1. Direct clientId match
                        if (apt.clientId && apt.clientId === currentClient.id) return true;

                        // 2. Exact phone string match
                        if (apt.clientPhone && currentClient.phone && apt.clientPhone === currentClient.phone) return true;

                        // 3. Normalized 9 digits (Spanish standard telephone number)
                        if (cleanClientPhone && cleanClientPhone.length >= 9) {
                            const aptPhoneDigits = (apt.clientPhone || '').replace(/\D/g, '');
                            if (aptPhoneDigits.endsWith(cleanClientPhone.slice(-9))) return true;
                        }

                        // 4. Client name match as fallback
                        if (clientFullName && apt.clientName && apt.clientName.trim().toLowerCase() === clientFullName) return true;

                        return false;
                    })
                    .map(apt => ({...apt, type: 'appointment'}));
                
                const voucherSalesForClient: HistoryItem[] = voucherSales
                    .filter(sale => sale.clientId === currentClient.id)
                    .map(sale => ({...sale, type: 'voucher_sale'}));

                const combinedHistory = [...appointmentsForClient, ...voucherSalesForClient]
                    .sort((a, b) => {
                        const dateA = a.type === 'appointment' ? a.dateTime : a.date;
                        const dateB = b.type === 'appointment' ? b.dateTime : b.date;
                        return new Date(dateB).getTime() - new Date(dateA).getTime();
                    });
                
                setClientHistory(combinedHistory);

                // Comprobar estado real del PIN en el servidor para evitar falsos negativos por caché
                if (currentClient.phone) {
                    fetch('/api/client-portal/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'lookup', phone: currentClient.phone }),
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.found) {
                            setHasWebPin(Boolean(data.hasPin));
                        }
                    })
                    .catch(() => {});
                }

            } else {
                router.push('/clients');
            }
        }
    }, [clientId, router, clients, appointments, voucherSales, isLoading]);

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

    const handleResetPin = async () => {
        if (!client) return;
        if (!confirm(`¿Deseas restablecer el PIN de acceso web de ${client.name}? La próxima vez que entre al Área de Clientes podrá elegir uno nuevo de 4 dígitos.`)) return;
        try {
            const adminHash = typeof window !== 'undefined' ? localStorage.getItem('quiroagenda_pwd_hash') : null;
            const res = await fetch('/api/client-portal/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_pin', clientId: client.id, phone: client.phone, adminHash }),
            });
            if (res.ok) {
                setHasWebPin(false);
                const updated = { ...client, pinHash: undefined };
                setClient(updated);
                setClients(prev => prev.map(c => c.id === client.id ? updated : c));
                alert(`¡PIN de ${client.name} restablecido con éxito! La próxima vez que acceda con su teléfono ${client.phone} la web le pedirá crear un PIN nuevo.`);
            } else {
                alert('No se pudo restablecer el PIN. Inténtalo de nuevo.');
            }
        } catch (e) {
            console.error('Error restableciendo PIN:', e);
            alert('Error de conexión al restablecer el PIN.');
        }
    };

    const clientStats = React.useMemo(() => {
        const stats = {
            totalRevenue: 0,
            completedAppointments: 0,
            noShows: 0,
        };

        const clientAppointments = clientHistory.filter(h => h.type === 'appointment') as (Appointment & {type: 'appointment'})[];
        
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
        
        const clientVoucherSales = voucherSales.filter(sale => sale.clientId === clientId);
        clientVoucherSales.forEach(sale => {
            stats.totalRevenue += sale.amount;
        });

        return stats;
    }, [clientHistory, voucherSales, clientId]);
    
    const groupedHistory = React.useMemo(() => {
        return clientHistory.reduce((acc, item) => {
            const date = item.type === 'appointment' ? item.dateTime : item.date;
            const monthKey = format(new Date(date), 'MMMM yyyy', { locale: es });
            if (!acc[monthKey]) {
                acc[monthKey] = [];
            }
            acc[monthKey].push(item);
            return acc;
        }, {} as Record<string, HistoryItem[]>);
    }, [clientHistory]);

    const serviceStats = React.useMemo(() => {
        const stats: { [key: string]: number } = {};
        const clientAppointments = clientHistory.filter(h => h.type === 'appointment') as (Appointment & {type: 'appointment'})[];
        
        clientAppointments.forEach(apt => {
            if (apt.status === 'completed' && apt.serviceName) {
                stats[apt.serviceName] = (stats[apt.serviceName] || 0) + 1;
            }
        });
        return Object.entries(stats)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [clientHistory]);

     const handleAppointmentFinished = (updatedAppointment: Appointment) => {
        setAppointments(prev => prev.map(apt => 
            apt.id === updatedAppointment.id ? updatedAppointment : apt
        ));
        setEditingAppointment(null);
    };
    
     const handleVoucherSaleUpdated = (updatedSale: VoucherSale) => {
        setVoucherSales(prev => prev.map(sale => 
            sale.id === updatedSale.id ? updatedSale : sale
        ));
        setEditingVoucherSale(null);
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
    
    const getPaymentMethodName = (method?: PaymentMethod | 'cash' | 'bizum' | 'paypal') => {
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
    
    const whatsappLink = client.phone ? `https://wa.me/${client.phone.replace(/\D/g, '')}` : '';

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
                            <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                    <MessageSquare className="w-4 h-4"/>
                                    <span>{client.phone}</span>
                                </a>
                                {client.birthDate && (
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Cake className="w-4 h-4" />
                                        <span>{format(parseISO(client.birthDate), "d 'de' MMMM", { locale: es })}</span>
                                    </span>
                                )}
                                <div className="inline-flex items-center gap-2 pl-2 border-l border-muted">
                                    {hasWebPin ? (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 flex items-center gap-1 font-semibold text-[11px]">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> PIN Web Activo
                                            </Badge>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-6 px-2 text-[11px] border-amber-300 text-amber-900 dark:text-amber-300 hover:bg-amber-100/50"
                                                onClick={handleResetPin}
                                                title="Permitir que el cliente elija un nuevo PIN"
                                            >
                                                Restablecer PIN
                                            </Button>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="bg-muted/40 text-muted-foreground text-[11px]">
                                            Sin PIN Web (lo creará en su primer acceso)
                                        </Badge>
                                    )}
                                </div>
                                {client.discount && client.discount.value > 0 && (
                                    <div className="inline-flex items-center gap-2 pl-2 border-l border-muted">
                                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 flex items-center gap-1 font-semibold text-[11px]">
                                            <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                            Descuento Fiel: {client.discount.type === 'percentage' ? `${client.discount.value}%` : `${client.discount.value} €`} / sesión
                                        </Badge>
                                    </div>
                                )}
                            </CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            {client.discount && client.discount.value > 0 ? (
                                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                                                <Tag className="w-4 h-4 text-emerald-600" /> Tarifa Especial por Fidelidad
                                            </p>
                                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 font-bold text-xs">
                                                -{client.discount.type === 'percentage' ? `${client.discount.value}%` : `${client.discount.value} €`} / sesión
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Este cliente tiene asignado un descuento automático de <strong className="text-foreground">{client.discount.type === 'percentage' ? `${client.discount.value}%` : `${client.discount.value} €`}</strong> en cada sesión. Al agendar o cobrar una cita, QuiroAgenda calcula su precio reducido automáticamente.
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" className="self-start sm:self-center border-emerald-300 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/60 shrink-0" onClick={() => setIsFormOpen(true)}>
                                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Modificar Descuento
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-3.5 bg-muted/30 border border-dashed border-muted-foreground/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-sm flex items-center gap-2 text-foreground/90">
                                            <Tag className="w-4 h-4 text-primary" /> Descuento Personalizado / Tarifa Fiel
                                        </p>
                                        <p className="text-muted-foreground text-xs mt-1">
                                            Sin descuento asignado (este cliente abona la tarifa habitual de tus masajes).
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" className="self-start sm:self-center shrink-0 border-primary/40 text-primary hover:bg-primary/10" onClick={() => setIsFormOpen(true)}>
                                        <Tag className="w-3.5 h-3.5 mr-1.5 text-primary" /> Asignar Descuento
                                    </Button>
                                </div>
                            )}
                            {client.details && (
                                <div className="p-3 bg-muted/50 rounded-md">
                                    <p className="font-semibold text-sm flex items-center gap-2 text-primary"><FileText className="w-4 h-4" /> Detalles Importantes</p>
                                    <p className="text-muted-foreground text-sm mt-1 whitespace-pre-wrap">{client.details}</p>
                                </div>
                            )}
                            {client.voucher && client.voucher.sessions > 0 && (
                                <div className="p-3 bg-muted/50 rounded-md max-w-sm flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-sm flex items-center gap-2 text-primary"><Gift className="w-4 h-4" /> Bono Activo</p>
                                        <p className="text-muted-foreground text-sm mt-1">Sesiones restantes: <span className="font-bold">{client.voucher.sessions} de {client.voucher.totalSessions}</span></p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setVoucherPurchaseData({ client, sessions: client.voucher!.sessions, totalSessions: client.voucher!.totalSessions })} title="Enviar mensaje de agradecimiento/confirmación de bono por WhatsApp">
                                        <MessageSquare className="w-4 h-4 mr-1 text-green-600" /> Notificar
                                    </Button>
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
                        <CardTitle className="text-xl flex items-center gap-2"><History className="w-5 h-5"/> Historial</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {clientHistory.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full" defaultValue={Object.keys(groupedHistory)[0]}>
                                {Object.entries(groupedHistory).map(([month, items]) => (
                                    <AccordionItem value={month} key={month}>
                                        <AccordionTrigger className="capitalize text-lg">{month}</AccordionTrigger>
                                        <AccordionContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Fecha</TableHead>
                                                        <TableHead>Concepto</TableHead>
                                                        <TableHead>Estado</TableHead>
                                                        <TableHead>Pago</TableHead>
                                                        <TableHead className="text-right">Importe</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.map(item => (
                                                        <TableRow key={item.id}>
                                                        {item.type === 'appointment' ? (
                                                            <>
                                                                <TableCell>{format(new Date(item.dateTime), "P p", { locale: es })}</TableCell>
                                                                <TableCell className="flex items-center gap-2">
                                                                    <CreditCard className="w-4 h-4 text-muted-foreground"/>
                                                                    {item.serviceName || 'Cita'}
                                                                </TableCell>
                                                                <TableCell>{getStatusBadge(item)}</TableCell>
                                                                <TableCell>{getPaymentMethodName(item.payment?.method)}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {item.payment && item.payment.method !== 'voucher' ? `${item.payment.amount.toFixed(2)}€` : (item.status === 'completed' && !item.payment ? 'Pendiente' : '')}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.status === 'completed' && item.payment && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" onClick={() => setEditingAppointment(item)}>
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
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TableCell>{format(new Date(item.date), "P", { locale: es })}</TableCell>
                                                                <TableCell className="flex items-center gap-2">
                                                                    <ShoppingCart className="w-4 h-4 text-muted-foreground"/>
                                                                    Compra de Bono ({item.sessions} sesiones)
                                                                </TableCell>
                                                                <TableCell><Badge variant="secondary">Completada</Badge></TableCell>
                                                                <TableCell>{getPaymentMethodName(item.paymentMethod)}</TableCell>
                                                                <TableCell className="text-right">{item.amount.toFixed(2)}€</TableCell>
                                                                <TableCell>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button variant="ghost" size="icon" onClick={() => setEditingVoucherSale(item)}>
                                                                                    <Edit className="w-4 h-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Editar Venta de Bono</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </TableCell>
                                                            </>
                                                        )}
                                                    </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                       ) : (
                           <div className="text-center h-24 flex items-center justify-center">
                                Este cliente no tiene citas registradas.
                           </div>
                       )}
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
            
            <EditVoucherSaleDialog
                sale={editingVoucherSale}
                onOpenChange={() => setEditingVoucherSale(null)}
                onVoucherSaleUpdated={handleVoucherSaleUpdated}
            />

            <NewAppointmentConfirmationDialog
                voucherPurchaseData={voucherPurchaseData}
                onOpenChange={() => setVoucherPurchaseData(null)}
            />

        </div>
    );
}
