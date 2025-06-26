export type Appointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  dateTime: Date;
  notes: string;
  reminderSent: boolean;
  status: 'scheduled' | 'no-show';
};

export type Client = {
  id: string;
  name: string;
  phone: string;
};
