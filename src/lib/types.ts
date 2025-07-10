export type PaymentMethod = 'cash' | 'bizum' | 'voucher' | 'paypal';

export type Payment = {
  method: PaymentMethod;
  amount: number;
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
  voucher?: Voucher;
};

export type BusinessProfile = {
  name: string;
  address: string;
  phone: string;
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
