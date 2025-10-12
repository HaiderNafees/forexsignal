
'use client';
import { useAuth } from '@/contexts/auth-provider';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
            <div className="container mx-auto flex items-center justify-between">
                <Logo />
                <div className='flex items-center gap-4'>
                    <p className='text-sm text-muted-foreground'>Logged in as {user.email}</p>
                    <Button variant="outline" size="sm" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>
        </header>
        <main className="container mx-auto py-8">
            {children}
        </main>
    </div>
  );
}
