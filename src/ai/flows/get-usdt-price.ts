'use server';

/**
 * @fileOverview A flow to get the current price of USDT.
 * 
 * - getUsdtPrice - A function that returns the current USDT price.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const GetUsdtPriceOutputSchema = z.object({
  price: z.number().describe('The current price of USDT in USD.'),
});

type GetUsdtPriceOutput = z.infer<typeof GetUsdtPriceOutputSchema>;

const fetchUsdtPriceTool = ai.defineTool(
  {
    name: 'fetchUsdtPrice',
    description: 'Fetches the current price of Tether (USDT) in USD from an external API.',
    inputSchema: z.object({}),
    outputSchema: GetUsdtPriceOutputSchema,
  },
  async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd');
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      const data: any = await response.json();
      const price = data?.tether?.usd;

      if (typeof price !== 'number') {
        throw new Error('Invalid price data received from API.');
      }
      
      return { price };
    } catch (error) {
      console.error('Failed to fetch USDT price:', error);
      // Return a default/stale value or re-throw
      return { price: 1.00 }; // Fallback price
    }
  }
);


const getUsdtPriceFlow = ai.defineFlow(
  {
    name: 'getUsdtPriceFlow',
    inputSchema: z.void(),
    outputSchema: GetUsdtPriceOutputSchema,
  },
  async () => {
    const result = await fetchUsdtPriceTool({});
    return result;
  }
);

export async function getUsdtPrice(): Promise<GetUsdtPriceOutput> {
    return getUsdtPriceFlow();
}
