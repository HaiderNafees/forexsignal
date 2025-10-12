'use client';

import { AuthProvider } from './auth-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </AuthProvider>
  );
}
