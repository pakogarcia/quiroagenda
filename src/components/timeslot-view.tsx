'use client';

import * as React from 'react';
import { type TimeSlot, Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { isBefore, isSameDay, startOfToday } from 'date-fns';
import { AlertCircle, CheckCircle, XCircle, Clock, Edit, Trash2, Euro } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type TimeSlotViewProps = {
    slots: TimeSlot[];
    onSlotClick: (time: string) => void;
    onAppointmentClick: (appointment?: Appointment) => void;
    onEditAppointment: (appointment: Appointment) => void;
    onDeleteAppointment: (id: string) => void;
    onFinishAppointment: (appointment: Appointment) => void;
};

export function TimeSlotView({ 
    slots, 
    onSlotClick, 
    onAppointmentClick,
    onEditAppointment,
    onDeleteAppointment,
    onFinishAppointment
}: TimeSlotViewProps) {
    
    if (slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mt-1">No hay huecos disponibles para este día. Revisa tu horario en "Quién Eres".</p>
            </div>
        )
    }

    const getStatusBadge = (status: Appointment['status'], payment?: Appointment['payment']) => {
        switch (status) {
          case 'completed': 
            return payment 
                ? <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3" />Pagado</Badge>
                : <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-500 font-bold shadow-sm">PENDIENTE</Badge>;
          case 'no-show': 
            return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />No Presentado</Badge>;
          default:
            return null;
        }
    }

    const ROW_HEIGHT = 2.5; 
    const GAP = 0.25;

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-1 relative pr-4 select-none">
                {slots.map((slot, index) => {
                    const today = startOfToday();
                    const isPast = slot.appointment?.dateTime && (isBefore(slot.appointment.dateTime, today) && !isSameDay(slot.appointment.dateTime, today));
                    const isUnpaid = slot.appointment && (slot.appointment.status === 'scheduled' || (slot.appointment.status === 'completed' && !slot.appointment.payment));

                    return (
                        <div 
                            key={`${slot.time}-${index}`} 
                            className="relative flex items-center gap-4 h-10 group"
                        >
                            <span className="text-xs font-medium text-muted-foreground w-12 text-right shrink-0">
                                {slot.time}
                            </span>

                            <div 
                                className={cn(
                                    "flex-1 h-px bg-border border-dashed transition-all rounded-full cursor-pointer",
                                    !slot.isBooked && "group-hover:h-2 group-hover:bg-primary/10 group-hover:border-solid group-hover:border-primary/30"
                                )}
                                onClick={() => !slot.isBooked && onSlotClick(slot.time)}
                            />

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
                                            'h-full flex flex-col justify-between p-3 cursor-pointer hover:shadow-xl transition-all text-sm border-l-4 overflow-hidden group/card bg-white shadow-md',
                                            slot.appointment.status === 'scheduled' && !isPast && 'bg-primary/5 border-l-primary',
                                            isPast && slot.appointment.status === 'scheduled' && 'bg-muted/30 border-l-muted-foreground/30',
                                            slot.appointment.status === 'completed' && 'bg-green-50 border-l-green-500',
                                            slot.appointment.status === 'no-show' && 'bg-red-50 border-l-red-500',
                                        )}
                                        onClick={() => onAppointmentClick(slot.appointment)}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <p className={cn("font-bold truncate text-base", 
                                                    slot.appointment.status === 'scheduled' && !isPast ? "text-primary" : "text-slate-900"
                                                )}>
                                                    {slot.appointment.clientName}
                                                </p>
                                                <p className="text-sm font-bold text-slate-700 truncate flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3.5 h-3.5" /> {slot.appointment.serviceName || 'Cita'} ({slot.duration} min)
                                                </p>
                                            </div>
                                            <div className="shrink-0">
                                                {getStatusBadge(slot.appointment.status, slot.appointment.payment)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 mt-auto pt-1 opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity">
                                            {isUnpaid && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            size="icon" 
                                                            className="h-8 w-8 bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                                                            onClick={(e) => { e.stopPropagation(); onFinishAppointment(slot.appointment!); }}
                                                        >
                                                            <Euro className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Registrar Pago / Finalizar</p></TooltipContent>
                                                </Tooltip>
                                            )}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        size="icon" 
                                                        className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                                        onClick={(e) => { e.stopPropagation(); onEditAppointment(slot.appointment!); }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Editar Cita</p></TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        size="icon" 
                                                        className="h-8 w-8 bg-red-600 hover:bg-red-700 text-white shadow-md"
                                                        onClick={(e) => { e.stopPropagation(); onDeleteAppointment(slot.appointment!.id); }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Eliminar Cita</p></TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}