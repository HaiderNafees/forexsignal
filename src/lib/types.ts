import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  role: 'free' | 'pro' | 'admin';
  proExpires: Timestamp | null;
  createdAt: Timestamp;
}

export interface Signal {
  id: string;
  title: string;
  description: string;
  type: 'free' | 'premium';
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  createdBy: string; // Admin UID
  createdAt: Timestamp;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  txHash: string;
  verified: boolean;
  createdAt: Timestamp;
}
