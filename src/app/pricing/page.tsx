
"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const tiers = [
  {
    name: "Free",
    price: "$0",
    priceFrequency: "/ month",
    description: "Get a feel for our platform with basic access.",
    features: [
      "Access to 2 free signals daily",
      "Basic market overview",
      "Email support"
    ],
    cta: "Start for Free",
    href: "/signup",
    variant: "secondary",
  },
  {
    name: "Pro",
    price: "$29",
    priceFrequency: "/ month",
    description: "Unlock the full power of ForexEdge for serious traders.",
    features: [
      "Unlimited access to all signals",
      "Advanced real-time analytics",
      "Premium, in-depth market insights",
      "Priority email & chat support",
      "Access to pro community channels"
    ],
    cta: "Go Pro",
    href: "/signup",
    variant: "default",
  },
];

export default function PricingPage() {
    const { user, updateUserRole } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const handleUpgradeConfirm = () => {
        if (!user) {
            router.push('/signup');
            return;
        }
        if (user.role === 'free') {
            updateUserRole(user.uid, 'pro');
            toast({
                title: "Congratulations!",
                description: "You've been upgraded to a Pro account. All signals are now unlocked.",
            });
            router.push('/dashboard');
        } else if (user.role === 'pro') {
             toast({
                title: "You are already a Pro!",
                description: "Your account is already upgraded.",
            });
        }
    };
    
    const handleGoProClick = () => {
        if (!user) {
            router.push('/signup');
        }
        // If user is already pro, do nothing. The button is disabled anyway.
    }


  return (
    <div className="bg-card pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Simple, transparent pricing. Get started for free and upgrade when you're ready to take your trading to the next level.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col ${tier.variant === 'default' ? 'border-primary shadow-lg' : ''}`}>
              <CardHeader>
                <CardTitle className="font-headline text-3xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="flex items-baseline pt-4">
                    <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.priceFrequency}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-4">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                 {tier.name === 'Pro' ? (
                   user && user.role === 'pro' ? (
                      <Button className="w-full" variant={tier.variant as any} disabled>
                          You are already a Pro
                      </Button>
                   ) : user && user.role === 'free' ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full" variant={tier.variant as any}>Go Pro</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Your Upgrade</AlertDialogTitle>
                          <AlertDialogDescription>
                            You are about to upgrade to the Pro plan for $29/month. This will be charged to your default payment method.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleUpgradeConfirm}>Confirm Payment</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                     <Button onClick={handleGoProClick} className="w-full" variant={tier.variant as any}>
                        {tier.cta}
                      </Button>
                  )
                ) : (
                  <Button asChild className="w-full" variant={tier.variant as any}>
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
