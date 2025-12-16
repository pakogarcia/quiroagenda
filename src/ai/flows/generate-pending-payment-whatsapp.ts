
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating messages to notify clients about pending payments.
 *
 * - generatePendingPaymentWhatsapp - A function that generates a payment reminder message.
 * - GeneratePendingPaymentWhatsappInput - The input type for the function.
 * - GeneratePendingPaymentWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePendingPaymentWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the client with a pending payment.'),
  businessName: z.string().optional().describe('The name of the business sending the message.'),
});

export type GeneratePendingPaymentWhatsappInput = z.infer<typeof GeneratePendingPaymentWhatsappInputSchema>;

const GeneratePendingPaymentWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized payment reminder message.'),
});

export type GeneratePendingPaymentWhatsappOutput = z.infer<typeof GeneratePendingPaymentWhatsappOutputSchema>;

export async function generatePendingPaymentWhatsapp(input: GeneratePendingPaymentWhatsappInput): Promise<GeneratePendingPaymentWhatsappOutput> {
  return generatePendingPaymentWhatsappFlow(input);
}

const generatePendingPaymentWhatsappPrompt = ai.definePrompt({
  name: 'generatePendingPaymentWhatsappPrompt',
  input: {schema: GeneratePendingPaymentWhatsappInputSchema},
  output: {schema: GeneratePendingPaymentWhatsappOutputSchema},
  prompt: `Eres un asistente virtual profesional y discreto para un gabinete de masajes y estética.

  Crea un mensaje de WhatsApp amable y conciso para recordarle a un cliente que tiene un pago pendiente de una cita pasada.

  Plantilla:
  "¡Hola {{clientName}}! 👋 Te escribimos de parte de {{#if businessName}}_{{businessName}}_{{else}}nuestro centro{{/if}} para recordarte amablemente que quedó un pago pendiente de una de tus últimas visitas. Puedes realizar el pago en tu próxima cita o contactarnos si lo prefieres. ¡Muchas gracias! 😊"
  `,
});

const generatePendingPaymentWhatsappFlow = ai.defineFlow(
  {
    name: 'generatePendingPaymentWhatsappFlow',
    inputSchema: GeneratePendingPaymentWhatsappInputSchema,
    outputSchema: GeneratePendingPaymentWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generatePendingPaymentWhatsappPrompt(input);
    return output!;
  }
);
