import { config } from 'dotenv';
config();

import '@/ai/flows/generate-appointment-summary.ts';
import '@/ai/flows/generate-whatsapp-reminder.ts';