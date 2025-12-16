
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating messages to clients who missed an appointment.
 *
 * - generateNoShowWhatsapp - A function that generates a "no-show" message.
 * - GenerateNoShowWhatsappInput - The input type for the function.
 * - GenerateNoShowWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNoShowWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the client who missed the appointment.'),
  appointmentDateTime: z.string().describe('The date and time of the missed appointment.'),
  businessName: z.string().optional().describe('The name of the business sending the message.'),
  customMessage: z.string().optional().describe('An optional custom message to add to the message.'),
});

export type GenerateNoShowWhatsappInput = z.infer<typeof GenerateNoShowWhatsappInputSchema>;

const GenerateNoShowWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized message for the no-show client.'),
});

export type GenerateNoShowWhatsappOutput = z.infer<typeof GenerateNoShowWhatsappOutputSchema>;

export async function generateNoShowWhatsapp(input: GenerateNoShowWhatsappInput): Promise<GenerateNoShowWhatsappOutput> {
  return generateNoShowWhatsappFlow(input);
}

const generateNoShowWhatsappPrompt = ai.definePrompt({
  name: 'generateNoShowWhatsappPrompt',
  input: {schema: GenerateNoShowWhatsappInputSchema},
  output: {schema: GenerateNoShowWhatsappOutputSchema},
  prompt: `Eres un asistente virtual profesional y comprensivo para un gabinete de masajes y estética.

  Crea un mensaje de WhatsApp corto y amable para un cliente que no se presentó a su cita. El objetivo es informarle y recordarle la importancia de cancelar con antelación.

  Plantilla:
  "¡Hola {{clientName}}! 👋 Te escribimos de {{#if businessName}}_{{businessName}}_{{else}}nuestro centro{{/if}} en referencia a tu cita del {{appointmentDateTime}}.\n\nHemos registrado que no pudiste asistir. Entendemos que surgen imprevistos, pero te agradeceríamos que la próxima vez nos avises para poder reorganizar la agenda.{{#if customMessage}}\n\n{{customMessage}}{{/if}}\n\n¡Esperamos verte pronto! 😊"
  `,
});

const generateNoShowWhatsappFlow = ai.defineFlow(
  {
    name: 'generateNoShowWhatsappFlow',
    inputSchema: GenerateNoShowWhatsappInputSchema,
    outputSchema: GenerateNoShowWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generateNoShowWhatsappPrompt(input);
    return output!;
  }
);
