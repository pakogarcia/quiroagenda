
'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type DateRange } from 'react-day-picker';
import { format, startOfYear, subDays, subMonths, isWithinInterval, endOfDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment, Payment } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Calculator, Printer, Euro, FileText, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { SplashScreen } from '@/components/layout/splash-screen';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const APPOINTMENTS_STORAGE_KEY = 'quiroagenda_appointments';

export default function ContabilidadPage() {
    const [isClient, setIsClient] = React.useState(false);
    const [allAppointments, setAllAppointments] = React.useState<Appointment[]>([]);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

    React.useEffect(() => {
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
                    .filter((apt: Appointment) => apt.dateTime && !isNaN(apt.dateTime.getTime()));
                setAllAppointments(parsedAppointments);
            }
        } catch (error) {
            console.error("Failed to load appointments.", error);
        }
        setIsClient(true);
    }, []);
    
    const filteredAppointments = React.useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return [];
        }
        
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to);

        return allAppointments
            .filter(apt => {
                const aptDate = new Date(apt.dateTime);
                // Only include completed appointments
                return isWithinInterval(aptDate, { start, end }) && apt.status === 'completed';
            })
            .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    }, [allAppointments, dateRange]);

    const financialSummary = React.useMemo(() => {
        const summary = {
            totalRevenue: 0,
            cashRevenue: 0,
            bizumRevenue: 0,
            vouchersUsed: 0,
            completedAppointments: filteredAppointments.length,
        };

        for (const apt of filteredAppointments) {
            if (apt.payment) {
                if (apt.payment.method === 'cash' || apt.payment.method === 'bizum') {
                    summary.totalRevenue += apt.payment.amount;
                    if (apt.payment.method === 'cash') {
                        summary.cashRevenue += apt.payment.amount;
                    } else {
                        summary.bizumRevenue += apt.payment.amount;
                    }
                } else if (apt.payment.method === 'voucher') {
                    summary.vouchersUsed += 1;
                }
            }
        }
        return summary;
    }, [filteredAppointments]);

    const chartData = [
        { name: 'Efectivo', value: financialSummary.cashRevenue, fill: 'hsl(var(--chart-1))' },
        { name: 'Bizum', value: financialSummary.bizumRevenue, fill: 'hsl(var(--chart-2))' },
    ].filter(d => d.value > 0);

    const chartConfig = {
      efectivo: { label: "Efectivo", color: "hsl(var(--chart-1))" },
      bizum: { label: "Bizum", color: "hsl(var(--chart-2))" },
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

    if (!isClient) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-body contabilidad-page-container">
            <AppHeader className="no-print" />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 no-print">
                    <h1 className="text-3xl font-bold font-headline text-primary">Contabilidad</h1>
                    {dateRange?.from && dateRange.to && (
                         <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir Listado
                        </Button>
                    )}
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
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                            <Card className="shadow-md lg:col-span-3 printable-content">
                                <CardHeader>
                                    <CardTitle>Detalle de Citas</CardTitle>
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
                                                <TableHead>Método Pago</TableHead>
                                                <TableHead className="text-right">Importe</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAppointments.length > 0 ? (
                                                filteredAppointments.map(apt => (
                                                    <TableRow key={apt.id}>
                                                        <TableCell className="font-medium">{format(apt.dateTime, "P", { locale: es })}</TableCell>
                                                        <TableCell>{apt.clientName}</TableCell>
                                                        <TableCell className="capitalize">{apt.payment?.method === 'cash' ? 'Efectivo' : apt.payment?.method === 'bizum' ? 'Bizum' : 'Bono'}</TableCell>
                                                        <TableCell className="text-right">{apt.payment?.amount ? `${apt.payment.amount.toFixed(2)}€` : 'N/A'}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">No se encontraron citas pagadas en este período.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={3} className="font-bold text-lg">Total</TableCell>
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
                                            </PieChart>
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
    );
}
