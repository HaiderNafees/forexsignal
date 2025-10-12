'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-provider';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and user is not an admin, redirect away.
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  }

  // While loading, or if the user is not an admin, show a skeleton layout to prevent flicker
  // and content flashing.
  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
            <div className="container mx-auto flex items-center justify-between">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-10 w-24" />
            </div>
        </header>
        <main className="container mx-auto py-8">
            <div className="space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </main>
      </div>
    );
  }

  // If loading is finished and the user is an admin, show the layout.
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
        <div className="container mx-auto flex items-center justify-between">
            <Logo />
            <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
      </header>
       <main className="container mx-auto py-8">
        {children}
       </main>
    </div>
  );
}
