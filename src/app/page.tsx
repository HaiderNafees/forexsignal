
import { Cta } from "@/components/home/cta";
import { Faq } from "@/components/home/faq";
import { FeaturesOverview } from "@/components/home/features-overview";
import { Hero } from "@/components/home/hero";
import { MarketTicker } from "@/components/home/market-ticker";
import { SignalsPreview } from "@/components/home/signals-preview";
import { Testimonials } from "@/components/home/testimonials";
import { AuthProvider } from "@/contexts/auth-provider";

export default function Home() {
  return (
    <AuthProvider>
      <Hero />
      <MarketTicker />
      <SignalsPreview />
      <FeaturesOverview />
      <Testimonials />
      <Faq />
      <Cta />
    </AuthProvider>
  );
}
