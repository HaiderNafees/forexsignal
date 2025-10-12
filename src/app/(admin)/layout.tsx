
'use client';

import React from 'react';
import { Logo } from '@/components/logo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen bg-muted/40">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
            <div className="container mx-auto flex items-center justify-between">
                <Logo />
            </div>
        </header>
        <main className="container mx-auto py-8">
            {children}
        </main>
    </div>
  );
}
