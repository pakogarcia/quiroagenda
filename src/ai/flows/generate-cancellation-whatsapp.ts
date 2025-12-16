
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating appointment cancellation/rescheduling messages.
 *
 * - generateCancellationWhatsapp - A function that generates a cancellation message.
 * - GenerateCancellationWhatsappInput - The input type for the function.
 * - GenerateCancellationWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCancellationWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the client whose appointment is being cancelled/rescheduled.'),
  originalAppointmentDateTime: z.string().describe('The date and time of the original appointment.'),
  newProposedDateTime: z.string().describe('The new date and time being proposed for the appointment.'),
  businessName: z.string().optional().describe('The name of the business sending the message.'),
  customMessage: z.string().optional().describe('An optional custom message to add to the message.'),
});

export type GenerateCancellationWhatsappInput = z.infer<typeof GenerateCancellationWhatsappInputSchema>;

const GenerateCancellationWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized cancellation/rescheduling message.'),
});

export type GenerateCancellationWhatsappOutput = z.infer<typeof GenerateCancellationWhatsappOutputSchema>;

export async function generateCancellationWhatsapp(input: GenerateCancellationWhatsappInput): Promise<GenerateCancellationWhatsappOutput> {
  return generateCancellationWhatsappFlow(input);
}

const generateCancellationWhatsappPrompt = ai.definePrompt({
  name: 'generateCancellationWhatsappPrompt',
  input: {schema: GenerateCancellationWhatsappInputSchema},
  output: {schema: GenerateCancellationWhatsappOutputSchema},
  prompt: `Eres un asistente virtual profesional y empático para un gabinete de masajes y estética. Debes comunicar un cambio de cita inesperado.

  Crea un mensaje de WhatsApp para informar a un cliente que su próxima cita ha tenido que ser modificada por un imprevisto. Discúlpate y ofrece una nueva fecha y hora.

  Plantilla:
  "¡Hola {{clientName}}! Te escribo de {{#if businessName}}_{{businessName}}_{{else}}nuestro centro{{/if}}. Con mucha pena, te informo de que por un imprevisto personal me veo en la obligación de modificar nuestra cita del *{{originalAppointmentDateTime}}*. Mil disculpas por las molestias.

Te propongo una nueva fecha: el *{{newProposedDateTime}}*. Si te viene bien, genial. Si no, por favor, dime qué te vendría mejor o si prefieres cancelar la cita.{{#if customMessage}} {{customMessage}}.{{/if}}

Gracias por tu comprensión. Un saludo."
  `,
});

const generateCancellationWhatsappFlow = ai.defineFlow(
  {
    name: 'generateCancellationWhatsappFlow',
    inputSchema: GenerateCancellationWhatsappInputSchema,
    outputSchema: GenerateCancellationWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generateCancellationWhatsappPrompt(input);
    return output!;
  }
);
