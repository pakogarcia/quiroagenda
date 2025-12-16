
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating messages to re-engage inactive clients.
 *
 * - generateInactiveClientWhatsapp - A function that generates a re-engagement message.
 * - GenerateInactiveClientWhatsappInput - The input type for the function.
 * - GenerateInactiveClientWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInactiveClientWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the inactive client.'),
  inactiveDays: z.number().describe('The number of days since the client last visited.'),
  businessName: z.string().optional().describe('The name of the business sending the message.'),
  customMessage: z.string().optional().describe('An optional custom message to add to the message.'),
});

export type GenerateInactiveClientWhatsappInput = z.infer<typeof GenerateInactiveClientWhatsappInputSchema>;

const GenerateInactiveClientWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized re-engagement message.'),
});

export type GenerateInactiveClientWhatsappOutput = z.infer<typeof GenerateInactiveClientWhatsappOutputSchema>;

export async function generateInactiveClientWhatsapp(input: GenerateInactiveClientWhatsappInput): Promise<GenerateInactiveClientWhatsappOutput> {
  return generateInactiveClientWhatsappFlow(input);
}

const generateInactiveClientWhatsappPrompt = ai.definePrompt({
  name: 'generateInactiveClientWhatsappPrompt',
  input: {schema: GenerateInactiveClientWhatsappInputSchema},
  output: {schema: GenerateInactiveClientWhatsappOutputSchema},
  prompt: `Eres un asistente virtual amigable y proactivo para un gabinete de masajes y estética. Tu objetivo es reactivar a clientes que no han vuelto en un tiempo.

  Crea un mensaje de WhatsApp cercano y amigable para un cliente inactivo.

  Plantilla:
  "¡Hola {{clientName}}! 👋 Te echamos de menos en {{#if businessName}}_{{businessName}}_{{else}}el centro{{/if}}. Hace ya un tiempo desde tu última visita y queríamos saber si todo va bien.{{#if customMessage}} {{customMessage}}.{{/if}} ¿Te apetece volver a cuidarte? ¡Nos encantaría verte de nuevo! ✨"
  `,
});

const generateInactiveClientWhatsappFlow = ai.defineFlow(
  {
    name: 'generateInactiveClientWhatsappFlow',
    inputSchema: GenerateInactiveClientWhatsappInputSchema,
    outputSchema: GenerateInactiveClientWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generateInactiveClientWhatsappPrompt(input);
    return output!;
  }
);
