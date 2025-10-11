
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  return (
    <section className="relative h-screen w-full">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
        <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 max-w-4xl">
          <h1 className="font-headline text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
            Trade Smarter with <span className="text-primary">Trader Choice</span>
          </h1>
          <p className="mt-6 mx-auto max-w-3xl text-lg text-gray-300 md:text-xl">
            Unlock your trading potential with professional-grade signals, real-time market data, and powerful analytics. Your journey to consistent profitability in the forex market starts right here.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <Link href="/pricing">View Pro Plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
