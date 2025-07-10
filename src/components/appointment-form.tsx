
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format, set, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Appointment, Client } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const CLIENTS_STORAGE_KEY = 'quiroagenda_clients';

const appointmentSchema = z.object({
  clientName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  clientPhone: z.string().min(9, { message: 'Por favor, introduce un número de teléfono válido.' }),
  date: z.date({ required_error: 'La fecha es obligatoria.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm).' }),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

type AppointmentFormProps = {
  onSubmit: (data: Omit<Appointment, 'id' | 'reminderSent' | 'status'>) => void;
  appointment?: Appointment;
  selectedDate?: Date;
  blockedDays: string[];
};

export function AppointmentForm({ onSubmit, appointment, selectedDate, blockedDays }: AppointmentFormProps) {
  const [clients, setClients] = React.useState<Client[]>([]);
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientName: appointment?.clientName || '',
      clientPhone: appointment?.clientPhone || '+34 ',
      date: appointment?.dateTime || selectedDate || new Date(),
      time: appointment ? format(appointment.dateTime, 'HH:mm') : '10:00',
      notes: appointment?.notes || '',
    },
  });

  React.useEffect(() => {
    try {
        const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (storedClients) {
            const parsedClients = JSON.parse(storedClients);
            const migratedClients = parsedClients.map((client: any) => ({
                ...client,
                lastName: client.lastName || '',
            }));
            setClients(migratedClients);
        }
    } catch (error) {
        console.error("Failed to load clients.", error);
    }
  }, []);

  const handleClientChange = (clientId: string) => {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
          form.setValue('clientName', `${selectedClient.name} ${selectedClient.lastName || ''}`.trim(), { shouldValidate: true });
          form.setValue('clientPhone', selectedClient.phone, { shouldValidate: true });
      }
  };

  const handleSubmit = (values: AppointmentFormValues) => {
    const [hours, minutes] = values.time.split(':').map(Number);
    const combinedDateTime = set(values.date, { hours, minutes });
    
    onSubmit({
      clientName: values.clientName,
      clientPhone: values.clientPhone,
      dateTime: combinedDateTime,
      notes: values.notes || '',
    });
  };

  const blockedDates = React.useMemo(() => 
    blockedDays.map(dayStr => parse(dayStr, 'yyyy-MM-dd', new Date())),
  [blockedDays]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
        {clients.length > 0 && (
            <div className="space-y-2">
              <Label>Seleccionar Cliente Existente</Label>
              <Select onValueChange={handleClientChange}>
                  <SelectTrigger>
                      <SelectValue placeholder="Elegir de la lista para autocompletar" />
                  </SelectTrigger>
                  <SelectContent>
                      {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                              {`${client.name} ${client.lastName}`}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
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
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Fecha</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP", { locale: es })
                        ) : (
                            <span>Elige una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={es}
                        disabled={blockedDates}
                    />
                    </PopoverContent>
                </Popover>
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
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
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
