'use client';

import * as React from 'react';
import { type TimeSlot, Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { isBefore, isSameDay, startOfToday } from 'date-fns';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAppData } from '@/context/app-data-context';

type TimeSlotViewProps = {
    slots: TimeSlot[];
    onSlotClick: (time: string) => void;
    onAppointmentClick: (appointment?: Appointment) => void;
};

export function TimeSlotView({ slots, onSlotClick, onAppointmentClick }: TimeSlotViewProps) {
    const { services } = useAppData();
    
    if (slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mt-1">No hay huecos disponibles para este día.</p>
            </div>
        )
    }

    const getStatusBadge = (status: Appointment['status'], payment?: Appointment['payment']) => {
        switch (status) {
          case 'completed': 
            return payment 
                ? <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3" />Pagado</Badge>
                : <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-500"><AlertCircle className="w-3 h-3" />Pendiente</Badge>;
          case 'no-show': 
            return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />No Presentado</Badge>;
          default:
            return null;
        }
    }

    // Altura de cada fila de 15 minutos en rem
    const ROW_HEIGHT = 2.5; 
    const GAP = 0.25;

    return (
        <div className="flex flex-col gap-1 relative pr-4 select-none">
            {slots.map((slot, index) => {
                const today = startOfToday();
                const isPast = slot.appointment?.dateTime && (isBefore(slot.appointment.dateTime, today) && !isSameDay(slot.appointment.dateTime, today));

                return (
                    <div 
                        key={`${slot.time}-${index}`} 
                        className="relative flex items-center gap-4 h-10 group"
                    >
                        {/* Etiqueta de hora */}
                        <span className="text-xs font-medium text-muted-foreground w-12 text-right shrink-0">
                            {slot.time}
                        </span>

                        {/* Línea divisoria y área clicable */}
                        <div 
                            className={cn(
                                "flex-1 h-px bg-border border-dashed transition-all rounded-full cursor-pointer",
                                !slot.isBooked && "group-hover:h-2 group-hover:bg-primary/10 group-hover:border-solid group-hover:border-primary/30"
                            )}
                            onClick={() => !slot.isBooked && onSlotClick(slot.time)}
                        />

                        {/* Caja de la Cita (solo si este es el inicio de la cita) */}
                        {slot.appointment && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="absolute left-16 right-0 z-10"
                                style={{ 
                                    top: 0, 
                                    height: `calc(${Math.ceil((slot.duration || 60) / 15)} * ${ROW_HEIGHT}rem + ${Math.ceil((slot.duration || 60) / 15) - 1} * ${GAP}rem)` 
                                }}
                            >
                                <Card
                                    className={cn(
                                        'h-full flex flex-col justify-start p-3 cursor-pointer hover:shadow-lg transition-all text-sm border-l-4 overflow-hidden',
                                        slot.appointment.status === 'scheduled' && !isPast && 'bg-primary/10 border-l-primary text-primary-foreground hover:bg-primary/15',
                                        isPast && 'bg-muted border-l-muted-foreground/30 text-muted-foreground',
                                        slot.appointment.status === 'completed' && 'bg-green-50 border-l-green-500 text-green-900',
                                        slot.appointment.status === 'no-show' && 'bg-red-50 border-l-red-500 text-red-900',
                                    )}
                                    onClick={() => onAppointmentClick(slot.appointment)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <p className={cn("font-bold truncate", slot.appointment.status === 'scheduled' && !isPast && "text-primary")}>
                                                {slot.appointment.clientName}
                                            </p>
                                            <p className="text-xs opacity-80 truncate flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {slot.appointment.serviceName || 'Cita'} ({slot.duration} min)
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            {getStatusBadge(slot.appointment.status, slot.appointment.payment)}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}