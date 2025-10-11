
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Target, Users, Zap, BarChart2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'about-team');

  return (
    <div className="bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">About Trader Choice</h1>
          <p className="text-muted-foreground mt-3 max-w-3xl mx-auto">
            We are on a mission to democratize forex trading by providing transparent, data-driven signals and powerful analytical tools to everyday traders.
          </p>
        </header>

        {aboutImage && (
             <div className="relative w-full h-96 rounded-lg overflow-hidden mb-16 shadow-lg">
                <Image
                    src={aboutImage.imageUrl}
                    alt={aboutImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={aboutImage.imageHint}
                />
                 <div className="absolute inset-0 bg-black/50" />
            </div>
        )}

        <section className="mb-16">
             <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="font-headline text-3xl font-bold mb-4">Our Story & Mission</h2>
                    <p className="text-muted-foreground mb-4">
                        Founded by a team of veteran traders and fintech specialists, Trader Choice was born out of a shared frustration: the best trading tools were reserved for the financial elite. We decided to change that. Our mission is to level the playing field by combining institutional-grade analytics with a user-friendly platform, making profitable trading accessible to everyone.
                    </p>
                    <p className="text-muted-foreground">
                        We are relentlessly committed to transparency, accuracy, and the long-term success of our members. Your journey in the markets is our priority, and we're here to provide the support and technology you need to thrive.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Target className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>Accuracy</CardTitle>
                                <p className="text-sm text-muted-foreground">Data-driven signals rigorously backtested for performance.</p>
                            </div>
                        </CardHeader>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Users className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>Transparency</CardTitle>
                                <p className="text-sm text-muted-foreground">Clear performance metrics and a commitment to honesty.</p>
                            </div>
                        </CardHeader>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Building className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>Innovation</CardTitle>
                                <p className="text-sm text-muted-foreground">Continuously improving our algorithms and platform features.</p>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </section>

        <section className="bg-card p-8 rounded-lg mb-16">
            <h2 className="font-headline text-3xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                    <div className="bg-primary/10 text-primary p-4 rounded-full mb-4">
                        <BarChart2 className="w-10 h-10" />
                    </div>
                    <h3 className="font-headline text-xl font-semibold mb-2">1. Market Analysis</h3>
                    <p className="text-muted-foreground text-sm">Our proprietary algorithms and expert analysts scan global markets 24/7, identifying high-probability opportunities using technical and fundamental analysis.</p>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="bg-primary/10 text-primary p-4 rounded-full mb-4">
                        <Zap className="w-10 h-10" />
                    </div>
                    <h3 className="font-headline text-xl font-semibold mb-2">2. Signal Generation</h3>
                    <p className="text-muted-foreground text-sm">When a valid setup is detected, a signal is generated with precise entry, stop-loss, and take-profit levels, which is then sent for delivery.</p>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="bg-primary/10 text-primary p-4 rounded-full mb-4">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h3 className="font-headline text-xl font-semibold mb-2">3. Instant Delivery</h3>
                    <p className="text-muted-foreground text-sm">You receive the signal instantly on your dashboard. Pro members also get priority alerts to act on opportunities without delay.</p>
                </div>
            </div>
        </section>

        <section className="text-center">
            <h2 className="font-headline text-3xl font-bold">Join Our Growing Community</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                Ready to take control of your trading journey? Sign up today and get access to the tools and insights you need to succeed.
            </p>
            <div className="mt-8">
                <Button size="lg" asChild>
                    <Link href="/signup">
                        Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </section>

      </div>
    </div>
  );
}
