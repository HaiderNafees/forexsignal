
"use client";

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-provider';
import type { User, Signal } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';


type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  users: User[];
  signals: Signal[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUserRole: (userId: string, role: 'free' | 'pro' | 'admin') => void;
  deleteUser: (userId: string) => void;
  addSignal: (signal: Omit<Signal, 'id' | 'createdAt'>) => Promise<void>;
  updateSignal: (signal: Signal) => Promise<void>;
  deleteSignal: (signalId: string) => Promise<void>;
};


export const useAuth = () => {
  const context = useContext(AuthContext as React.Context<AuthContextType>);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
