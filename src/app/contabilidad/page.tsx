
'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type DateRange } from 'react-day-picker';
import { format, startOfYear, subDays, subMonths, isWithinInterval, endOfDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment, Payment, VoucherSale } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Calculator, Printer, Euro, FileText, Gift, CreditCard, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { SplashScreen } from '@/components/layout/splash-screen';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { VoucherSaleDialog } from '@/components/voucher-sale-dialog';
import { OfferDialog } from '@/components/offer-dialog';

const APPOINTMENTS_STORAGE_KEY = 'quiroagenda_appointments';
const VOUCHER_SALES_STORAGE_KEY = 'quiroagenda_voucher_sales';

type Transaction = (Appointment & { type: 'appointment' }) | (VoucherSale & { type: 'voucher_sale' });

export default function ContabilidadPage() {
    const [isClient, setIsClient] = React.useState(false);
    const [allAppointments, setAllAppointments] = React.useState<Appointment[]>([]);
    const [allVoucherSales, setAllVoucherSales] = React.useState<VoucherSale[]>([]);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [isVoucherSaleDialogOpen, setIsVoucherSaleDialogOpen] = React.useState(false);
    const [isOfferDialogOpen, setIsOfferDialogOpen] = React.useState(false);

    const loadData = React.useCallback(() => {
        try {
            const storedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
            if (storedAppointments) {
                const parsedAppointments = JSON.parse(storedAppointments)
                    .map((apt: any) => ({
                        ...apt,
                        dateTime: new Date(apt.dateTime),
                        status: apt.status || 'scheduled',
                        payment: apt.payment || undefined,
                    }))
                    .filter((apt: Appointment) => apt.dateTime && !isNaN(apt.dateTime.getTime()) && apt.status === 'completed');
                setAllAppointments(parsedAppointments);
            }
            const storedVoucherSales = localStorage.getItem(VOUCHER_SALES_STORAGE_KEY);
            if (storedVoucherSales) {
                const parsedVoucherSales = JSON.parse(storedVoucherSales)
                    .map((sale: any) => ({
                        ...sale,
                        date: new Date(sale.date),
                    }));
                setAllVoucherSales(parsedVoucherSales);
            }
        } catch (error) {
            console.error("Failed to load data.", error);
        }
        setIsClient(true);
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);
    
    const filteredTransactions = React.useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return [];
        }
        
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to);

        const completedAppointments: Transaction[] = allAppointments
            .filter(apt => isWithinInterval(apt.dateTime, { start, end }))
            .map(apt => ({ ...apt, type: 'appointment' }));
        
        const voucherSalesInRange: Transaction[] = allVoucherSales
            .filter(sale => isWithinInterval(sale.date, { start, end }))
            .map(sale => ({ ...sale, type: 'voucher_sale' }));

        return [...completedAppointments, ...voucherSalesInRange]
            .sort((a, b) => (b.type === 'appointment' ? b.dateTime.getTime() : b.date.getTime()) - (a.type === 'appointment' ? a.dateTime.getTime() : a.date.getTime()));
            
    }, [allAppointments, allVoucherSales, dateRange]);

    const financialSummary = React.useMemo(() => {
        const summary = {
            totalRevenue: 0,
            cashRevenue: 0,
            bizumRevenue: 0,
            paypalRevenue: 0,
            vouchersUsed: 0,
            completedAppointments: 0,
        };

        for (const transaction of filteredTransactions) {
            if (transaction.type === 'appointment') {
                summary.completedAppointments += 1;
                if (transaction.payment) {
                     if (transaction.payment.method === 'cash' || transaction.payment.method === 'bizum' || transaction.payment.method === 'paypal') {
                        summary.totalRevenue += transaction.payment.amount;
                        if (transaction.payment.method === 'cash') summary.cashRevenue += transaction.payment.amount;
                        else if (transaction.payment.method === 'bizum') summary.bizumRevenue += transaction.payment.amount;
                        else if (transaction.payment.method === 'paypal') summary.paypalRevenue += transaction.payment.amount;
                    } else if (transaction.payment.method === 'voucher') {
                        summary.vouchersUsed += 1;
                    }
                }
            } else if (transaction.type === 'voucher_sale') {
                summary.totalRevenue += transaction.amount;
                if (transaction.paymentMethod === 'cash') summary.cashRevenue += transaction.amount;
                else if (transaction.paymentMethod === 'bizum') summary.bizumRevenue += transaction.amount;
                else if (transaction.paymentMethod === 'paypal') summary.paypalRevenue += transaction.amount;
            }
        }
        return summary;
    }, [filteredTransactions]);

    const chartData = [
        { name: 'Efectivo', value: financialSummary.cashRevenue, fill: 'hsl(var(--chart-1))' },
        { name: 'Bizum', value: financialSummary.bizumRevenue, fill: 'hsl(var(--chart-2))' },
        { name: 'PayPal', value: financialSummary.paypalRevenue, fill: 'hsl(var(--chart-3))' },
    ].filter(d => d.value > 0);

    const chartConfig = {
      efectivo: { label: "Efectivo", color: "hsl(var(--chart-1))" },
      bizum: { label: "Bizum", color: "hsl(var(--chart-2))" },
      paypal: { label: "PayPal", color: "hsl(var(--chart-3))" },
    };

    const setPresetRange = (preset: 'lastWeek' | 'lastMonth' | 'yearToDate') => {
        const today = new Date();
        let fromDate: Date;
        
        switch (preset) {
            case 'lastWeek':
                fromDate = subDays(today, 6);
                break;
            case 'lastMonth':
                fromDate = subMonths(today, 1);
                break;
            case 'yearToDate':
                fromDate = startOfYear(today);
                break;
        }
        
        setDateRange({ from: fromDate, to: today });
    };

    const handlePrint = () => {
        window.print();
    };

    const onVoucherSold = () => {
        loadData(); // Re-fetch data to reflect the new sale
    }

    if (!isClient) {
        return <SplashScreen />;
    }

    return (
        <>
            <div className="flex flex-col min-h-screen bg-background text-foreground font-body contabilidad-page-container">
                <AppHeader className="no-print" />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6 no-print">
                        <h1 className="text-3xl font-bold font-headline text-primary">Contabilidad</h1>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setIsVoucherSaleDialogOpen(true)}>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Vender Bono
                            </Button>
                            <Button variant="outline" onClick={() => setIsOfferDialogOpen(true)}>
                                <Gift className="h-4 w-4 mr-2" />
                                Crear Oferta
                            </Button>
                            {dateRange?.from && dateRange.to && (
                                <Button variant="outline" onClick={handlePrint}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimir Listado
                                </Button>
                            )}
                        </div>
                    </div>

                    <Card className="mb-6 shadow-md no-print">
                        <CardHeader>
                            <CardTitle>Seleccionar Rango de Fechas</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full sm:w-[300px] justify-start text-left font-normal",
                                            !dateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                                    {format(dateRange.to, "LLL dd, y", { locale: es })}
                                                </>
                                            ) : (
                                                format(dateRange.from, "LLL dd, y", { locale: es })
                                            )
                                        ) : (
                                            <span>Elige un rango de fechas</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                            <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => setPresetRange('lastWeek')}>Última semana</Button>
                            <Button variant="outline" onClick={() => setPresetRange('lastMonth')}>Último mes</Button>
                            <Button variant="outline" onClick={() => setPresetRange('yearToDate')}>Este año</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {dateRange?.from && dateRange?.to ? (
                        <div className="space-y-6 printable-area">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 no-print">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                                        <Euro className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{financialSummary.totalRevenue.toFixed(2)}€</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Citas Completadas</CardTitle>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{financialSummary.completedAppointments}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Bonos Usados</CardTitle>
                                        <Gift className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{financialSummary.vouchersUsed}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Ingresos en Efectivo</CardTitle>
                                        <Euro className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{financialSummary.cashRevenue.toFixed(2)}€</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                                <Card className="shadow-md lg:col-span-3 printable-content">
                                    <CardHeader>
                                        <CardTitle>Detalle de Movimientos</CardTitle>
                                        <CardDescription>
                                            Período del {format(dateRange.from, "P", { locale: es })} al {format(dateRange.to, "P", { locale: es })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Concepto</TableHead>
                                                    <TableHead>Método Pago</TableHead>
                                                    <TableHead className="text-right">Importe</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredTransactions.length > 0 ? (
                                                    filteredTransactions.map(item => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">{format(item.type === 'appointment' ? item.dateTime : item.date, "P", { locale: es })}</TableCell>
                                                            <TableCell>{item.clientName}</TableCell>
                                                            <TableCell className='flex items-center gap-2'>
                                                                {item.type === 'appointment' ? <CreditCard className="w-4 h-4 text-muted-foreground"/> : <ShoppingCart className="w-4 h-4 text-muted-foreground"/>}
                                                                {item.type === 'appointment' ? 'Cita' : `Bono ${item.sessions} sesiones`}
                                                            </TableCell>
                                                            <TableCell className="capitalize">{item.type === 'appointment' ? (item.payment?.method === 'cash' ? 'Efectivo' : item.payment?.method === 'bizum' ? 'Bizum' : item.payment?.method === 'paypal' ? 'PayPal' : 'Bono') : (item.paymentMethod === 'cash' ? 'Efectivo' : item.paymentMethod === 'bizum' ? 'Bizum' : 'PayPal')}</TableCell>
                                                            <TableCell className="text-right">{(item.type === 'appointment' ? item.payment?.amount : item.amount) ? `${(item.type === 'appointment' ? item.payment?.amount ?? 0 : item.amount).toFixed(2)}€` : 'N/A'}</TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-24 text-center">No se encontraron movimientos en este período.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow>
                                                    <TableCell colSpan={4} className="font-bold text-lg">Total Ingresos</TableCell>
                                                    <TableCell className="text-right font-bold text-lg">{financialSummary.totalRevenue.toFixed(2)}€</TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-md lg:col-span-2 no-print">
                                    <CardHeader>
                                        <CardTitle>Ingresos por Método</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {chartData.length > 0 ? (
                                        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60}>
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                            </ResponsiveContainer>
                                        </ChartContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                                No hay datos para mostrar.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed rounded-lg no-print">
                            <Calculator className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold text-muted-foreground">Selecciona un rango de fechas.</h3>
                            <p className="text-muted-foreground mt-1">Elige un período para ver el resumen de contabilidad.</p>
                        </div>
                    )}
                </main>
            </div>
            <VoucherSaleDialog
                isOpen={isVoucherSaleDialogOpen}
                onOpenChange={setIsVoucherSaleDialogOpen}
                onVoucherSold={onVoucherSold}
            />
            <OfferDialog
                isOpen={isOfferDialogOpen}
                onOpenChange={setIsOfferDialogOpen}
            />
        </>
    );
}

    