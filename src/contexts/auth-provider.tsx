
"use client";

import type { User, Signal } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { USERS, SIGNALS as INITIAL_SIGNALS } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type AuthContextType = {
  user: User | null;
  users: User[];
  signals: Signal[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUserRole: (userId: string, role: 'free' | 'pro' | 'admin') => void;
  deleteUser: (userId: string) => void;
  addSignal: (signal: Signal) => void;
  updateSignal: (signal: Signal) => void;
  deleteSignal: (signalId: string) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In a real app, you'd fetch this from a database.
// We use localStorage to persist data across reloads for this simulation.
const getInitialState = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure that for users, we don't return an empty array if there's nothing in storage
        // and instead fall back to the initial dummy data. This prevents existing users from disappearing.
        if (key === 'forex-edge-all-users' && Array.isArray(parsed) && parsed.length === 0) {
            localStorage.setItem(key, JSON.stringify(fallback));
            return fallback;
        }
        return parsed;
    }
     localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage`, error);
    return fallback;
  }
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getInitialState('forex-edge-user', null));
  const [users, setUsers] = useState<User[]>(() => getInitialState('forex-edge-all-users', USERS));
  const [signals, setSignals] = useState<Signal[]>(() => getInitialState('forex-edge-signals', INITIAL_SIGNALS));
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(false);
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('forex-edge-user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('forex-edge-all-users', JSON.stringify(users));
  }, [users]);
  
  useEffect(() => {
    localStorage.setItem('forex-edge-signals', JSON.stringify(signals));
  }, [signals]);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = users.find(u => u.email === email);
    
    // Specific check for hardcoded admin credentials
    if (email === 'admin@forexsignal.com' && pass === 'Admin798956!!') {
      const adminUser = users.find(u => u.role === 'admin');
      if (adminUser) {
        setUser(adminUser);
        toast({ title: 'Welcome, Admin!', description: 'Redirecting to your dashboard.' });
        router.push('/admin');
      }
      setLoading(false);
      return;
    }

    if (foundUser) {
      setUser(foundUser);
      toast({ title: 'Login Successful', description: `Welcome back, ${foundUser.email}!` });
      if (foundUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
      });
    }
    setLoading(false);
  }, [router, toast, users]);

  const signup = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const existingUser = users.find(u => u.email === email);
    if(existingUser) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'An account with this email already exists.',
      });
      setLoading(false);
      return;
    }

    const newUser: User = {
      uid: `new-user-${Math.random().toString(36).substr(2, 9)}`,
      email,
      role: 'free',
      createdAt: new Date().toISOString(),
    };

    setUsers(prevUsers => [...prevUsers, newUser]);
    
    // Don't log in user automatically.
    // setUser(newUser); 
    
    toast({
      title: 'Account Created',
      description: 'Please proceed to login.',
    });

    router.push('/signup/confirm');
    setLoading(false);
  }, [router, toast, users]);
  
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('forex-edge-user');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
  }, [router, toast]);

  const updateUserRole = useCallback((userId: string, role: 'free' | 'pro' | 'admin') => {
    setUsers(prevUsers => prevUsers.map(u => (u.uid === userId ? { ...u, role } : u)));
    if (user && user.uid === userId) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
    }
     toast({
        title: 'User Role Updated',
        description: `User role has been successfully changed to ${role}.`,
    });
  }, [user, toast]);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prevUsers => prevUsers.filter(u => u.uid !== userId));
    toast({
      variant: 'destructive',
      title: 'User Removed',
      description: 'The user has been successfully removed.',
    });
  }, [toast]);

  const addSignal = useCallback((signal: Signal) => {
    setSignals(prevSignals => [signal, ...prevSignals]);
    toast({ title: "Signal Created" });
  }, [toast]);

  const updateSignal = useCallback((signal: Signal) => {
    setSignals(prevSignals => prevSignals.map(s => s.id === signal.id ? signal : s));
    toast({ title: "Signal Updated" });
  }, [toast]);
  
  const deleteSignal = useCallback((signalId: string) => {
    setSignals(prevSignals => prevSignals.filter(s => s.id !== signalId));
     toast({
        variant: "destructive",
        title: "Signal Deleted",
        description: "The signal has been removed successfully."
    })
  }, [toast]);


  const contextValue = {
    user,
    users,
    signals,
    loading,
    login,
    signup,
    logout,
    updateUserRole,
    deleteUser,
    addSignal,
    updateSignal,
    deleteSignal,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? <div className="w-full h-screen flex items-center justify-center"><Skeleton className="h-20 w-20 rounded-full" /></div> : children}
    </AuthContext.Provider>
  );
}
