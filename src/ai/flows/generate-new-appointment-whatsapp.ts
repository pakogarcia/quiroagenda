
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized WhatsApp confirmation messages for new appointments.
 *
 * - generateNewAppointmentWhatsapp - A function that generates a WhatsApp confirmation message.
 * - GenerateNewAppointmentWhatsappInput - The input type for the function.
 * - GenerateNewAppointmentWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewAppointmentWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  appointmentDateTime: z.string().describe('The date and time of the appointment, pre-formatted for display.'),
  businessAddress: z.string().describe('The address of the business.'),
  businessName: z.string().optional().describe('The name of the business sending the confirmation.'),
  website: z.string().url().or(z.literal('')).optional(),
  instagram: z.string().url().or(z.literal('')).optional(),
  facebook: z.string().url().or(z.literal('')).optional(),
  tiktok: z.string().url().or(z.literal('')).optional(),
  youtube: z.string().url().or(z.literal('')).optional(),
});

export type GenerateNewAppointmentWhatsappInput = z.infer<typeof GenerateNewAppointmentWhatsappInputSchema>;

const GenerateNewAppointmentWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized WhatsApp confirmation message.'),
});

export type GenerateNewAppointmentWhatsappOutput = z.infer<typeof GenerateNewAppointmentWhatsappOutputSchema>;

export async function generateNewAppointmentWhatsapp(input: GenerateNewAppointmentWhatsappInput): Promise<GenerateNewAppointmentWhatsappOutput> {
  return generateNewAppointmentWhatsappFlow(input);
}

const generateNewAppointmentWhatsappPrompt = ai.definePrompt({
  name: 'generateNewAppointmentWhatsappPrompt',
  input: {schema: GenerateNewAppointmentWhatsappInputSchema},
  output: {schema: GenerateNewAppointmentWhatsappOutputSchema},
  prompt: `Eres un asistente virtual para un gabinete de masajes y estética. Tu tono es amigable y profesional.

  Crea un mensaje de WhatsApp para confirmar una nueva cita, usando la siguiente plantilla y rellenando los datos proporcionados. No añadas ningún saludo o texto adicional que no esté en la plantilla.

  Plantilla:
  "¡Hola {{clientName}}! Te confirmo tu nueva cita para el *{{appointmentDateTime}}*. Nos vemos en nuestra consulta en {{businessAddress}}. ¡Gracias por tu confianza! ✨{{#if businessName}}\n\n_{{businessName}}_{{/if}}{{#if website}}\nWeb: {{website}}{{/if}}{{#if instagram}}\nInstagram: {{instagram}}{{/if}}{{#if facebook}}\nFacebook: {{facebook}}{{/if}}{{#if tiktok}}\nTikTok: {{tiktok}}{{/if}}{{#if youtube}}\nYouTube: {{youtube}}{{/if}}"
  `,
});

const generateNewAppointmentWhatsappFlow = ai.defineFlow(
  {
    name: 'generateNewAppointmentWhatsappFlow',
    inputSchema: GenerateNewAppointmentWhatsappInputSchema,
    outputSchema: GenerateNewAppointmentWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generateNewAppointmentWhatsappPrompt(input);
    return output!;
  }
);
