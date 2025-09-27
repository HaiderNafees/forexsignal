import { SIGNALS } from "@/lib/placeholder-data";
import type { Signal } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Clock, Target, ShieldX, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

function SignalCard({ signal, isLocked }: { signal: Signal, isLocked: boolean }) {
  const isBuy = signal.action === 'BUY';
  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 relative">
      {isLocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
            <Lock className="h-8 w-8 text-primary mb-2"/>
            <p className="font-semibold text-center px-4">This is a premium signal.</p>
            <Button asChild size="sm" className="mt-4">
                <Link href="/pricing">Unlock with Pro</Link>
            </Button>
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl">{signal.pair}</CardTitle>
            <CardDescription>{signal.title}</CardDescription>
          </div>
          <Badge variant={isBuy ? "default" : "destructive"} className={cn(isBuy ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
            {isBuy ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
            {signal.action}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary"/>
            <div>
                <p className="text-muted-foreground">Entry</p>
                <p className="font-semibold">{signal.entry.toFixed(4)}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-red-500"/>
            <div>
                <p className="text-muted-foreground">Stop Loss</p>
                <p className="font-semibold">{signal.stopLoss.toFixed(4)}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500"/>
            <div>
                <p className="text-muted-foreground">Take Profit</p>
                <p className="font-semibold">{signal.takeProfit.toFixed(4)}</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{new Date(signal.createdAt).toLocaleDateString()}</span>
        </div>
         <Badge variant={signal.status === 'premium' ? "outline" : "secondary"} className={cn(signal.status === 'premium' && "border-accent text-accent")}>
          {signal.status}
        </Badge>
      </CardFooter>
    </Card>
  );
}

export default function SignalsPage() {
  return (
    <section id="signals" className="py-16 md:py-24 bg-card pt-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold">Trading Signals</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Browse our latest signals. Free users can view a limited selection, while Pro members get full access.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SIGNALS.map((signal, index) => {
            const isLocked = signal.status === 'premium';
            return <SignalCard key={signal.id} signal={signal} isLocked={isLocked} />
          })}
        </div>
        <div className="mt-12 text-center">
            <Button asChild size="lg" variant="default">
                <Link href="/signup">
                    Get Full Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
