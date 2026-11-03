

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format, set, parse, addMinutes, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Appointment, Client, Service } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Tag } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useAppData } from '@/context/app-data-context';

const appointmentSchema = z.object({
  clientName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  clientPhone: z.string().min(9, { message: 'Por favor, introduce un número de teléfono válido.' }),
  date: z.date({ required_error: 'La fecha es obligatoria.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm).' }),
  notes: z.string().optional(),
  serviceId: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

type AppointmentFormProps = {
  onSubmit: (data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>) => void;
  appointment?: Appointment;
  selectedDate?: Date;
};

export function AppointmentForm({ onSubmit, appointment, selectedDate }: AppointmentFormProps) {
  const { clients, services, blockedDays, appointments } = useAppData();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [selectedClientId, setSelectedClientId] = React.useState<string>('');
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientName: appointment?.clientName || '',
      clientPhone: appointment?.clientPhone || '+34 ',
      date: appointment?.dateTime ? new Date(appointment.dateTime) : (selectedDate ? new Date(selectedDate) : new Date()),
      time: appointment ? format(new Date(appointment.dateTime), 'HH:mm') : (selectedDate ? format(new Date(selectedDate), 'HH:mm') : '10:00'),
      notes: appointment?.notes || '',
      serviceId: appointment?.serviceId || services[0]?.id || undefined,
    },
  });

  React.useEffect(() => {
    if (appointment) {
      form.reset({
        clientName: appointment.clientName || '',
        clientPhone: appointment.clientPhone || '+34 ',
        date: appointment.dateTime ? new Date(appointment.dateTime) : (selectedDate ? new Date(selectedDate) : new Date()),
        time: appointment.dateTime ? format(new Date(appointment.dateTime), 'HH:mm') : '10:00',
        notes: appointment.notes || '',
        serviceId: appointment.serviceId || services[0]?.id || undefined,
      });
      const matchingClient = clients.find(c => 
        `${c.name} ${c.lastName || ''}`.trim().toLowerCase() === (appointment.clientName || '').toLowerCase() ||
        (appointment.clientPhone && c.phone === appointment.clientPhone)
      );
      if (matchingClient) {
        setSelectedClientId(matchingClient.id);
      }
    } else {
      setSelectedClientId('');
      form.reset({
        clientName: '',
        clientPhone: '+34 ',
        date: selectedDate ? new Date(selectedDate) : new Date(),
        time: selectedDate ? format(new Date(selectedDate), 'HH:mm') : '10:00',
        notes: '',
        serviceId: services[0]?.id || undefined,
      });
    }
  }, [appointment, selectedDate]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      const fullName = `${selectedClient.name} ${selectedClient.lastName || ''}`.trim();
      form.setValue('clientName', fullName, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      form.setValue('clientPhone', selectedClient.phone || '+34 ', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  
  const handleSubmit = (values: AppointmentFormValues) => {
    const [hours, minutes] = values.time.split(':').map(Number);
    const combinedDateTime = set(values.date, { hours, minutes });
    const selectedService = services.find(s => s.id === values.serviceId);
    
    onSubmit({
      clientName: values.clientName,
      clientPhone: values.clientPhone,
      dateTime: combinedDateTime,
      notes: values.notes || '',
      serviceId: values.serviceId,
      serviceName: selectedService?.name,
      servicePrice: selectedService?.price,
      duration: selectedService?.duration || 60,
    });
  };

  const blockedDates = React.useMemo(() => 
    blockedDays.map(dayStr => parse(dayStr, 'yyyy-MM-dd', new Date())),
  [blockedDays]);

  const serviceId = form.watch('serviceId');
  const selectedService = services.find(s => s.id === serviceId);
  const serviceDuration = selectedService?.duration || 60; // Default to 60 mins if no service selected

  const timeSlots = React.useMemo(() => {
    const slots = [];
    const date = form.watch('date');
    if (!date) return [];
    
    const dayAppointments = appointments.filter(a => 
      a.id !== appointment?.id && 
      format(a.dateTime, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      a.status === 'scheduled'
    );

    for (let i = 8; i < 21; i++) { // From 8:00 to 20:45
      for (let j = 0; j < 60; j += 15) {
        const slotTime = set(date, { hours: i, minutes: j });
        const slotEndTime = addMinutes(slotTime, serviceDuration);

        let isOverlapping = false;
        for (const apt of dayAppointments) {
          const aptService = services.find(s => s.id === apt.serviceId);
          const aptDuration = aptService?.duration || 60;
          const aptEndTime = addMinutes(apt.dateTime, aptDuration);

          if (
            (isBefore(slotTime, aptEndTime) && isBefore(apt.dateTime, slotEndTime))
          ) {
            isOverlapping = true;
            break;
          }
        }

        if (!isOverlapping) {
          slots.push(format(slotTime, 'HH:mm'));
        }
      }
    }
    // ensure the current appointment time is in the list if editing
    if (appointment) {
        const appointmentTime = format(appointment.dateTime, 'HH:mm');
        if (!slots.includes(appointmentTime)) {
            slots.push(appointmentTime);
            slots.sort();
        }
    }
    
    return slots;
  }, [form.watch('date'), appointments, serviceDuration, appointment, services]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
        {clients.length > 0 && (
            <div className="space-y-2">
              <Label>Seleccionar Cliente Existente</Label>
              <Select value={selectedClientId} onValueChange={handleClientChange}>
                  <SelectTrigger>
                      <SelectValue placeholder="Elegir de la lista para autocompletar" />
                  </SelectTrigger>
                  <SelectContent>
                      {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                              {`${client.name} ${client.lastName || ''}`.trim()}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>

              {selectedClient?.voucher && selectedClient.voucher.sessions > 0 && (
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <span>⭐ Bono activo disponible</span>
                  <span className="font-bold">{selectedClient.voucher.sessions} {selectedClient.voucher.sessions === 1 ? 'sesión restante' : 'sesiones restantes'}</span>
                </div>
              )}
            </div>
        )}

        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Cliente</FormLabel>
              <FormControl>
                <Input placeholder="p. ej., Ana Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono del Cliente</FormLabel>
              <FormControl>
                <Input placeholder="+34 123 456 789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {services.length > 0 && (
             <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Tag className="w-4 h-4"/>Servicio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un servicio" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {services.map(service => (
                                    <SelectItem key={service.id} value={service.id}>
                                        {service.name} ({service.duration} min)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        )}

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Fecha</FormLabel>
                <div className="flex items-center gap-1.5">
                    <FormControl>
                        <Input 
                            type="date"
                            className="flex-1 font-semibold text-sm bg-background border-input shadow-sm"
                            value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const [y, m, d] = e.target.value.split('-').map(Number);
                                    field.onChange(new Date(y, m - 1, d));
                                }
                            }}
                        />
                    </FormControl>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                            type="button"
                            variant={"outline"}
                            size="icon"
                            className="shrink-0 h-10 w-10 border-primary/30 shadow-sm"
                            title="Calendario visual"
                            >
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[100]" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(newDate) => {
                                if (newDate) {
                                    field.onChange(newDate);
                                    setIsCalendarOpen(false);
                                }
                            }}
                            initialFocus
                            locale={es}
                            disabled={blockedDates}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una hora" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {timeSlots.map(slot => (
                                <SelectItem key={slot} value={slot}>
                                    {slot}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea placeholder="p. ej., Enfocarse en cuello y hombros." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">{appointment ? 'Actualizar Cita' : 'Crear Cita'}</Button>
      </form>
    </Form>
  );
}

    