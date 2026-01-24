

export type PaymentMethod = 'cash' | 'bizum' | 'voucher' | 'paypal';

export type Payment = {
  method: PaymentMethod;
  amount: number;
  payerClientId?: string; // ID of the client whose voucher was used, if applicable
};

export type Appointment = {
  id: string;
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

export type TimeSlot = {
    time: string;
    isBooked: boolean;
    appointment?: Appointment;
    duration?: number; // in minutes
};

    