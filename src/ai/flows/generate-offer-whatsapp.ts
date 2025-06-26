'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized WhatsApp promotional messages.
 *
 * - generateOfferWhatsapp - A function that generates a WhatsApp promotional message.
 * - GenerateOfferWhatsappInput - The input type for the function.
 * - GenerateOfferWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOfferWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  offerMessage: z.string().describe('The core message of the promotional offer.'),
  dateRange: z.string().describe('The formatted date range for when the offer is valid.'),
  businessName: z.string().optional().describe('The name of the business sending the offer.'),
});

export type GenerateOfferWhatsappInput = z.infer<typeof GenerateOfferWhatsappInputSchema>;

const GenerateOfferWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized WhatsApp promotional message.'),
});

export type GenerateOfferWhatsappOutput = z.infer<typeof GenerateOfferWhatsappOutputSchema>;

export async function generateOfferWhatsapp(input: GenerateOfferWhatsappInput): Promise<GenerateOfferWhatsappOutput> {
  return generateOfferWhatsappFlow(input);
}

const generateOfferWhatsappPrompt = ai.definePrompt({
  name: 'generateOfferWhatsappPrompt',
  input: {schema: GenerateOfferWhatsappInputSchema},
  output: {schema: GenerateOfferWhatsappOutputSchema},
  prompt: `Eres un experto en marketing para un gabinete de masajes y estética. Tu tono es amigable, profesional y persuasivo.

  Crea un mensaje de WhatsApp personalizado para informar a un cliente sobre una oferta especial.

  Aquí están los detalles:
  - Nombre del cliente: {{clientName}}
  - Mensaje de la oferta: {{{offerMessage}}}
  - Validez de la oferta: {{dateRange}}

  El mensaje debe empezar con un saludo personalizado, presentar la oferta de forma atractiva, mencionar claramente el período de validez y terminar con una llamada a la acción clara para reservar una cita. Incluye algún emoji relevante para hacerlo más cercano.

  Ejemplo de estructura del mensaje a generar:
  "¡Hola {{clientName}}! 🥳 Queremos cuidarte y por eso te traemos una oferta especial. {{{offerMessage}}}. Esta promoción es válida {{dateRange}}. ¡No te la pierdas y reserva tu cita! ✨{{#if businessName}}\n\n_{{businessName}}_{{/if}}"
  `,
});

const generateOfferWhatsappFlow = ai.defineFlow(
  {
    name: 'generateOfferWhatsappFlow',
    inputSchema: GenerateOfferWhatsappInputSchema,
    outputSchema: GenerateOfferWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generateOfferWhatsappPrompt(input);
    return output!;
  }
);
