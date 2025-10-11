
"use client";

import { useEffect, useState } from "react";
import { getMarketRates, type MarketRates } from "@/ai/flows/get-market-rates";
import { DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

function RateItem({ name, price, change }: { name: string, price: number | null, change: number | null }) {
    const isUp = change !== null ? change >= 0 : null;
    const changeColor = isUp === null ? 'text-muted-foreground' : isUp ? 'text-green-500' : 'text-red-500';

    return (
        <div className="flex items-center gap-2 text-sm md:text-base px-4">
            <span className="font-semibold text-foreground/80">{name}</span>
            {price !== null ? (
                <span className="font-mono">${price.toFixed(4)}</span>
            ) : (
                <span className="w-16 h-4 bg-muted/50 animate-pulse rounded-md" />
            )}
            {change !== null && isUp !== null && (
                 <div className={cn("flex items-center text-xs", changeColor)}>
                    {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    <span>{change.toFixed(2)}%</span>
                </div>
            )}
        </div>
    );
}


export function MarketTicker() {
  const [rates, setRates] = useState<MarketRates | null>(null);

  useEffect(() => {
    async function fetchRates() {
      try {
        const result = await getMarketRates();
        setRates(result);
      } catch (error) {
        console.error("Failed to fetch market rates", error);
        // Set fallback data on error
        setRates({
            usdt: { price: 1.00, change: 0.00 },
            eur: { price: 1.07, change: 0.00 },
            gbp: { price: 1.25, change: 0.00 },
            jpy: { price: 157.0, change: 0.00 },
            gold: { price: 2300.0, change: 0.00 },
        });
      }
    }
    fetchRates();
    const interval = setInterval(fetchRates, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border-y relative flex h-16 w-full items-center overflow-hidden">
        <div className="animate-marquee-slow flex min-w-full flex-shrink-0 items-center justify-around gap-4">
            <RateItem name="XAU/USD" price={rates?.gold?.price ?? null} change={rates?.gold?.change ?? null} />
            <RateItem name="EUR/USD" price={rates?.eur?.price ?? null} change={rates?.eur?.change ?? null} />
            <RateItem name="GBP/USD" price={rates?.gbp?.price ?? null} change={rates?.gbp?.change ?? null} />
            <RateItem name="USD/JPY" price={rates?.jpy?.price ?? null} change={rates?.jpy?.change ?? null} />
            <RateItem name="USDT/USD" price={rates?.usdt?.price ?? null} change={rates?.usdt?.change ?? null} />
             {/* Duplicate for seamless loop */}
            <RateItem name="XAU/USD" price={rates?.gold?.price ?? null} change={rates?.gold?.change ?? null} />
            <RateItem name="EUR/USD" price={rates?.eur?.price ?? null} change={rates?.eur?.change ?? null} />
            <RateItem name="GBP/USD" price={rates?.gbp?.price ?? null} change={rates?.gbp?.change ?? null} />
            <RateItem name="USD/JPY" price={rates?.jpy?.price ?? null} change={rates?.jpy?.change ?? null} />
            <RateItem name="USDT/USD" price={rates?.usdt?.price ?? null} change={rates?.usdt?.change ?? null} />
        </div>
         <div className="animate-marquee-slow-2 absolute top-0 flex min-w-full flex-shrink-0 items-center justify-around gap-4 h-full">
             <RateItem name="XAU/USD" price={rates?.gold?.price ?? null} change={rates?.gold?.change ?? null} />
            <RateItem name="EUR/USD" price={rates?.eur?.price ?? null} change={rates?.eur?.change ?? null} />
            <RateItem name="GBP/USD" price={rates?.gbp?.price ?? null} change={rates?.gbp?.change ?? null} />
            <RateItem name="USD/JPY" price={rates?.jpy?.price ?? null} change={rates?.jpy?.change ?? null} />
            <RateItem name="USDT/USD" price={rates?.usdt?.price ?? null} change={rates?.usdt?.change ?? null} />
             {/* Duplicate for seamless loop */}
            <RateItem name="XAU/USD" price={rates?.gold?.price ?? null} change={rates?.gold?.change ?? null} />
            <RateItem name="EUR/USD" price={rates?.eur?.price ?? null} change={rates?.eur?.change ?? null} />
            <RateItem name="GBP/USD" price={rates?.gbp?.price ?? null} change={rates?.gbp?.change ?? null} />
            <RateItem name="USD/JPY" price={rates?.jpy?.price ?? null} change={rates?.jpy?.change ?? null} />
            <RateItem name="USDT/USD" price={rates?.usdt?.price ?? null} change={rates?.usdt?.change ?? null} />
        </div>
    </div>
  );
}
