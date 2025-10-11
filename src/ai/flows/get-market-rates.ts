
'use server';

/**
 * @fileOverview A flow to get current market prices for crypto, forex, and commodities.
 * 
 * - getMarketRates - A function that returns current market rates.
 * - MarketRates - The return type for the getMarketRates function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fetch from 'node-fetch';

const RateSchema = z.object({
  price: z.number().describe('The current price of the asset in USD.'),
  change: z.number().describe('The 24-hour price change percentage.'),
});

const MarketRatesSchema = z.object({
  usdt: RateSchema,
  eur: RateSchema,
  gbp: RateSchema,
  jpy: RateSchema,
  gold: RateSchema,
});

export type MarketRates = z.infer<typeof MarketRatesSchema>;

const fetchMarketRatesTool = ai.defineTool(
  {
    name: 'fetchMarketRates',
    description: 'Fetches current market prices for specified assets from an external API.',
    inputSchema: z.object({}),
    outputSchema: MarketRatesSchema,
  },
  async () => {
    try {
      const ids = 'tether,eur,gbp,jpy,gold';
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      const data: any = await response.json();
      
      const getRate = (token: string) => {
          const price = data?.[token]?.usd;
          const change = data?.[token]?.usd_24h_change;
          if (typeof price !== 'number' || typeof change !== 'number') {
              throw new Error(`Invalid data for ${token}`);
          }
          return { price, change };
      }

      return {
        usdt: getRate('tether'),
        eur: getRate('eur'),
        gbp: getRate('gbp'),
        jpy: getRate('jpy'),
        gold: getRate('gold'),
      };
    } catch (error) {
      console.error('Failed to fetch market rates:', error);
      // In case of API failure, return a default fallback structure.
      return {
        usdt: { price: 1.00, change: 0.00 },
        eur: { price: 1.07, change: 0.00 },
        gbp: { price: 1.25, change: 0.00 },
        jpy: { price: 157.0, change: 0.00 },
        gold: { price: 2300.0, change: 0.00 },
      };
    }
  }
);


const getMarketRatesFlow = ai.defineFlow(
  {
    name: 'getMarketRatesFlow',
    inputSchema: z.void(),
    outputSchema: MarketRatesSchema,
  },
  async () => {
    const result = await fetchMarketRatesTool({});
    return result;
  }
);

export async function getMarketRates(): Promise<MarketRates> {
    return getMarketRatesFlow();
}
