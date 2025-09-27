import { Hero } from "@/components/home/hero";
import { SignalsPreview } from "@/components/home/signals-preview";
import TradingViewWidget from "@/components/home/trading-view-widget";

export default function Home() {
  return (
    <>
      <Hero />
      <SignalsPreview />
      <TradingViewWidget />
    </>
  );
}
