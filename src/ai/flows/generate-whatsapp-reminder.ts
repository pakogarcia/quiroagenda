
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
  appointmentDateTime: z.string().describe('The date and time of the appointment, pre-formatted for display.'),
  clientPhoneNumber: z.string().describe('The client phone number to send the whatsapp reminder.'),
  businessName: z.string().optional().describe('The name of the business sending the reminder.'),
  website: z.string().url().optional().describe('The website URL of the business.'),
  instagram: z.string().url().optional().describe('The Instagram profile URL of the business.'),
  facebook: z.string().url().optional().describe('The Facebook profile URL of the business.'),
  tiktok: z.string().url().optional().describe('The TikTok profile URL of the business.'),
  youtube: z.string().url().optional().describe('The YouTube profile URL of the business.'),
  customMessage: z.string().optional().describe('An optional custom message to add to the reminder.'),
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
  prompt: `Eres un experto en crear mensajes de recordatorio de citas para WhatsApp.

  Crea un mensaje de WhatsApp amigable y profesional para recordarle a {{clientName}} sobre su próxima cita.

  El mensaje debe seguir este formato exacto, incluyendo los emojis y el formato de negrita (asteriscos):
  '¡Hola {{clientName}}! 👋 Te escribimos de parte de {{#if businessName}}_{{businessName}}_{{else}}nuestro centro{{/if}} para recordarte tu cita del *{{appointmentDateTime}}*. Por favor, si no puedes acudir, avísanos con la mayor antelación posible.{{#if customMessage}} {{customMessage}}.{{/if}} ¡Te esperamos! ✨{{#if website}}\n\nWeb: {{website}}{{/if}}{{#if instagram}}\nInstagram: {{instagram}}{{/if}}{{#if facebook}}\nFacebook: {{facebook}}{{/if}}{{#if tiktok}}\nTikTok: {{tiktok}}{{/if}}{{#if youtube}}\nYouTube: {{youtube}}{{/if}}'
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
