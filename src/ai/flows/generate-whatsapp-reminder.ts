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
  prompt: `You are an expert at crafting personalized WhatsApp reminder messages for appointments.

  Create a friendly and professional WhatsApp message to remind {{clientName}} about their upcoming appointment with {{businessName}} on {{appointmentDateTime}}.
  The message should include the date and time of the appointment and a friendly request to confirm or reschedule if needed.
  Make sure to use emojis to make the message more friendly and inviting.

  Example:
  Hi {{clientName}}, this is a friendly reminder about your appointment with {{businessName}} on {{appointmentDateTime}}. Please confirm or reschedule if needed. See you soon! 😊
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

