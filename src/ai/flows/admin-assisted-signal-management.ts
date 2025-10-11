
'use server';

/**
 * @fileOverview An AI agent to assist admins in managing signals by suggesting new signals
 *               or summarizing the impact of existing signals on different user groups.
 *
 * - adminAssistedSignalManagement - A function that handles the signal management process.
 * - AdminAssistedSignalManagementInput - The input type for the adminAssistedSignalManagement function.
 * - AdminAssistedSignalManagementOutput - The return type for the adminAssistedSignalManagement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminAssistedSignalManagementInputSchema = z.object({
  taskType: z.enum(['suggestNewSignals', 'summarizeImpact']).describe('The type of task to perform: suggest new signals or summarize impact of existing signals.'),
  marketTrends: z.string().optional().describe('Relevant market trends for suggesting new signals.'),
  existingSignals: z.string().optional().describe('Description of existing signals for summarizing impact.'),
  userGroups: z.string().optional().describe('Description of user groups (free vs. pro) for summarizing impact.'),
});

export type AdminAssistedSignalManagementInput = z.infer<typeof AdminAssistedSignalManagementInputSchema>;

const AdminAssistedSignalManagementOutputSchema = z.object({
  suggestions: z.string().describe('AI suggestions for new signals or impact summaries.'),
});

export type AdminAssistedSignalManagementOutput = z.infer<typeof AdminAssistedSignalManagementOutputSchema>;

export async function adminAssistedSignalManagement(input: AdminAssistedSignalManagementInput): Promise<AdminAssistedSignalManagementOutput> {
  return adminAssistedSignalManagementFlow(input);
}

const adminAssistedSignalManagementPrompt = ai.definePrompt({
  name: 'adminAssistedSignalManagementPrompt',
  input: {schema: AdminAssistedSignalManagementInputSchema},
  output: {schema: AdminAssistedSignalManagementOutputSchema},
  prompt: `You are an AI assistant helping a Trader Choice administrator manage signals.

You will either suggest new signals based on provided market trends or summarize the potential impact of existing signals on different user groups.

Task Type: {{{taskType}}}

{{#if marketTrends}}
Market Trends: {{{marketTrends}}}
{{/if}}

{{#if existingSignals}}
Existing Signals: {{{existingSignals}}}
{{/if}}

{{#if userGroups}}
User Groups: {{{userGroups}}}
{{/if}}

Based on the above information, provide helpful suggestions or a comprehensive summary.
`, 
});

const adminAssistedSignalManagementFlow = ai.defineFlow(
  {
    name: 'adminAssistedSignalManagementFlow',
    inputSchema: AdminAssistedSignalManagementInputSchema,
    outputSchema: AdminAssistedSignalManagementOutputSchema,
  },
  async input => {
    const {output} = await adminAssistedSignalManagementPrompt(input);
    return output!;
  }
);
