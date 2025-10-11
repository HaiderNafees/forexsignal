
"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle, BarChart2, Zap, Users, ShieldCheck, Gem, Smartphone, Lock } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const coreFeatures = [
  {
    title: "Real-Time Forex Signals",
    description: "Receive instant, high-probability buy/sell signals sourced from our team of professional traders and proprietary algorithms. Never miss a market move.",
    icon: Zap
  },
  {
    title: "Advanced Market Analytics",
    description: "Go beyond basic charts. Our dashboard provides comprehensive analytics, trend analysis, and volatility indicators to give you a complete market picture.",
    icon: BarChart2
  },
  {
    title: "Pro-Level Trading Insights",
    description: "Upgrade to Pro to unlock exclusive content, including in-depth market analysis, strategy breakdowns, and long-term outlooks from seasoned experts.",
    icon: Gem
  },
  {
    title: "User-Friendly Dashboard",
    description: "Our clean, intuitive interface is designed for focus. Easily track signals, monitor performance, and access analytics from one centralized hub.",
    icon: CheckCircle
  },
  {
    title: "Thriving Trader Community",
    description: "Join a vibrant community of fellow traders. Share ideas, discuss strategies, and learn from others in our exclusive Pro-member channels.",
    icon: Users
  },
  {
    title: "Integrated Risk Management",
    description: "Every signal comes with clear entry, stop-loss, and take-profit levels, helping you manage your risk effectively and trade with confidence.",
    icon: ShieldCheck
  },
   {
    title: "Multi-Device Support",
    description: "Access your dashboard and signals seamlessly from your desktop, tablet, or smartphone. Our platform is fully responsive to keep you connected on the go.",
    icon: Smartphone
  },
  {
    title: "Secure & Private",
    description: "Your data and privacy are paramount. We leverage secure infrastructure and encryption to ensure your information is always protected.",
    icon: Lock
  }
];

export default function FeaturesPage() {
    const dashboardImage = PlaceHolderImages.find(p => p.id === 'about-team'); // Reusing for now
  return (
    <div className="bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <header className="text-center mb-16">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Everything You Need to Succeed</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Trader Choice is more than just signals. It's a complete toolkit designed to give you a competitive edge in the forex market.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {coreFeatures.map((feature, index) => (
            <Card key={index} className="flex flex-col transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-transparent hover:border-primary bg-card">
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="bg-primary/10 text-primary p-3 rounded-full">
                     <feature.icon className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="font-headline text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {dashboardImage && (
             <section className="bg-card p-8 rounded-lg">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="pr-8">
                        <h2 className="font-headline text-3xl font-bold mb-4">Your Central Command Center</h2>
                        <p className="text-muted-foreground mb-4">
                            Our live dashboard is where the magic happens. View active signals, track your performance with detailed analytics, and access historical data to refine your strategy. It’s all the information you need, presented in a clean, intuitive, and powerful interface.
                        </p>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /> Live signal status and updates.</li>
                            <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /> Win/loss ratio and profit tracking.</li>
                            <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /> Exportable trade history.</li>
                        </ul>
                         <Button asChild className="mt-6">
                            <Link href="/pricing">Explore Plans</Link>
                        </Button>
                    </div>
                    <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
                        <Image
                            src={dashboardImage.imageUrl}
                            alt="Dashboard screenshot"
                            fill
                            className="object-cover"
                            data-ai-hint="dashboard ui"
                        />
                    </div>
                </div>
            </section>
        )}

      </div>
    </div>
  );
}
