
"use client";

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-provider';
import type { User, Signal } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';
import type { getAuth } from "firebase/auth";
import type { getFirestore } from "firebase/firestore";


type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  users: User[];
  signals: Signal[];
  loading: boolean;
  logout: () => void;
  updateUserRole: (userId: string, role: 'free' | 'pro' | 'admin') => void;
  deleteUser: (userId: string) => void;
  addSignal: (signal: Omit<Signal, 'id' | 'createdAt'>) => Promise<void>;
  updateSignal: (signal: Signal) => Promise<void>;
  deleteSignal: (signalId: string) => Promise<void>;
  auth: ReturnType<typeof getAuth>;
  db: ReturnType<typeof getFirestore>;
};


export const useAuth = () => {
  const context = useContext(AuthContext as React.Context<AuthContextType>);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

    