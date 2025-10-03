
"use client";

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminTabs } from '@/components/admin/admin-tabs';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === 'admin' && user?.email === 'forexsignaldmn@gmail.com';

  React.useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/login');
    }
  }, [user, loading, router, isAdmin]);

  if (loading || !isAdmin) {
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

  return (
    <div className="min-h-screen bg-card pt-24">
        <div className="container mx-auto px-4 md:px-6 py-8">
            <header className="mb-8">
            <h1 className="font-headline text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
                Welcome, {user.email}. Manage the platform from here.
            </p>
            </header>
            <AdminTabs />
        </div>
    </div>
  );
}

    