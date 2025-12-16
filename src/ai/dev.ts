
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-appointment-summary.ts';
import '@/ai/flows/generate-whatsapp-reminder.ts';
import '@/ai/flows/generate-offer-whatsapp.ts';
import '@/ai/flows/generate-new-appointment-whatsapp.ts';
import '@/ai/flows/generate-voucher-update-whatsapp.ts';
import '@/ai/flows/generate-birthday-whatsapp.ts';
import '@/ai/flows/generate-inactive-client-whatsapp.ts';
import '@/ai/flows/generate-pending-payment-whatsapp.ts';
