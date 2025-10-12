
import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
  proExpires: Timestamp | null;
  createdAt: Timestamp;
}

export interface Signal {
  id: string;
  title: string;
  description: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  isPremium: boolean;
  createdBy: string; // Admin UID
  createdAt: Timestamp;
}

export interface Payment {
    id: string;
    uid: string;
    txHash: string;
    amount: number;
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt: Timestamp | null;
    createdAt: Timestamp;
}
