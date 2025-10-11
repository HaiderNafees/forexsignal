
"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check, X, Minus } from "lucide-react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

const tiers = [
  {
    name: "Free",
    price: "$0",
    priceFrequency: "/ month",
    description: "Get a feel for our platform with basic access to kickstart your journey.",
    features: [
      "Access to 2 free signals daily",
      "Basic market overview",
      "Standard email support",
      "Limited historical data"
    ],
    cta: "Start for Free",
    href: "/signup",
    variant: "secondary",
  },
  {
    name: "Pro",
    price: "$29",
    priceFrequency: "/ month",
    description: "Unlock the full power of ForexEdge for serious traders aiming for consistent results.",
    features: [
      "Unlimited access to all signals",
      "Advanced real-time analytics & insights",
      "Priority email & chat support",
      "Full historical data & backtesting",
      "Access to pro community channels"
    ],
    cta: "Go Pro",
    href: "/signup",
    variant: "default",
  },
];

const featureComparison = [
    { feature: 'Daily Signals', free: '2 per day', pro: 'Unlimited' },
    { feature: 'Currency Pairs', free: 'Major pairs only', pro: 'All pairs, including exotics' },
    { feature: 'Real-Time Analytics', free: <X className="text-red-500" />, pro: <Check className="text-green-500" /> },
    { feature: 'Community Access', free: <X className="text-red-500" />, pro: <Check className="text-green-500" /> },
    { feature: 'Historical Data', free: 'Last 7 days', pro: 'Unlimited' },
    { feature: 'Support', free: 'Email', pro: 'Priority Email & Chat' },
];

const pricingFaqs = [
    {
        question: "Is there a free trial for the Pro plan?",
        answer: "We do not offer a free trial for the Pro plan. However, our Free plan is available for you to test our platform's core features indefinitely."
    },
    {
        question: "What payment methods do you accept?",
        answer: "For this prototype, we simulate a bank transfer. In a real-world scenario, we would accept all major credit cards, PayPal, and other popular payment methods."
    },
    {
        question: "How do I cancel my subscription?",
        answer: "You can cancel your subscription at any time from your account dashboard. The cancellation will take effect at the end of your current billing cycle."
    },
    {
        question: "Can I upgrade or downgrade my plan later?",
        answer: "Yes, you can easily upgrade from the Free to the Pro plan at any time. Downgrading options would be available through your account settings."
    }
]

export default function PricingPage() {
    const { user, db } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const handleRequestUpgrade = async () => {
        if (!user || !db) return;

        const requestData = {
            uid: user.uid,
            email: user.email,
            requestedAt: serverTimestamp(),
        };
        const requestsCollection = collection(db, 'upgrade_requests');
        
        addDoc(requestsCollection, requestData)
            .then(() => {
                toast({
                    title: "Upgrade Request Submitted!",
                    description: "Your request has been sent to our team. We will upgrade your account after verifying payment.",
                });
            })
            .catch((serverError) => {
                if (serverError.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: requestsCollection.path,
                        operation: 'create',
                        requestResourceData: requestData
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Request Failed",
                        description: "Could not submit your upgrade request. Please try again or contact support."
                    });
                }
            });
    };
    
    const handleGoProClick = () => {
        if (!user) {
            router.push('/signup');
        }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col ${tier.variant === 'default' ? 'border-primary shadow-2xl' : ''}`}>
              <CardHeader className="border-b">
                <CardTitle className="font-headline text-3xl">{tier.name}</CardTitle>
                <div className="flex items-baseline pt-2">
                    <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.priceFrequency}</span>
                </div>
                 <CardDescription className="pt-2">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <ul className="space-y-4">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-4">
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
                          <AlertDialogTitle>Complete Your Upgrade</AlertDialogTitle>
                           <AlertDialogDescription asChild>
                            <div className="space-y-4 text-sm text-foreground pt-2">
                                <div>To upgrade to the Pro plan for $29/month, please make a payment to the following account:</div>
                                <div className="p-4 rounded-md border bg-muted">
                                    <div><span className="font-semibold">Bank:</span> Global Trading Bank</div>
                                    <div><span className="font-semibold">Account Name:</span> ForexEdge Inc.</div>
                                    <div><span className="font-semibold">Account Number:</span> 1234567890</div>
                                    <div><span className="font-semibold">Reference:</span> {user.email}</div>
                                </div>
                                <div className="text-xs text-muted-foreground">After making the payment, click the button below. An admin will verify and approve your request.</div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRequestUpgrade}>I Have Made The Payment</AlertDialogAction>
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
        
        <section className="mb-20">
             <h2 className="font-headline text-3xl font-bold text-center mb-8">Feature Comparison</h2>
             <Card className="max-w-4xl mx-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Feature</TableHead>
                            <TableHead className="text-center">Free</TableHead>
                            <TableHead className="text-center">Pro</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {featureComparison.map(item => (
                            <TableRow key={item.feature}>
                                <TableCell className="font-medium">{item.feature}</TableCell>
                                <TableCell className="text-center">{item.free}</TableCell>
                                <TableCell className="text-center font-semibold text-primary">{item.pro}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </Card>
        </section>

        <section>
            <h2 className="font-headline text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="w-full">
                {pricingFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left font-headline text-lg">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </div>
        </section>

      </div>
    </div>
  );
}

    