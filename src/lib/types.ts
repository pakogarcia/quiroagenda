export type PaymentMethod = 'cash' | 'bizum' | 'voucher' | 'paypal';

export type Payment = {
  method: PaymentMethod;
  amount: number;
  payerClientId?: string; // ID of the client whose voucher was used, if applicable
};

export type Appointment = {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  dateTime: Date;
  notes: string;
  reminderSent: boolean;
  status: 'scheduled' | 'completed' | 'no-show';
  payment?: Payment;
  serviceId?: string;
  serviceName?: string;
  servicePrice?: number;
  originalPrice?: number; // Precio base antes de aplicar descuento de fidelidad
  discountApplied?: {
    type: 'fixed' | 'percentage';
    value: number;
    amount: number; // Euros descontados
  };
  duration?: number; // Duración de la sesión en minutos (ej. 15, 30, 45, 60, 75, 90)
};

export type Voucher = {
  sessions: number;
  totalSessions: number;
  price: number;
};

export type ClientDiscount = {
  type: 'fixed' | 'percentage';
  value: number;
};

export type Client = {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  birthDate?: string; // Stored as 'yyyy-MM-dd' string
  details?: string;
  voucher?: Voucher;
  pinHash?: string;
  discount?: ClientDiscount;
};

export function calculateDiscountedPrice(
  basePrice: number,
  discount?: ClientDiscount
): { finalPrice: number; discountAmount: number } {
  if (!discount || !discount.value || discount.value <= 0) {
    return { finalPrice: basePrice, discountAmount: 0 };
  }

  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = Math.round((basePrice * (discount.value / 100)) * 100) / 100;
  } else {
    discountAmount = discount.value;
  }

  const finalPrice = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);
  return { finalPrice, discountAmount };
}

export type Vacation = {
  from: string; // ISO string
  to: string;   // ISO string
};

export type ShiftHours = {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  enabled: boolean;
};

export type DaySchedule = {
  enabled: boolean;
  morning: ShiftHours;
  afternoon: ShiftHours;
};

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type WeeklySchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export type BusinessProfile = {
  name: string;
  address: string;
  phone: string;
  whatsapp?: string; // Número de WhatsApp Business (ej. "+34 634 43 24 87")
  logo?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  telegram?: string;
  openingHours?: {
    morning: { start: string; end: string; enabled: boolean };
    afternoon: { start: string; end: string; enabled: boolean };
  };
  weeklySchedule?: WeeklySchedule;
  vacations?: Vacation[];
  minNoticeHours?: number; // Tiempo mínimo de antelación en horas para reservas online (ej. 6)
  notifications?: {
    telegramBotToken?: string;
    telegramChatId?: string;
    webhookUrl?: string;
  };
};

export type VoucherSale = {
  id: string;
  clientId: string;
  clientName: string;
  date: Date;
  sessions: number;
  amount: number;
  paymentMethod: 'cash' | 'bizum' | 'paypal';
};

export type Service = {
  id: string;
  name: string;
  duration: number; // Duration in minutes
  price: number;
};

export type Expense = {
  id: string;
  concept: string;
  amount: number;
  date: Date;
  notes?: string;
};

export type TimeSlot = {
    time: string;
    isBooked: boolean;
    appointment?: Appointment;
    duration?: number; // in minutes
};
