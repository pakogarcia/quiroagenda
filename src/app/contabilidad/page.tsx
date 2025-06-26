'use client';

import * as React from 'react';
import { AppHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type DateRange } from 'react-day-picker';
import { format, startOfYear, subDays, subMonths, isWithinInterval, endOfDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const APPOINTMENTS_STORAGE_KEY = 'quiroagenda_appointments';

export default function ContabilidadPage() {
    const [isClient, setIsClient] = React.useState(false);
    const [allAppointments, setAllAppointments] = React.useState<Appointment[]>([]);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

    React.useEffect(() => {
        try {
            const storedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
            if (storedAppointments) {
                const parsedAppointments = JSON.parse(storedAppointments).map((apt: Omit<Appointment, 'id'> & { dateTime: string }) => ({
                    ...apt,
                    dateTime: new Date(apt.dateTime),
                    status: apt.status || 'scheduled',
                }));
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
                // Only include appointments that have already passed and were not "no-shows"
                return isWithinInterval(aptDate, { start, end }) && aptDate <= new Date() && apt.status !== 'no-show';
            })
            .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    }, [allAppointments, dateRange]);
    
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

    if (!isClient) {
        return <div className="flex h-screen items-center justify-center">Cargando...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground font-body">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold font-headline text-primary">Contabilidad</h1>
                </div>

                <Card className="mb-6 shadow-md">
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
                                    disabled={{ after: new Date() }}
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
                    <div className="space-y-6">
                        <Card className="shadow-md">
                             <CardHeader>
                                <CardTitle>Resumen del Período</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {filteredAppointments.length}
                                    <span className="text-lg font-normal text-muted-foreground ml-2">citas completadas</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-md">
                            <CardHeader>
                                <CardTitle>Detalle de Citas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha y Hora</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Notas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAppointments.length > 0 ? (
                                            filteredAppointments.map(apt => (
                                                <TableRow key={apt.id}>
                                                    <TableCell className="font-medium">{format(apt.dateTime, "PPP p", { locale: es })}</TableCell>
                                                    <TableCell>{apt.clientName}</TableCell>
                                                    <TableCell className="text-muted-foreground">{apt.notes}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center">No se encontraron citas en este período.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed rounded-lg">
                        <Calculator className="w-16 h-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-semibold text-muted-foreground">Selecciona un rango de fechas.</h3>
                        <p className="text-muted-foreground mt-1">Elige un período para ver el resumen de contabilidad.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
