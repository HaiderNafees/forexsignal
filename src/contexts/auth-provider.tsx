
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User, Signal } from '@/lib/types';
import { USERS as placeholderUsers, SIGNALS as placeholderSignals } from '@/lib/placeholder-data';


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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [users, setUsers] = useState<User[]>(placeholderUsers);
  const [signals, setSignals] = useState<Signal[]>(placeholderSignals);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const userRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUser(docSnap.data() as User);
        } else {
          // This can happen if the user record in Firestore is deleted
          // but they are still authenticated.
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));

    // Special admin credentials
    if (email === "admin@forexsignal.com" && pass === "Admin798956!!") {
      const adminUser = users.find(u => u.email === email);
      if (adminUser) {
        setUser(adminUser);
        toast({ title: 'Login Successful', description: 'Welcome back, Admin!' });
        router.push('/admin');
        setLoading(false);
        return;
      }
    }

    const foundUser = users.find(u => u.email === email);

    if (foundUser) {
      setUser(foundUser);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      const path = foundUser.role === 'admin' ? '/admin' : '/dashboard';
      router.push(path);
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
    await new Promise(res => setTimeout(res, 500));

    if (users.some(u => u.email === email)) {
        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: 'An account with this email already exists.',
        });
        setLoading(false);
        return;
    }

    const newUser: User = {
        uid: `user_${Date.now()}`,
        email,
        role: 'free',
        createdAt: new Date().toISOString(),
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);
    setUser(newUser);

    toast({
        title: 'Account Created',
        description: 'You have been successfully signed up! Redirecting to dashboard...',
    });
    router.push('/dashboard');
    setLoading(false);
  }, [router, toast, users]);
  
  const logout = useCallback(async () => {
    setUser(null);
    setFirebaseUser(null);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
  }, [router, toast]);

  const updateUserRole = useCallback(async (userId: string, role: 'free' | 'pro' | 'admin') => {
    const updatedUsers = users.map(u => u.uid === userId ? { ...u, role } : u);
    setUsers(updatedUsers);
    toast({
        title: 'User Role Updated',
        description: `User role has been successfully changed to ${role}.`,
    });
  }, [toast, users]);

  const deleteUser = useCallback(async (userId: string) => {
    const updatedUsers = users.filter(u => u.uid !== userId);
    setUsers(updatedUsers);
    toast({
      variant: 'destructive',
      title: 'User Removed',
      description: 'The user has been successfully removed.',
    });
  }, [toast, users]);

  const addSignal = useCallback(async (signalData: Omit<Signal, 'id' | 'createdAt'>) => {
    const newSignal: Signal = {
        ...signalData,
        id: `sig_${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    const updatedSignals = [newSignal, ...signals];
    setSignals(updatedSignals);
    toast({ title: "Signal Created" });
  }, [toast, signals]);


  const updateSignal = useCallback(async (signal: Signal) => {
    const updatedSignals = signals.map(s => s.id === signal.id ? signal : s);
    setSignals(updatedSignals);
    toast({ title: "Signal Updated" });
  }, [toast, signals]);
  
  const deleteSignal = useCallback(async (signalId: string) => {
    const updatedSignals = signals.filter(s => s.id !== signalId);
    setSignals(updatedSignals);
    toast({
        variant: "destructive",
        title: "Signal Deleted",
        description: "The signal has been removed successfully."
    })
  }, [toast, signals]);

  const contextValue = {
    user,
    firebaseUser,
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
      {children}
    </AuthContext.Provider>
  );
}
