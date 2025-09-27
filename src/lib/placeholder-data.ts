import type { User, Signal } from '@/lib/types';

// This data is now only for reference and initial seeding if needed.
// The primary source of truth is Firebase Firestore.

export const USERS: User[] = [
  {
    uid: 'admin001',
    email: 'admin@forexsignal.com',
    role: 'admin',
    createdAt: new Date('2023-01-15T10:00:00Z').toISOString(),
  },
  {
    uid: 'pro001',
    email: 'pro.user@example.com',
    role: 'pro',
    createdAt: new Date('2023-05-20T14:30:00Z').toISOString(),
  },
  {
    uid: 'free001',
    email: 'free.user@example.com',
    role: 'free',
    createdAt: new Date('2023-08-10T09:00:00Z').toISOString(),
  },
  {
    uid: 'free002',
    email: 'another.free@example.com',
    role: 'free',
    createdAt: new Date('2023-09-01T18:45:00Z').toISOString(),
  },
];

export const SIGNALS: Signal[] = [
  {
    id: 'sig001',
    title: 'Gold Long Opportunity',
    pair: 'XAU/USD',
    action: 'BUY',
    entry: 1950.5,
    stopLoss: 1945.0,
    takeProfit: 1965.0,
    status: 'free',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sig002',
    title: 'Euro-Dollar Short',
    pair: 'EUR/USD',
    action: 'SELL',
    entry: 1.085,
    stopLoss: 1.09,
    takeProfit: 1.075,
    status: 'free',
    createdAt: new Date(new Date().getTime() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sig003',
    title: 'Cable (GBP/USD) Breakout',
    pair: 'GBP/USD',
    action: 'BUY',
    entry: 1.25,
    stopLoss: 1.245,
    takeProfit: 1.26,
    status: 'premium',
    createdAt: new Date(new Date().getTime() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sig004',
    title: 'USD/JPY Reversal Watch',
    pair: 'USD/JPY',
    action: 'SELL',
    entry: 148.2,
    stopLoss: 148.7,
    takeProfit: 147.0,
    status: 'premium',
    createdAt: new Date(new Date().getTime() - 8 * 60 * 60 * 1000).toISOString(),
  },
    {
    id: 'sig005',
    title: 'Aussie Dollar Rally',
    pair: 'AUD/USD',
    action: 'BUY',
    entry: 0.6550,
    stopLoss: 0.6520,
    takeProfit: 0.6650,
    status: 'premium',
    createdAt: new Date(new Date().getTime() - 12 * 60 * 60 * 1000).toISOString(),
  },
];
