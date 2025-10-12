import { Cta } from "@/components/home/cta";
import { Faq } from "@/components/home/faq";
import { FeaturesOverview } from "@/components/home/features-overview";
import { Hero } from "@/components/home/hero";
import { MarketTicker } from "@/components/home/market-ticker";
import { SignalsPreview } from "@/components/home/signals-preview";
import { Testimonials } from "@/components/home/testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <MarketTicker />
      <SignalsPreview />
      <FeaturesOverview />
      <Testimonials />
      <Faq />
      <Cta />
    </>
  );
}
