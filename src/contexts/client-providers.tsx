'use client';

import { AuthProvider } from './auth-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { usePathname } from 'next/navigation';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <AuthProvider>
      {!isAdminRoute && <Header />}
      <main>{children}</main>
      {!isAdminRoute && <Footer />}
    </AuthProvider>
  );
}
