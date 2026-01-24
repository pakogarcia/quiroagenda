

'use client';

import * as React from 'react';
import { type TimeSlot, Appointment, Service } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { format, isBefore, isSameDay, startOfToday } from 'date-fns';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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
                ? <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" />Completada</Badge>
                : <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-500"><AlertCircle className="w-3 h-3" />Pendiente Pago</Badge>;
          case 'no-show': 
            return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />No Presentado</Badge>;
          case 'scheduled':
          default:
            return null;
        }
    }

    return (
        <div className="space-y-1 relative pr-4">
            <AnimatePresence>
                {slots.map((slot, index) => {
                    const today = startOfToday();
                    const appointmentTime = slot.appointment?.dateTime;
                    const isPast = appointmentTime && (isBefore(appointmentTime, today) && !isSameDay(appointmentTime, today));

                    if (slot.isBooked && slot.appointment) {
                        const service = services.find(s => s.id === slot.appointment?.serviceId);
                        const duration = service?.duration || 60;
                        const durationInSlots = Math.max(1, Math.ceil(duration / 15));
                        const height = `calc(${durationInSlots} * 2.5rem + ${durationInSlots - 1} * 0.25rem)`;
                        
                        return (
                            <motion.div
                                key={slot.appointment.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute w-full pl-16"
                                style={{
                                    top: `calc(${index} * (2.5rem + 0.25rem))`, // 2.5rem height + 0.25rem gap
                                    height: height,
                                }}
                            >
                                <Card
                                    className={cn(
                                        'h-full flex flex-col justify-center p-3 cursor-pointer hover:bg-opacity-90 transition-all text-sm',
                                        slot.appointment.status === 'scheduled' && !isPast && 'bg-primary text-primary-foreground hover:bg-primary/90',
                                        isPast && 'bg-muted text-muted-foreground',
                                        slot.appointment.status === 'completed' && 'bg-green-50 border-green-200 text-green-900',
                                        slot.appointment.status === 'no-show' && 'bg-red-50 border-red-200 text-red-900',
                                    )}
                                    onClick={() => onAppointmentClick(slot.appointment)}
                                >
                                    <div className="font-bold truncate">{slot.appointment.clientName}</div>
                                    {slot.appointment.serviceName && <p className="opacity-90 truncate">{slot.appointment.serviceName}</p>}
                                    
                                    {slot.appointment.status !== 'scheduled' && (
                                        <div className="mt-1">
                                            {getStatusBadge(slot.appointment.status, slot.appointment.payment)}
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    }
                    
                    if (!slot.isBooked) {
                        return (
                           <motion.div
                            key={slot.time}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { delay: index * 0.02 } }}
                           >
                             <div
                                className="flex items-center gap-4 h-10"
                            >
                                <span className="text-xs text-muted-foreground w-12 text-right">{slot.time}</span>
                                <div 
                                    className="flex-1 h-px bg-border border-dashed hover:border-solid hover:border-primary hover:bg-primary/10 cursor-pointer rounded-md transition-all"
                                    onClick={() => onSlotClick(slot.time)}
                                ></div>
                             </div>
                           </motion.div>
                        );
                    }
                    return null; // Don't render anything for covered slots
                })}
            </AnimatePresence>
             {/* This div is to ensure the container has the correct total height based on all potential slots */}
            <div style={{ height: `calc(${slots.length} * (2.5rem + 0.25rem))` }} aria-hidden="true" />
        </div>
    );
}

    