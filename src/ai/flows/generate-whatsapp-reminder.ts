'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized WhatsApp reminder messages for appointments.
 *
 * - generateWhatsappReminder - A function that generates a WhatsApp reminder message.
 * - GenerateWhatsappReminderInput - The input type for the generateWhatsappReminder function.
 * - GenerateWhatsappReminderOutput - The return type for the generateWhatsappReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWhatsappReminderInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  appointmentDateTime: z.string().describe('The date and time of the appointment (e.g., YYYY-MM-DD HH:MM).'),
  clientPhoneNumber: z.string().describe('The client phone number to send the whatsapp reminder.'),
  businessName: z.string().describe('The name of the business.'),
});

export type GenerateWhatsappReminderInput = z.infer<typeof GenerateWhatsappReminderInputSchema>;

const GenerateWhatsappReminderOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized WhatsApp reminder message.'),
});

export type GenerateWhatsappReminderOutput = z.infer<typeof GenerateWhatsappReminderOutputSchema>;

export async function generateWhatsappReminder(input: GenerateWhatsappReminderInput): Promise<GenerateWhatsappReminderOutput> {
  return generateWhatsappReminderFlow(input);
}

const generateWhatsappReminderPrompt = ai.definePrompt({
  name: 'generateWhatsappReminderPrompt',
  input: {schema: GenerateWhatsappReminderInputSchema},
  output: {schema: GenerateWhatsappReminderOutputSchema},
  prompt: `Eres un experto en crear mensajes de recordatorio de citas personalizados para WhatsApp.

  Crea un mensaje de WhatsApp amigable y profesional para recordarle a {{clientName}} sobre su próxima cita con {{businessName}} el {{appointmentDateTime}}.
  El mensaje debe incluir la fecha y hora de la cita y una solicitud amigable para confirmar o reprogramar si es necesario.
  Asegúrate de usar emojis para que el mensaje sea más amigable y acogedor.

  Ejemplo:
  Hola {{clientName}}, este es un recordatorio amigable sobre tu cita con {{businessName}} para el {{appointmentDateTime}}. Por favor, confirma o reprograma si es necesario. ¡Nos vemos pronto! 😊
  `,
});

const generateWhatsappReminderFlow = ai.defineFlow(
  {
    name: 'generateWhatsappReminderFlow',
    inputSchema: GenerateWhatsappReminderInputSchema,
    outputSchema: GenerateWhatsappReminderOutputSchema,
  },
  async input => {
    const {output} = await generateWhatsappReminderPrompt(input);
    return output!;
  }
);
