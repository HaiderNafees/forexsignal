"use client";

import type { User } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { USERS } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUserRole: (userId: string, role: 'free' | 'pro') => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('forex-edge-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('forex-edge-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === 'admin@forexsignal.com' && pass === 'Admin798956!!') {
      const adminUser = USERS.find(u => u.role === 'admin');
      if (adminUser) {
        setUser(adminUser);
        localStorage.setItem('forex-edge-user', JSON.stringify(adminUser));
        toast({ title: 'Welcome, Admin!', description: 'Redirecting to your dashboard.' });
        router.push('/admin');
      }
      setLoading(false);
      return;
    }

    const foundUser = USERS.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('forex-edge-user', JSON.stringify(foundUser));
      toast({ title: 'Login Successful', description: `Welcome back, ${foundUser.email}!` });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
      });
    }
    setLoading(false);
  }, [router, toast]);

  const signup = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const existingUser = USERS.find(u => u.email === email);
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
    // In a real app, we'd add this to the database. Here, we just simulate it.
    setUser(newUser);
    localStorage.setItem('forex-edge-user', JSON.stringify(newUser));
    toast({ title: 'Signup Successful!', description: 'Welcome to ForexEdge!' });
    router.push('/dashboard');
    setLoading(false);
  }, [router, toast]);
  
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('forex-edge-user');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
  }, [router, toast]);

  const updateUserRole = useCallback((userId: string, role: 'free' | 'pro') => {
    // This is a simulation for the "Upgrade to Pro" button
    if (user && user.uid === userId) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('forex-edge-user', JSON.stringify(updatedUser));
      toast({
        title: 'Account Updated!',
        description: `Your role has been changed to ${role}.`,
      });
    }
  }, [user, toast]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUserRole }}>
      {loading ? <div className="w-full h-screen flex items-center justify-center"><Skeleton className="h-20 w-20 rounded-full" /></div> : children}
    </AuthContext.Provider>
  );
}
