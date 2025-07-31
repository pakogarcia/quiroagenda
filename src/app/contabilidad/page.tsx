
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
import { CalendarIcon, Calculator, Printer, Euro, FileText, Gift, CreditCard, ShoppingCart, AlertCircle, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { SplashScreen } from '@/components/layout/splash-screen';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip } from 'recharts';
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
                    .filter((apt: Appointment) => apt.dateTime && !isNaN(apt.dateTime.getTime())); // Get all appointments first
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
    
    const filteredAppointments = React.useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return [];
        }
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to);

        return allAppointments.filter(apt => isWithinInterval(apt.dateTime, { start, end }));
    }, [allAppointments, dateRange]);

    const filteredTransactions = React.useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return [];
        }
        
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to);
        
        const completedAppointmentsInRange: Transaction[] = filteredAppointments
            .filter(apt => apt.status === 'completed')
            .map(apt => ({ ...apt, type: 'appointment' }));
        
        const voucherSalesInRange: Transaction[] = allVoucherSales
            .filter(sale => isWithinInterval(sale.date, { start, end }))
            .map(sale => ({ ...sale, type: 'voucher_sale' }));

        return [...completedAppointmentsInRange, ...voucherSalesInRange]
            .sort((a, b) => (b.type === 'appointment' ? b.dateTime.getTime() : b.date.getTime()) - (a.type === 'appointment' ? a.dateTime.getTime() : a.date.getTime()));
            
    }, [filteredAppointments, allVoucherSales, dateRange]);

    const financialSummary = React.useMemo(() => {
        const summary = {
            totalRevenue: 0,
            cashRevenue: 0,
            bizumRevenue: 0,
            paypalRevenue: 0,
            vouchersUsed: 0,
            completedAppointments: 0,
            pendingPayments: 0,
            revenueByService: {} as { [key: string]: number },
        };
        
        const completedAppointmentsInRange = filteredAppointments.filter(apt => apt.status === 'completed');

        for (const transaction of completedAppointmentsInRange) {
            summary.completedAppointments += 1;
            if (transaction.payment) {
                if (transaction.payment.method === 'cash' || transaction.payment.method === 'bizum' || transaction.payment.method === 'paypal') {
                    summary.totalRevenue += transaction.payment.amount;
                    if (transaction.payment.method === 'cash') summary.cashRevenue += transaction.payment.amount;
                    else if (transaction.payment.method === 'bizum') summary.bizumRevenue += transaction.payment.amount;
                    else if (transaction.payment.method === 'paypal') summary.paypalRevenue += transaction.payment.amount;

                    const serviceName = transaction.serviceName || 'Otros';
                    summary.revenueByService[serviceName] = (summary.revenueByService[serviceName] || 0) + transaction.payment.amount;
                } else if (transaction.payment.method === 'voucher') {
                    summary.vouchersUsed += 1;
                }
            } else {
                 summary.pendingPayments += 1;
            }
        }
        
        for (const sale of allVoucherSales) {
             if (dateRange?.from && dateRange?.to && isWithinInterval(sale.date, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) })) {
                if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'bizum' || sale.paymentMethod === 'paypal') {
                    summary.totalRevenue += sale.amount;
                    if (sale.paymentMethod === 'cash') summary.cashRevenue += sale.amount;
                    else if (sale.paymentMethod === 'bizum') summary.bizumRevenue += sale.amount;
                    else if (sale.paymentMethod === 'paypal') summary.paypalRevenue += sale.amount;
                }
             }
        }

        return summary;
    }, [filteredAppointments, allVoucherSales, dateRange]);
    
    const totalPaymentRevenue = financialSummary.cashRevenue + financialSummary.bizumRevenue + financialSummary.paypalRevenue;
    const paymentChartData = [
        { name: 'Efectivo', value: financialSummary.cashRevenue, fill: 'hsl(var(--chart-1))' },
        { name: 'Bizum', value: financialSummary.bizumRevenue, fill: 'hsl(var(--chart-2))' },
        { name: 'PayPal', value: financialSummary.paypalRevenue, fill: 'hsl(var(--chart-3))' },
    ].filter(d => d.value > 0);
    
    const totalServiceRevenue = Object.values(financialSummary.revenueByService).reduce((acc, v) => acc + v, 0);
    const serviceChartData = Object.entries(financialSummary.revenueByService).map(([name, value], index) => ({
        name,
        value,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`
    })).filter(d => d.value > 0);

    const chartConfig = {
      efectivo: { label: "Efectivo" },
      bizum: { label: "Bizum" },
      paypal: { label: "PayPal" },
    };
    
    const serviceChartConfig = serviceChartData.reduce((acc, entry) => {
        acc[entry.name] = { label: entry.name };
        return acc;
    }, {} as any);

    const renderCustomizedLabelWithName = ({ cx, cy, midAngle, innerRadius, outerRadius, payload, name, percent, index }: any, data: any[]) => {
        if (data.length === 1) {
            return (
                <text x={cx} y={cy} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                    {name}
                </text>
            );
        }
        
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                {payload.name}
            </text>
        );
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
    
    const getPaymentMethodName = (method?: 'cash' | 'bizum' | 'paypal' | 'voucher') => {
        if (!method) return '';
        switch (method) {
            case 'cash': return 'Efectivo';
            case 'voucher': return 'Bono';
            case 'bizum': return 'Bizum';
            case 'paypal': return 'PayPal';
            default: return method;
        }
    };


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
                                <ShoppingCart className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Vender Bono</span>
                            </Button>
                            <Button variant="outline" onClick={() => setIsOfferDialogOpen(true)}>
                                <Gift className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Crear Oferta</span>
                            </Button>
                            {dateRange?.from && dateRange.to && (
                                <Button variant="outline" onClick={handlePrint}>
                                    <Printer className="h-4 w-4 md:mr-2" />
                                    <span className="hidden md:inline">Imprimir</span>
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
                        <>
                            <div className="space-y-6 printable-area">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 no-print">
                                    <Card className="bg-primary text-primary-foreground">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                                            <Euro className="h-4 w-4 text-primary-foreground/70" />
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
                                            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{financialSummary.pendingPayments}</div>
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                    <Card className="shadow-md lg:col-span-3 printable-content">
                                        <CardHeader>
                                            <CardTitle>Detalle de Movimientos</CardTitle>
                                            <CardDescription>
                                                Período del {format(dateRange.from, "P", { locale: es })} al {format(dateRange.to, "P", { locale: es })}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-x-auto">
                                                <Table className="min-w-[600px]">
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
                                                                        {item.type === 'appointment' ? (item.serviceName || 'Cita') : `Bono ${item.sessions} sesiones`}
                                                                    </TableCell>
                                                                    <TableCell className="capitalize">{getPaymentMethodName(item.type === 'appointment' ? item.payment?.method : item.paymentMethod)}</TableCell>
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
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <div className="lg:col-span-2 space-y-6 no-print">
                                        <Card className="shadow-md">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5"/>Ingresos por Método</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {paymentChartData.length > 0 ? (
                                                <div className="mx-auto aspect-square h-[250px]">
                                                    <PieChart width={250} height={250}>
                                                        <Tooltip
                                                            cursor={false}
                                                            content={<ChartTooltipContent hideLabel />}
                                                        />
                                                        <Pie 
                                                            data={paymentChartData} 
                                                            dataKey="value" 
                                                            nameKey="name" 
                                                            label={(props) => renderCustomizedLabelWithName(props, paymentChartData)}
                                                            labelLine={false}
                                                            outerRadius={100}
                                                        >
                                                            {paymentChartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                                        No hay datos para mostrar.
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                        <Card className="shadow-md">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5"/>Ingresos por Servicio</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {serviceChartData.length > 0 ? (
                                                <div className="mx-auto aspect-square h-[250px]">
                                                    <PieChart width={250} height={250}>
                                                         <Tooltip
                                                            cursor={false}
                                                            content={<ChartTooltipContent hideLabel />}
                                                        />
                                                        <Pie 
                                                            data={serviceChartData} 
                                                            dataKey="value" 
                                                            nameKey="name" 
                                                            label={(props) => renderCustomizedLabelWithName(props, serviceChartData)}
                                                            labelLine={false}
                                                            outerRadius={100}
                                                        >
                                                            {serviceChartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                                        No hay datos para mostrar.
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </>
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

    

    