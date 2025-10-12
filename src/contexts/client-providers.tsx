'use client';

import { AuthProvider } from './auth-provider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
        {children}
    </AuthProvider>
  );
}
