'use client';

import * as React from 'react';
import { type TimeSlot, Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { isBefore, isSameDay, startOfToday } from 'date-fns';
import { CheckCircle, XCircle, Clock, Edit, Trash2, Euro } from 'lucide-react';
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
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                <p className="text-muted-foreground mt-1">No hay huecos disponibles en tus turnos de hoy. Revisa tu configuración horaria.</p>
            </div>
        )
    }

    const getStatusBadge = (status: Appointment['status'], payment?: Appointment['payment']) => {
        switch (status) {
          case 'completed': 
            return payment 
                ? <Badge variant="secondary" className="flex items-center gap-1 bg-green-600 text-white border-green-700 font-black px-2 shadow-sm uppercase text-[10px] tracking-wider"><CheckCircle className="w-3 h-3" />PAGADO</Badge>
                : <Badge variant="outline" className="flex items-center gap-1 bg-amber-500 text-white border-amber-600 font-black px-2 shadow-md uppercase text-[10px] tracking-wider animate-pulse">PENDIENTE</Badge>;
          case 'no-show': 
            return <Badge variant="destructive" className="flex items-center gap-1 font-black px-2 uppercase text-[10px] tracking-wider"><XCircle className="w-3 h-3" />AUSENTE</Badge>;
          default:
            return null;
        }
    }

    const ROW_HEIGHT = 2.5; 
    const GAP = 0.25;

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-1 relative pr-2 select-none pb-20">
                {slots.map((slot, index) => {
                    const today = startOfToday();
                    const isPast = slot.appointment?.dateTime && (isBefore(slot.appointment.dateTime, today) && !isSameDay(slot.appointment.dateTime, today));
                    const isUnpaid = slot.appointment && (slot.appointment.status === 'scheduled' || (slot.appointment.status === 'completed' && !slot.appointment.payment));

                    return (
                        <div 
                            key={`${slot.time}-${index}`} 
                            className="relative flex items-center gap-3 h-10 group"
                        >
                            <span className="text-xs font-black text-slate-900 w-10 text-right shrink-0">
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
                                    className="absolute left-14 right-0 z-10"
                                    style={{ 
                                        top: 0, 
                                        height: `calc(${Math.ceil((slot.duration || 60) / 15)} * ${ROW_HEIGHT}rem + ${Math.ceil((slot.duration || 60) / 15) - 1} * ${GAP}rem)` 
                                    }}
                                >
                                    <Card
                                        className={cn(
                                            'h-full flex flex-col justify-between p-3 cursor-pointer hover:shadow-2xl transition-all text-sm border-l-[6px] overflow-hidden group/card bg-white shadow-lg',
                                            slot.appointment.status === 'scheduled' && !isPast && 'bg-white border-l-primary',
                                            isPast && slot.appointment.status === 'scheduled' && 'bg-muted/30 border-l-muted-foreground/30',
                                            slot.appointment.status === 'completed' && 'bg-green-50/50 border-l-green-600',
                                            slot.appointment.status === 'no-show' && 'bg-red-50 border-l-red-600',
                                        )}
                                        onClick={() => onAppointmentClick(slot.appointment)}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <p className="font-black truncate text-base text-slate-950 leading-tight">
                                                    {slot.appointment.clientName}
                                                </p>
                                                <p className="text-sm font-bold text-slate-800 truncate flex items-center gap-1 mt-1">
                                                    <Clock className="w-3.5 h-3.5 text-primary" /> {slot.appointment.serviceName || 'Cita'}
                                                </p>
                                            </div>
                                            <div className="shrink-0">
                                                {getStatusBadge(slot.appointment.status, slot.appointment.payment)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 mt-auto pt-2">
                                            {isUnpaid && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            size="icon" 
                                                            className="h-10 w-10 bg-amber-500 hover:bg-amber-600 text-white shadow-lg border-none flex-shrink-0 transition-transform active:scale-95"
                                                            onClick={(e) => { e.stopPropagation(); onFinishAppointment(slot.appointment!); }}
                                                        >
                                                            <Euro className="h-5 w-5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p className='font-bold text-amber-950'>Cobrar</p></TooltipContent>
                                                </Tooltip>
                                            )}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        size="icon" 
                                                        className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-none flex-shrink-0 transition-transform active:scale-95"
                                                        onClick={(e) => { e.stopPropagation(); onEditAppointment(slot.appointment!); }}
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p className='font-bold text-blue-950'>Editar</p></TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        size="icon" 
                                                        className="h-10 w-10 bg-red-600 hover:bg-red-700 text-white shadow-lg border-none flex-shrink-0 transition-transform active:scale-95"
                                                        onClick={(e) => { e.stopPropagation(); onDeleteAppointment(slot.appointment!.id); }}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p className='font-bold text-red-950'>Eliminar</p></TooltipContent>
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