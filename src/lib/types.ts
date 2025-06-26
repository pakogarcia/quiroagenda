export type Appointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  dateTime: Date;
  notes: string;
  reminderSent: boolean;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
};
