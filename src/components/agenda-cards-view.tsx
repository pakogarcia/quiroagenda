'use client';

import * as React from 'react';
import { format, addMinutes, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Edit3, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Appointment, Client, Service, BusinessProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';

type AgendaCardsViewProps = {
  selectedDate: Date;
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  profile: BusinessProfile | null;
  onAppointmentClick: (appointment: Appointment) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onFinishAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onNewAppointment: () => void;
};

export function AgendaCardsView({
  selectedDate,
  appointments,
  clients,
  services,
  profile,
  onAppointmentClick,
  onEditAppointment,
  onFinishAppointment,
  onDeleteAppointment,
  onNewAppointment,
}: AgendaCardsViewProps) {
  const [currentTime, setCurrentTime] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getClientInfo = React.useCallback(
    (apt: Appointment) => {
      const cleanPhone = (apt.clientPhone || '').replace(/\D/g, '');
      const client = clients.find(
        (c) =>
          (apt.clientId && c.id === apt.clientId) ||
          (c.phone && apt.clientPhone && c.phone === apt.clientPhone) ||
          (cleanPhone.length >= 9 &&
            (c.phone || '').replace(/\D/g, '').endsWith(cleanPhone.slice(-9))) ||
          `${c.name} ${c.lastName || ''}`.trim().toLowerCase() ===
            (apt.clientName || '').trim().toLowerCase()
      );
      return client;
    },
    [clients]
  );

  const getDisplayPrice = React.useCallback(
    (apt: Appointment, client?: Client | null) => {
      if (apt.payment) {
        if (apt.payment.method === 'voucher') return 'Bono';
        return `${apt.payment.amount} €`;
      }
      if (apt.servicePrice !== undefined) {
        return `${apt.servicePrice} €`;
      }
      const matchedService = services.find((s) => s.id === apt.serviceId);
      const basePrice = matchedService?.price ?? 0;

      if (client?.discount && client.discount.value > 0) {
        const discountVal =
          client.discount.type === 'percentage'
            ? Math.round((basePrice * (client.discount.value / 100)) * 100) / 100
            : client.discount.value;
        const finalPrice = Math.max(0, basePrice - discountVal);
        return `${finalPrice} €`;
      }

      return `${basePrice} €`;
    },
    [services]
  );

  const handleWhatsAppClick = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();
    const cleanPhone = (apt.clientPhone || '').replace(/\D/g, '');
    if (!cleanPhone) return;

    // Obtener primer nombre
    const firstName = apt.clientName.trim().split(' ')[0] || apt.clientName;
    const aptDate = new Date(apt.dateTime);
    const dateFormatted = format(aptDate, "EEEE d 'de' MMMM", { locale: es });
    const timeFormatted = format(aptDate, 'HH:mm');
    const cabinetName = profile?.name || 'QuiroAgenda';

    const message = `¡Hola ${firstName}! Te recuerdo tu cita en ${cabinetName} programada para el ${dateFormatted} a las ${timeFormatted}h. Si necesitas modificarla o tienes cualquier consulta, avísame con antelación. ¡Muchas gracias!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-4 shadow-xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          No hay citas agendadas
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Este día ({format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}) está libre o aún no tiene reservas registradas.
        </p>
        <Button
          onClick={onNewAppointment}
          className="mt-5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-sm px-5"
        >
          <Plus className="w-4 h-4 mr-2" /> Agendar Nueva Cita
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 pb-6">
      {appointments.map((apt) => {
        const aptDate = new Date(apt.dateTime);
        const duration = apt.duration || 60;
        const endDate = addMinutes(aptDate, duration);
        const client = getClientInfo(apt);
        const displayPrice = getDisplayPrice(apt, client);

        const startTimeStr = format(aptDate, 'HH:mm');
        const endTimeStr = format(endDate, 'HH:mm');

        // Comprobar si la cita está en curso ahora
        const isToday = isSameDay(aptDate, currentTime);
        const isInProgress = isToday && currentTime >= aptDate && currentTime <= endDate;

        const isCompleted = apt.status === 'completed';
        const isNoShow = apt.status === 'no-show';
        const isPaid = !!apt.payment;
        const hasVoucherAvailable = !!(client?.voucher && client.voucher.sessions > 0);

        // Subtítulo de bono
        let bonoLabel: string | null = null;
        if (apt.payment?.method === 'voucher') {
          bonoLabel = 'Bono Canjeado';
        } else if (hasVoucherAvailable && client?.voucher) {
          const used = client.voucher.totalSessions - client.voucher.sessions + 1;
          bonoLabel = `Bono Sesión ${used}/${client.voucher.totalSessions}`;
        }

        // Subtítulo de tarifa fiel
        let loyaltyLabel: string | null = null;
        if (client?.discount && client.discount.value > 0) {
          loyaltyLabel = `Tarifa Fiel (-${client.discount.value}${client.discount.type === 'percentage' ? '%' : '€'} auto)`;
        } else if (apt.discountApplied) {
          loyaltyLabel = `Tarifa Fiel (-${apt.discountApplied.value}${apt.discountApplied.type === 'percentage' ? '%' : '€'} auto)`;
        }

        return (
          <div
            key={apt.id}
            onClick={() => onAppointmentClick(apt)}
            className={cn(
              'group relative bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md select-none',
              isInProgress
                ? 'border-emerald-500 ring-2 ring-emerald-500/30 dark:border-emerald-600'
                : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300'
            )}
          >
            {/* Fila Superior: Franja Horaria (Badge) y Precio en Grande */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-[#e6f7f2] text-[#046c4e] dark:bg-emerald-950/50 dark:text-emerald-300 border border-[#a7f3d0]/60">
                  {startTimeStr} – {endTimeStr} ({duration} min)
                </span>

                {isInProgress && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    En curso
                  </span>
                )}

                {isCompleted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isPaid ? 'Pagado' : 'Realizado'}
                  </span>
                )}

                {isNoShow && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    Ausente
                  </span>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {displayPrice}
                </span>
              </div>
            </div>

            {/* Fila Central: Nombre del Cliente · Tratamiento */}
            <div className="mb-2">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                <span className="text-slate-950 dark:text-white">{apt.clientName}</span>
                <span className="text-slate-400 mx-1.5 font-normal">·</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {apt.serviceName || 'Tratamiento'}
                </span>
              </h4>

              {/* Subtítulo: Tarifa Fiel / Bono / Notas */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-1">
                {loyaltyLabel && (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {loyaltyLabel}
                  </span>
                )}
                {loyaltyLabel && bonoLabel && <span>·</span>}
                {bonoLabel && (
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {bonoLabel}
                  </span>
                )}
                {(loyaltyLabel || bonoLabel) && apt.notes && <span>·</span>}
                {apt.notes && (
                  <span className="italic text-slate-600 dark:text-slate-400">
                    Nota: {apt.notes}
                  </span>
                )}
              </div>
            </div>

            {/* Fila Inferior: Botones de Acción Rápida */}
            <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Botón Cobrar o Finalizar Bono */}
                {!isPaid && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFinishAppointment(apt);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#e6f7f2] text-[#046c4e] hover:bg-[#d0f2e7] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#a7f3d0] transition-colors shadow-2xs"
                  >
                    <span>✓</span>
                    <span>{hasVoucherAvailable ? 'Cobrar Bono' : 'Cobrar'}</span>
                  </button>
                )}

                {/* Botón WhatsApp 1-clic */}
                <button
                  type="button"
                  onClick={(e) => handleWhatsAppClick(e, apt)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-800 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                  title="Enviar recordatorio o mensaje por WhatsApp con un clic"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp 1-clic</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAppointment(apt);
                  }}
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAppointment(apt.id);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Eliminar cita"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
