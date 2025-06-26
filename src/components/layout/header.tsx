'use client';

import { Button } from '@/components/ui/button';
import { Plus, Send, Leaf } from 'lucide-react';

type AppHeaderProps = {
  onAddAppointment: () => void;
  onSendReminders: () => void;
};

export function AppHeader({ onAddAppointment, onSendReminders }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center gap-2">
        <Leaf className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline text-primary">QuiroAgenda</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onSendReminders}>
          <Send className="mr-2 h-4 w-4" />
          Send Reminders
        </Button>
        <Button onClick={onAddAppointment}>
          <Plus className="mr-2 h-4 w-4" />
          Add Appointment
        </Button>
      </div>
    </header>
  );
}
