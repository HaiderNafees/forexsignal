'use client';

import React, { createContext } from 'react';
import type { User, Signal, Payment } from '@/lib/types';

// Dummy context that returns empty/null values, effectively disabling all auth and data features.
const dummyContext = {
  user: null,
  firebaseUser: null,
  signals: [],
  allUsers: [],
  payments: [],
  loading: false,
  logout: () => {},
  addSignal: async () => {},
  updateSignal: async () => {},
  deleteSignal: async () => {},
  getAuth: () => { throw new Error('Auth is not available.'); },
  getDb: () => { throw new Error('Firestore is not available.'); },
  getFunctions: () => { throw new Error('Functions is not available.'); },
};

export const AuthContext = createContext<typeof dummyContext>(dummyContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={dummyContext}>{children}</AuthContext.Provider>;
}
