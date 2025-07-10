'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating WhatsApp messages to inform clients about their remaining voucher sessions.
 *
 * - generateVoucherUpdateWhatsapp - A function that generates a WhatsApp message.
 * - GenerateVoucherUpdateWhatsappInput - The input type for the function.
 * - GenerateVoucherUpdateWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVoucherUpdateWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  remainingSessions: z.number().describe('The number of remaining sessions in the voucher.'),
  businessName: z.string().optional().describe('The name of the business sending the message.'),
});

export type GenerateVoucherUpdateWhatsappInput = z.infer<typeof GenerateVoucherUpdateWhatsappInputSchema>;

const GenerateVoucherUpdateWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized WhatsApp message about the voucher status.'),
});

export type GenerateVoucherUpdateWhatsappOutput = z.infer<typeof GenerateVoucherUpdateWhatsappOutputSchema>;

export async function generateVoucherUpdateWhatsapp(input: GenerateVoucherUpdateWhatsappInput): Promise<GenerateVoucherUpdateWhatsappOutput> {
  return generateVoucherUpdateWhatsappFlow(input);
}

const generateVoucherUpdateWhatsappPrompt = ai.definePrompt({
  name: 'generateVoucherUpdateWhatsappPrompt',
  input: {schema: GenerateVoucherUpdateWhatsappInputSchema},
  output: {schema: GenerateVoucherUpdateWhatsappOutputSchema},
  prompt: `Eres un asistente virtual para un gabinete de masajes y estética. Tu tono es amigable y profesional.

  Crea un mensaje de WhatsApp para informar a un cliente sobre las sesiones restantes en su bono, usando la siguiente plantilla y rellenando los datos proporcionados. No añadas ningún saludo o texto adicional.

  Plantilla:
  "¡Hola {{clientName}}! 👋 Hemos registrado tu última sesión. Aún te quedan *{{remainingSessions}} sesiones* en tu bono. ¡Esperamos verte pronto para que sigas disfrutando de tus masajes! ✨{{#if businessName}}\n\n_{{businessName}}_{{/if}}"
  `,
});

const generateVoucherUpdateWhatsappFlow = ai.defineFlow(
  {
    name: 'generateVoucherUpdateWhatsappFlow',
    inputSchema: GenerateVoucherUpdateWhatsappInputSchema,
    outputSchema: GenerateVoucherUpdateWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generateVoucherUpdateWhatsappPrompt(input);
    return output!;
  }
);
