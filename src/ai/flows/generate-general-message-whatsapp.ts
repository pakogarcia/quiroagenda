
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a generic, customizable WhatsApp message.
 *
 * - generateGeneralMessageWhatsapp - A function that generates the message.
 * - GenerateGeneralMessageWhatsappInput - The input type for the function.
 * - GenerateGeneralMessageWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGeneralMessageWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  customMessage: z.string().describe('The custom message content to send.'),
  businessName: z.string().optional().describe('The name of the business sending the message.'),
});

export type GenerateGeneralMessageWhatsappInput = z.infer<typeof GenerateGeneralMessageWhatsappInputSchema>;

const GenerateGeneralMessageWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The final WhatsApp message.'),
});

export type GenerateGeneralMessageWhatsappOutput = z.infer<typeof GenerateGeneralMessageWhatsappOutputSchema>;

export async function generateGeneralMessageWhatsapp(input: GenerateGeneralMessageWhatsappInput): Promise<GenerateGeneralMessageWhatsappOutput> {
  return generateGeneralMessageWhatsappFlow(input);
}

const generateGeneralMessageWhatsappPrompt = ai.definePrompt({
  name: 'generateGeneralMessageWhatsappPrompt',
  input: {schema: GenerateGeneralMessageWhatsappInputSchema},
  output: {schema: GenerateGeneralMessageWhatsappOutputSchema},
  prompt: `Eres un asistente virtual para un gabinete de masajes y estética. Tu tono es amigable y profesional.

  Crea un mensaje de WhatsApp para un cliente usando el texto personalizado proporcionado.

  Plantilla:
  "¡Hola {{clientName}}! 👋

{{{customMessage}}}

Un saludo,
{{#if businessName}}_{{businessName}}_{{else}}tu centro de estética{{/if}}"
  `,
});

const generateGeneralMessageWhatsappFlow = ai.defineFlow(
  {
    name: 'generateGeneralMessageWhatsappFlow',
    inputSchema: GenerateGeneralMessageWhatsappInputSchema,
    outputSchema: GenerateGeneralMessageWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generateGeneralMessageWhatsappPrompt(input);
    return output!;
  }
);
