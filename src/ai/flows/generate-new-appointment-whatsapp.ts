
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized WhatsApp welcome messages for new or potential clients.
 *
 * - generateWelcomeWhatsapp - A function that generates a WhatsApp welcome message.
 * - GenerateWelcomeWhatsappInput - The input type for the function.
 * - GenerateWelcomeWhatsappOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ServiceSchema = z.object({
  name: z.string(),
  price: z.number(),
});

const GenerateWelcomeWhatsappInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  businessAddress: z.string().describe('The address of the business.'),
  businessName: z.string().optional().describe('The name of the business sending the confirmation.'),
  services: z.array(ServiceSchema).optional().describe('A list of services offered by the business.'),
  website: z.string().url().or(z.literal('')).optional(),
  instagram: z.string().url().or(z.literal('')).optional(),
  facebook: z.string().url().or(z.literal('')).optional(),
  tiktok: z.string().url().or(z.literal('')).optional(),
  youtube: z.string().url().or(z.literal('')).optional(),
});

export type GenerateWelcomeWhatsappInput = z.infer<typeof GenerateWelcomeWhatsappInputSchema>;

const GenerateWelcomeWhatsappOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized WhatsApp welcome message.'),
});

export type GenerateWelcomeWhatsappOutput = z.infer<typeof GenerateWelcomeWhatsappOutputSchema>;

export async function generateWelcomeWhatsapp(input: GenerateWelcomeWhatsappInput): Promise<GenerateWelcomeWhatsappOutput> {
  return generateWelcomeWhatsappFlow(input);
}

const generateWelcomeWhatsappPrompt = ai.definePrompt({
  name: 'generateWelcomeWhatsappPrompt',
  input: {schema: GenerateWelcomeWhatsappInputSchema},
  output: {schema: GenerateWelcomeWhatsappOutputSchema},
  prompt: `Eres un asistente virtual para un gabinete de masajes y estética. Tu tono es amigable y profesional.

  Crea un mensaje de WhatsApp para dar la bienvenida a un nuevo cliente potencial que ha pedido información. El objetivo es presentarte, proporcionar la lista de servicios con sus precios y los datos de contacto. Usa la siguiente plantilla.

  Plantilla:
  "¡Hola {{clientName}}! Soy de {{businessName}}. Gracias por tu interés. Nos puedes encontrar en {{businessAddress}}.
{{#if services}}
Estos son nuestros servicios principales:
{{#each services}}- {{name}}: {{price}}€
{{/each}}
{{/if}}
Para cualquier consulta, no dudes en contactarnos. ¡Te esperamos! ✨{{#if website}}\n\nWeb: {{website}}{{/if}}{{#if instagram}}\nInstagram: {{instagram}}{{/if}}{{#if facebook}}\nFacebook: {{facebook}}{{/if}}{{#if tiktok}}\nTikTok: {{tiktok}}{{/if}}{{#if youtube}}\nYouTube: {{youtube}}{{/if}}"
  `,
});

const generateWelcomeWhatsappFlow = ai.defineFlow(
  {
    name: 'generateWelcomeWhatsappFlow',
    inputSchema: GenerateWelcomeWhatsappInputSchema,
    outputSchema: GenerateWelcomeWhatsappOutputSchema,
  },
  async input => {
    const {output} = await generateWelcomeWhatsappPrompt(input);
    return output!;
  }
);
