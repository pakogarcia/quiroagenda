'use server';

/**
 * @fileOverview Appointment summary generator.
 *
 * - generateAppointmentSummary - A function that generates a summary of appointment notes.
 * - GenerateAppointmentSummaryInput - The input type for the generateAppointmentSummary function.
 * - GenerateAppointmentSummaryOutput - The return type for the generateAppointmentSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAppointmentSummaryInputSchema = z.object({
  notes: z.string().describe('The notes taken during the massage therapy appointment.'),
});
export type GenerateAppointmentSummaryInput = z.infer<typeof GenerateAppointmentSummaryInputSchema>;

const GenerateAppointmentSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the appointment notes.'),
});
export type GenerateAppointmentSummaryOutput = z.infer<typeof GenerateAppointmentSummaryOutputSchema>;

export async function generateAppointmentSummary(input: GenerateAppointmentSummaryInput): Promise<GenerateAppointmentSummaryOutput> {
  return generateAppointmentSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAppointmentSummaryPrompt',
  input: {schema: GenerateAppointmentSummaryInputSchema},
  output: {schema: GenerateAppointmentSummaryOutputSchema},
  prompt: `Eres un asistente virtual para un masoterapeuta. Por favor, resume las siguientes notas de una cita de masoterapia. Sé conciso y céntrate en los detalles clave.

Notas: {{{notes}}}`,
});

const generateAppointmentSummaryFlow = ai.defineFlow(
  {
    name: 'generateAppointmentSummaryFlow',
    inputSchema: GenerateAppointmentSummaryInputSchema,
    outputSchema: GenerateAppointmentSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
