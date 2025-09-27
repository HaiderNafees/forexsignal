
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
