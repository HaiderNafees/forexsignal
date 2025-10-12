
"use client";

import React from 'react';
import type { Signal } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Clock, Target, ShieldX, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-provider";

function SignalCard({ signal }: { signal: Signal }) {
  const isBuy = signal.entryPrice < signal.takeProfit; // Infer action

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl">{signal.title}</CardTitle>
            <CardDescription>{signal.description}</CardDescription>
          </div>
          <Badge variant={isBuy ? "default" : "destructive"} className={cn(isBuy ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
            {isBuy ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
            {isBuy ? 'BUY' : 'SELL'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary"/>
            <div>
                <p className="text-muted-foreground">Entry</p>
                <p className="font-semibold">{signal.entryPrice.toFixed(4)}</p>
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
          <span>{signal.createdAt ? signal.createdAt.toDate().toLocaleDateString() : '...'}</span>
        </div>
         <Badge variant="outline">Free Signal</Badge>
      </CardFooter>
    </Card>
  );
}

export function SignalsPreview() {
  const { signals } = useAuth();
  // The provider already filters signals for logged-out users.
  const freeSignals = signals.filter(s => !s.isPremium);

  return (
    <section id="signals" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Today's Free Signals</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Get a glimpse of our premium analysis. Here are our latest free signals.
            </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {freeSignals.length > 0 ? (
            freeSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))
          ) : (
            <p className='text-center col-span-full text-muted-foreground'>No free signals available at the moment.</p>
          )}
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
