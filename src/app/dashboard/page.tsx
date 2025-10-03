
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
import Link from 'next/link';

function SignalCard({ signal }: { signal: Signal; }) {
  const isBuy = signal.action === 'BUY';
  
  return (
    <Card className="flex flex-col transition-all">
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

function UpgradeAlert() {
    return (
        <Alert>
            <Star className="h-4 w-4" />
            <AlertTitle className="font-headline">Unlock Your Full Potential!</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
                You're currently on the free plan with limited signal access.
                <Button asChild size="sm" className="ml-4">
                  <Link href="/pricing">
                    Upgrade to Pro <ArrowRight className="ml-2 h-4 w-4"/>
                  </Link>
                </Button>
            </AlertDescription>
        </Alert>
    )
}

export default function DashboardPage() {
  const { user, signals, loading } = useAuth();
  const router = useRouter();
  
  React.useEffect(() => {
    // Wait until the authentication check is complete.
    if (!loading) {
      if (!user) {
        // If there's no user after loading, they are not logged in.
        router.replace('/login');
      } else if (user.role === 'admin') {
        // If the user is an admin, they should be on the admin page.
        router.replace('/admin');
      }
    }
  }, [user, loading, router]);

  // Show a loading skeleton while auth state is resolving OR if the user is not the correct role yet.
  // This prevents a flash of the dashboard before a potential redirect.
  if (loading || !user || user.role === 'admin') {
    return (
      <div className="container mx-auto py-10 px-4 pt-24">
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
  const visibleSignals = isPro ? signals : signals.filter(s => s.status === 'free');

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <header className="mb-8">
          <h1 className="font-headline text-4xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome, {user.email}. Here are the latest signals based on your plan.
          </p>
        </header>

        {!isPro && <div className="mb-8"><UpgradeAlert /></div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
        {visibleSignals.length === 0 && !loading && (
          <div className="text-center py-16 bg-card rounded-lg">
            <p className="text-muted-foreground">No signals available for your current plan right now. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}
