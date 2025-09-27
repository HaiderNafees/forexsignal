"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle, BarChart2, Zap, Users, ShieldCheck, Gem } from "lucide-react";

const features = [
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
    title: "Risk Management Tools",
    description: "Every signal comes with clear entry, stop-loss, and take-profit levels, helping you manage your risk effectively and trade with confidence.",
    icon: ShieldCheck
  }
];

export default function FeaturesPage() {
  return (
    <div className="bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Platform Features</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Everything you need to gain a competitive edge in the forex market, from high-quality signals to advanced analytics.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="flex flex-col transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary p-3 rounded-full">
                     <feature.icon className="h-6 w-6" />
                  </div>
                   <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
