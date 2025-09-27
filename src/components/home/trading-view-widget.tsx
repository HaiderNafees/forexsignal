"use client";

import React, { useEffect, useRef, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);
  const isDarkTheme = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (container.current && container.current.children.length === 0) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      const widgetConfig = {
        "width": "100%",
        "height": "100%",
        "symbol": "OANDA:XAUUSD",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": isDarkTheme ? "dark" : "light",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "support_host": "https://www.tradingview.com"
      };
      script.innerHTML = JSON.stringify(widgetConfig);
      container.current.appendChild(script);
    }
  }, [isDarkTheme]);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Live Market Data: Gold (XAU/USD)</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Stay ahead of the curve with real-time price action for one of the world's most-watched assets.
            </p>
        </div>
        <Card className="shadow-2xl overflow-hidden">
            <CardContent className="p-0">
                <div className="h-[610px] w-full" ref={container}>
                    <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
                </div>
            </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default memo(TradingViewWidget);
