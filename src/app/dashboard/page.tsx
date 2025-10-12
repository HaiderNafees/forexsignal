
"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function DashboardPage() {
  
  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <header className="mb-8">
          <h1 className="font-headline text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            This page is currently unavailable as backend functionality has been removed.
          </p>
        </header>

        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle className="font-headline">Functionality Disabled</AlertTitle>
            <AlertDescription>
                The user dashboard is not accessible because all backend services have been removed.
            </AlertDescription>
        </Alert>

        <div className="space-y-4 mt-8">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
