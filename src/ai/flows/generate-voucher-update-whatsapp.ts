
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
  website: z.string().url().optional().describe('The website URL of the business.'),
  instagram: z.string().url().optional().describe('The Instagram profile URL of the business.'),
  facebook: z.string().url().optional().describe('The Facebook profile URL of the business.'),
  tiktok: z.string().url().optional().describe('The TikTok profile URL of the business.'),
  youtube: z.string().url().optional().describe('The YouTube profile URL of the business.'),
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

  Crea un mensaje de WhatsApp para informar a un cliente sobre las sesiones restantes en su bono. Utiliza una de las siguientes plantillas según corresponda y rellena los datos proporcionados. No añadas ningún saludo o texto adicional.

  {{#if remainingSessions}}
  Plantilla para sesiones restantes:
  "¡Hola {{clientName}}! 👋 Hemos registrado tu última sesión. Aún te quedan *{{remainingSessions}} sesiones* en tu bono. ¡Esperamos verte pronto para que sigas disfrutando de tus masajes! ✨{{#if businessName}}\n\n_{{businessName}}_{{/if}}{{#if website}}\nWeb: {{website}}{{/if}}{{#if instagram}}\nInstagram: {{instagram}}{{/if}}{{#if facebook}}\nFacebook: {{facebook}}{{/if}}{{#if tiktok}}\nTikTok: {{tiktok}}{{/if}}{{#if youtube}}\nYouTube: {{youtube}}{{/if}}"
  {{else}}
  Plantilla para 0 sesiones restantes:
  "¡Hola {{clientName}}! 🎉 ¡Felicidades por completar tu bono! Ha sido tu última sesión, pero nos encantaría seguir cuidándote. Puedes adquirir un nuevo bono cuando quieras para no perder el ritmo. ¡Gracias por tu confianza! ✨{{#if businessName}}\n\n_{{businessName}}_{{/if}}{{#if website}}\nWeb: {{website}}{{/if}}{{#if instagram}}\nInstagram: {{instagram}}{{/if}}{{#if facebook}}\nFacebook: {{facebook}}{{/if}}{{#if tiktok}}\nTikTok: {{tiktok}}{{/if}}{{#if youtube}}\nYouTube: {{youtube}}{{/if}}"
  {{/if}}
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
