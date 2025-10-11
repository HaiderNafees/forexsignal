"use client";

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-provider';
import type { User, Signal, UpgradeRequest } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';
import type { getAuth, Auth } from "firebase/auth";
import type { getFirestore, Firestore } from "firebase/firestore";

type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signals: Signal[];
  loading: boolean;
  logout: () => void;
  addSignal: (signal: Omit<Signal, 'id' | 'createdAt'>) => Promise<void>;
  updateSignal: (signal: Signal) => Promise<void>;
  deleteSignal: (signalId: string, status: 'free' | 'premium') => Promise<void>;
  auth: Auth;
  db: Firestore;
  allUsers: User[];
  upgradeRequests: UpgradeRequest[];
};


export const useAuth = () => {
  const context = useContext(AuthContext as React.Context<AuthContextType>);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
