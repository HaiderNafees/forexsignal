"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const features = [
  {
    title: "Real-Time Signals",
    description: "Get instant buy/sell signals delivered to your dashboard, sourced from professional traders and advanced algorithms."
  },
  {
    title: "Advanced Analytics",
    description: "Dive deep into market trends with our comprehensive analytics tools and live charts."
  },
  {
    title: "Pro-Level Insights",
    description: "Unlock premium content and in-depth analysis to inform your trading decisions."
  },
  {
    title: "User-Friendly Dashboard",
    description: "A clean, intuitive interface that lets you focus on what matters most: your trades."
  },
    {
    title: "Community & Support",
    description: "Join a community of traders and get support from our team of experts."
  },
    {
    title: "Cross-Platform Access",
    description: "Access your dashboard and signals from any device, anywhere in the world."
  }
];

export default function FeaturesPage() {
  return (
    <div className="bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Platform Features</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Everything you need to gain a competitive edge in the forex market.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-full">
                     <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                    <CardDescription className="mt-1">{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
