
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';


// --- Main Admin Page ---
export default function AdminPage() {

  return (
    <div className="p-8">
      <h1 className="font-headline text-3xl font-bold mb-6">Admin Dashboard</h1>
       <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle className="font-headline">Functionality Disabled</AlertTitle>
            <AlertDescription>
                The admin panel is not accessible because all backend services have been removed.
            </AlertDescription>
        </Alert>
        <div className="w-full space-y-8 mt-8">
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        </div>
    </div>
  );
}
