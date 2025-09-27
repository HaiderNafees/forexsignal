
"use client";

import type { User, Signal } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { 
    collection, 
    doc, 
    onSnapshot, 
    setDoc, 
    deleteDoc, 
    updateDoc,
    query,
    orderBy
} from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

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
  addSignal: (signal: Omit<Signal, 'id' | 'createdAt'>) => Promise<void>;
  updateSignal: (signal: Signal) => Promise<void>;
  deleteSignal: (signalId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUser({ ...doc.data() as User, uid: doc.id });
          } else {
            // This case might happen if the user record in Firestore is deleted
            // but the auth record still exists.
            setUser(null);
          }
          setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Listen for changes to all users (for admin panel)
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ ...doc.data() as User, uid: doc.id }));
      setUsers(allUsers);
    });

    return () => unsubscribeUsers();
  }, []);

  useEffect(() => {
    // Listen for changes to all signals
    const signalsCollectionRef = collection(db, 'signals');
    const q = query(signalsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribeSignals = onSnapshot(q, (snapshot) => {
      const allSignals = snapshot.docs.map(doc => ({ ...doc.data() as Signal, id: doc.id }));
      setSignals(allSignals);
    });

    return () => unsubscribeSignals();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting the user and redirecting
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      // The router push is now handled by onAuthStateChanged effect
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signup = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      // Create a user document in Firestore
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        role: 'free',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      toast({
        title: 'Account Created',
        description: 'You can now log in.',
      });
      router.push('/login');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || 'An error occurred during signup.',
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);
  
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: error.message,
      });
    }
  }, [router, toast]);

  const updateUserRole = useCallback(async (userId: string, role: 'free' | 'pro' | 'admin') => {
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, { role });
      toast({
          title: 'User Role Updated',
          description: `User role has been successfully changed to ${role}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    }
  }, [toast]);

  const deleteUser = useCallback(async (userId: string) => {
    // Note: This only deletes the Firestore record. For a full deletion, 
    // you would need a Firebase Function to delete the auth user.
    const userDocRef = doc(db, 'users', userId);
    try {
      await deleteDoc(userDocRef);
      toast({
        variant: 'destructive',
        title: 'User Removed',
        description: 'The user has been successfully removed from the database.',
      });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: error.message,
        });
    }
  }, [toast]);

  const addSignal = useCallback(async (signalData: Omit<Signal, 'id' | 'createdAt'>) => {
    const newId = doc(collection(db, "signals")).id;
    const newSignal: Signal = {
        ...signalData,
        id: newId,
        createdAt: new Date().toISOString(),
    };
    try {
        await setDoc(doc(db, 'signals', newId), newSignal);
        toast({ title: "Signal Created" });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to Create Signal',
            description: error.message,
        });
    }
  }, [toast]);


  const updateSignal = useCallback(async (signal: Signal) => {
    const signalDocRef = doc(db, 'signals', signal.id);
    try {
      await updateDoc(signalDocRef, { ...signal });
      toast({ title: "Signal Updated" });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    }
  }, [toast]);
  
  const deleteSignal = useCallback(async (signalId: string) => {
    const signalDocRef = doc(db, 'signals', signalId);
    try {
        await deleteDoc(signalDocRef);
        toast({
            variant: "destructive",
            title: "Signal Deleted",
            description: "The signal has been removed successfully."
        })
    } catch(error: any) {
         toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error.message
        })
    }
  }, [toast]);

  useEffect(() => {
    if (!loading && user) {
        const path = user.role === 'admin' ? '/admin' : '/dashboard';
        if(window.location.pathname === '/login' || window.location.pathname === '/signup' || window.location.pathname === '/'){
             router.push(path);
        }
    }
  }, [user, loading, router]);


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
