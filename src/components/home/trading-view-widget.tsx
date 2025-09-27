"use client";

import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current && container.current.children.length === 0) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          ["OANDA:XAUUSD|1D"]
        ],
        "chartOnly": false,
        "width": "100%",
        "height": "100%",
        "locale": "en",
        "colorTheme": "light",
        "autosize": true,
        "showVolume": true,
        "showMA": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        "fontSize": "10",
        "noTimeScale": false,
        "valuesTracking": "1",
        "changeMode": "price-and-percent",
        "chartType": "candlesticks",
        "maLineColor": "#2962FF",
        "maLineWidth": 1,
        "maLength": 9,
        "backgroundColor": "rgba(0, 0, 0, 0)",
        "widgetFontColor": "rgb(106, 109, 120)",
        "upColor": "#22ab94",
        "downColor": "#f7525f",
        "borderUpColor": "#22ab94",
        "borderDownColor": "#f7525f",
        "wickUpColor": "#22ab94",
        "wickDownColor": "#f7525f",
      });
      container.current.appendChild(script);
    }
  }, []);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Live Market Data: Gold (XAU/USD)</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Stay ahead of the curve with real-time price action for one of the world's most-watched assets.
            </p>
        </div>
        <div className="tradingview-widget-container h-[400px] md:h-[500px]" ref={container}>
          <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
        </div>
      </div>
    </section>
  );
}

export default memo(TradingViewWidget);
