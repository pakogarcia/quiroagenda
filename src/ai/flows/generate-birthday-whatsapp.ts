
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized WhatsApp birthday messages.
 *
 * - generateBirthdayWhatsapp - A function that generates a WhatsApp birthday message.
 * - GenerateBirthdayWhatsappInput - The input type for the function.
 * - GenerateBirthdayWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBirthdayWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the client celebrating their birthday.'),
  businessName: z.string().optional().describe('The name of the business sending the message.'),
  customMessage: z.string().optional().describe('An optional custom message to add to the message.'),
});

export type GenerateBirthdayWhatsappInput = z.infer<typeof GenerateBirthdayWhatsappInputSchema>;

const GenerateBirthdayWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized WhatsApp birthday message.'),
});

export type GenerateBirthdayWhatsappOutput = z.infer<typeof GenerateBirthdayWhatsappOutputSchema>;

export async function generateBirthdayWhatsapp(input: GenerateBirthdayWhatsappInput): Promise<GenerateBirthdayWhatsappOutput> {
  return generateBirthdayWhatsappFlow(input);
}

const generateBirthdayWhatsappPrompt = ai.definePrompt({
  name: 'generateBirthdayWhatsappPrompt',
  input: {schema: GenerateBirthdayWhatsappInputSchema},
  output: {schema: GenerateBirthdayWhatsappOutputSchema},
  prompt: `Eres un asistente virtual amigable y cálido para un gabinete de masajes y estética.

  Crea un mensaje de WhatsApp corto y alegre para felicitar a un cliente por su cumpleaños.

  Plantilla:
  "¡Feliz cumpleaños, {{clientName}}! 🎂 De parte de todo el equipo de {{#if businessName}}_{{businessName}}_{{else}}nuestro centro{{/if}}, te deseamos un día maravilloso lleno de alegría.{{#if customMessage}} {{customMessage}}.{{/if}} ¡Un abrazo grande! ✨"
  `,
});

const generateBirthdayWhatsappFlow = ai.defineFlow(
  {
    name: 'generateBirthdayWhatsappFlow',
    inputSchema: GenerateBirthdayWhatsappInputSchema,
    outputSchema: GenerateBirthdayWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generateBirthdayWhatsappPrompt(input);
    return output!;
  }
);
