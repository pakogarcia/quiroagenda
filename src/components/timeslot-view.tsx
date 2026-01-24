

'use client';

import * as React from 'react';
import { type TimeSlot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { AnimatePresence, motion } from 'framer-motion';

type TimeSlotViewProps = {
    slots: TimeSlot[];
    onSlotClick: (time: string) => void;
    onAppointmentClick: (appointment: TimeSlot['appointment']) => void;
};

export function TimeSlotView({ slots, onSlotClick, onAppointmentClick }: TimeSlotViewProps) {
    
    if (slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mt-1">No hay huecos disponibles para este día.</p>
            </div>
        )
    }

    return (
        <div className="space-y-1 relative">
            <AnimatePresence>
                {slots.map((slot, index) => {
                    if (slot.isBooked && slot.appointment) {
                        const durationInSlots = Math.max(1, Math.ceil((slot.duration || 60) / 15));
                        const height = `calc(${durationInSlots} * 3rem + ${durationInSlots - 1} * 0.25rem)`;
                        
                        return (
                            <motion.div
                                key={slot.appointment.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute w-full"
                                style={{
                                    top: `calc(${index} * (3rem + 0.25rem))`, // 3rem height + 0.25rem gap
                                    height: height,
                                }}
                            >
                                <Card
                                    className="bg-primary text-primary-foreground h-full flex flex-col justify-center p-3 cursor-pointer hover:bg-primary/90 transition-colors"
                                    onClick={() => onAppointmentClick(slot.appointment)}
                                >
                                    <div className="font-bold">{slot.appointment.clientName}</div>
                                    <p className="text-sm opacity-90">{slot.appointment.serviceName || 'Cita'}</p>
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
                                className="flex items-center gap-4 h-12"
                            >
                                <span className="text-sm text-muted-foreground w-12 text-right">{slot.time}</span>
                                <div 
                                    className="flex-1 h-full border-t border-dashed hover:border-solid hover:border-primary hover:bg-primary/10 cursor-pointer rounded-md transition-all"
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
            <div style={{ height: `calc(${slots.length} * (3rem + 0.25rem))` }} aria-hidden="true" />
        </div>
    );
}

