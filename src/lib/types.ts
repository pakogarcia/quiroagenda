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
  duration?: number; // Duración de la sesión en minutos (ej. 15, 30, 45, 60, 75, 90)
};

export type Voucher = {
  sessions: number;
  totalSessions: number;
  price: number;
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
};

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
  logo?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  openingHours?: {
    morning: { start: string; end: string; enabled: boolean };
    afternoon: { start: string; end: string; enabled: boolean };
  };
  weeklySchedule?: WeeklySchedule;
  vacations?: Vacation[];
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
