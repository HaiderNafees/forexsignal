"use client";

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Signal } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Clock, Lock, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

function SignalCard({ signal, isLocked }: { signal: Signal; isLocked: boolean }) {
  const isBuy = signal.action === 'BUY';
  
  return (
    <Card className={cn("flex flex-col transition-all", isLocked && "bg-muted/50")}>
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
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 text-sm relative">
        {isLocked && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
                <Lock className="h-8 w-8 text-primary mb-2"/>
                <p className="font-semibold">Unlock with Pro</p>
            </div>
        )}
        <p>Entry: {signal.entry.toFixed(4)}</p>
        <p>Stop Loss: {signal.stopLoss.toFixed(4)}</p>
        <p>Take Profit: {signal.takeProfit.toFixed(4)}</p>
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

function UpgradeAlert({ onUpgrade }: { onUpgrade: () => void }) {
    return (
        <Alert>
            <Star className="h-4 w-4" />
            <AlertTitle className="font-headline">Unlock Your Full Potential!</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
                You're currently on the free plan with limited signal access.
                <Button onClick={onUpgrade} size="sm" className="ml-4">
                    Upgrade to Pro <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </AlertDescription>
        </Alert>
    )
}

export default function DashboardPage() {
  const { user, signals, loading, updateUserRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if(!loading && user && user.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  const isPro = user.role === 'pro';

  const handleUpgrade = () => {
    if (user) {
      updateUserRole(user.uid, 'pro');
      toast({
          title: "Congratulations!",
          description: "You've been upgraded to a Pro account. All signals are now unlocked.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <header className="mb-8">
          <h1 className="font-headline text-4xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome, {user.email}. Here are the latest signals based on your plan.
          </p>
        </header>

        {!isPro && <div className="mb-8"><UpgradeAlert onUpgrade={handleUpgrade}/></div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {signals.map((signal, index) => {
            const isLocked = !isPro && signal.status === 'premium';
            const showSignal = isPro || user.role === 'admin' || signal.status === 'free';
            if (!showSignal) return null;
            return <SignalCard key={signal.id} signal={signal} isLocked={isLocked}/>
          })}
        </div>
      </div>
    </div>
  );
}
