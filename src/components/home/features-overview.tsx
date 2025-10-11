
import { BarChart2, Zap, Users, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "Instant Signals",
    description: "Get real-time, high-probability buy/sell signals delivered straight to your dashboard the moment a trading opportunity arises.",
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-primary" />,
    title: "Pro Analytics",
    description: "Go beyond basic charts with our in-depth market analysis, trend indicators, and volatility metrics to make data-driven decisions.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: "Risk Management",
    description: "Every signal includes clear stop-loss and take-profit targets, helping you protect your capital and maintain discipline.",
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: "Community Access",
    description: "Join our exclusive Pro community to share insights, discuss strategies, and learn from a network of profitable traders.",
  },
];

export function FeaturesOverview() {
  return (
    <section className="bg-card py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="font-headline text-4xl md:text-5xl font-bold">
            A Better Way to Trade
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            We built Trader Choice to eliminate guesswork and empower you with the tools and insights needed to navigate the markets with confidence.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-none bg-transparent">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                <CardDescription className="mt-2">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
