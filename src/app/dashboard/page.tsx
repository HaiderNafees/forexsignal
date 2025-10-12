'use client';

import { useAuth } from '@/contexts/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Gem, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, signals, loading, signalsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  if (loading || !user) {
    return (
       <div className="min-h-screen bg-background pt-24">
         <div className="container mx-auto px-4 md:px-6 py-8">
            <header className="mb-8">
              <Skeleton className="h-10 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/3" />
            </header>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
         </div>
       </div>
    )
  }
  
  const displayedSignals = user.role === 'free' ? signals.slice(0, 2) : signals;

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <header className="mb-8">
          <h1 className="font-headline text-4xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome, {user.email}. Here are the latest signals based on your plan.
          </p>
        </header>

        {user.role === 'free' && (
          <Card className="mb-8 bg-accent/10 border-accent">
            <CardHeader className="flex flex-row items-center gap-4">
              <Gem className="h-8 w-8 text-accent" />
              <div>
                <CardTitle>Unlock Your Full Potential!</CardTitle>
                <CardDescription>You're currently on the free plan with limited signal access.</CardDescription>
              </div>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/pricing">Upgrade to Pro <ArrowRight className="ml-2 h-4 w-4"/></Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {signalsLoading ? (
            <>
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </>
          ) : displayedSignals.length > 0 ? (
            displayedSignals.map(signal => (
              <Card key={signal.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline">{signal.title}</CardTitle>
                    <Badge variant={signal.type === 'premium' ? 'default' : 'secondary'}>{signal.type}</Badge>
                  </div>
                  <CardDescription>{signal.createdAt ? format(signal.createdAt.toDate(), 'PPP p') : 'No date'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="text-sm text-muted-foreground">{signal.description}</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm font-bold text-green-500">Entry</p>
                        <p className="font-mono">{signal.entryPrice}</p>
                    </div>
                     <div>
                        <p className="text-sm font-bold text-blue-500">Take Profit</p>
                        <p className="font-mono">{signal.takeProfit}</p>
                    </div>
                     <div>
                        <p className="text-sm font-bold text-red-500">Stop Loss</p>
                        <p className="font-mono">{signal.stopLoss}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3">
                <Card className="flex flex-col items-center justify-center p-8 text-center">
                    <CardHeader>
                        <CardTitle>No Signals Available</CardTitle>
                        <CardDescription>There are no signals available for your current plan right now. Check back later!</CardDescription>
                    </CardHeader>
                </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
