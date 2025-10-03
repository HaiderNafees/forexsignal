
import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  role: 'free' | 'pro' | 'admin';
  createdAt: string;
}

export interface Signal {
  id: string;
  title: string;
  pair: string; // e.g., 'XAU/USD'
  action: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  status: 'free' | 'premium';
  createdAt: string;
}

export interface UpgradeRequest {
    id: string;
    uid: string;
    email: string;
    requestedAt: Timestamp;
}
