'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function SignalsPage() {
  const { signals, loading } = useAuth();

  return (
    <section id="signals" className="py-16 md:py-24 bg-card pt-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">All Trading Signals</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Browse all available signals. Premium signals are unlocked for Pro members.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
             [...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)
          ) : signals.length > 0 ? (
            signals.map(signal => (
              <Card key={signal.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline">{signal.title}</CardTitle>
                    <Badge variant={signal.type === 'premium' ? 'default' : 'secondary'}>{signal.type}</Badge>
                  </div>
                  <CardDescription>{format(signal.createdAt.toDate(), 'PPP p')}</CardDescription>
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
                        <CardDescription>There are no signals available right now. Please check back later!</CardDescription>
                    </CardHeader>
                </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
