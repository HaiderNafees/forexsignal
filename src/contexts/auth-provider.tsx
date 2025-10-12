
// src/contexts/auth-provider.tsx
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { getFunctions, type Functions } from "firebase/functions";
import type { Auth } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import type { User, Signal, Payment } from '@/lib/types';
import { getFirebaseInstances } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signals: Signal[];
  allUsers: User[];
  payments: Payment[];
  loading: boolean;
  logout: () => void;
  addSignal: (signal: Omit<Signal, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateSignal: (signal: Omit<Signal, 'createdAt' | 'createdBy'>) => Promise<void>;
  deleteSignal: (signalId: string) => Promise<void>;
  getAuth: () => Auth;
  getDb: () => Firestore;
  getFunctions: () => Functions;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const protectedRoutes = ['/dashboard', '/admin'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const { auth, db, functions } = getFirebaseInstances();

  const getAuthInstance = () => auth;
  const getDbInstance = () => db;
  const getFunctionsInstance = () => functions;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
           const userData = { uid: userDoc.id, ...userDoc.data() } as User;
           setUser(userData);
           setFirebaseUser(fbUser);
        } else {
             await signOut(auth);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
            router.replace('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, db]);

   useEffect(() => {
    if (loading) return;

    let unsubscribeSignals: () => void = () => {};
    let unsubscribeUsers: () => void = () => {};
    let unsubscribePayments: () => void = () => {};

    if (user) { 
      const isPro = user.proExpires ? user.proExpires.toMillis() > Date.now() : false;

      let signalsQuery;
      if (user.role === 'admin' || isPro) {
        signalsQuery = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
      } else {
        signalsQuery = query(
          collection(db, 'signals'),
          where('isPremium', '==', false)
        );
      }
      
      unsubscribeSignals = onSnapshot(signalsQuery, snapshot => {
        let fetchedSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
        
        if (user.role !== 'admin' && !isPro) {
            fetchedSignals.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            fetchedSignals = fetchedSignals.slice(0, 2);
        }

        setSignals(fetchedSignals);
      }, (error) => {
        console.error("Signal fetch error:", error);
      });

      if (user.role === 'admin') {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        unsubscribeUsers = onSnapshot(usersQuery, snapshot => {
          setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
        });

        const paymentsQuery = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
        unsubscribePayments = onSnapshot(paymentsQuery, snapshot => {
          setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
        });
      }
    } else { 
        const guestQuery = query(
            collection(db, 'signals'),
            where('isPremium', '==', false)
        );
      unsubscribeSignals = onSnapshot(guestQuery, (snapshot) => {
        let fetchedSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
        fetchedSignals.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setSignals(fetchedSignals.slice(0, 2));
      });
    }

    return () => {
      unsubscribeSignals();
      unsubscribeUsers();
      unsubscribePayments();
    };
  }, [user, loading, db, toast]);


  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      setSignals([]);
      setAllUsers([]);
      setPayments([]);
      router.push('/login');
      toast({ title: 'Logged Out' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  }, [auth, router, toast]);

  const addSignal = useCallback(async (signalData: Omit<Signal, 'id' | 'createdAt' | 'createdBy'>) => {
    if (user?.role !== 'admin' || !user.uid) {
      toast({ variant: 'destructive', title: 'Permission Denied' });
      return;
    }
    await addDoc(collection(db, 'signals'), {
      ...signalData,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    toast({ title: 'Signal Created' });
  }, [user, db, toast]);

  const updateSignal = useCallback(async (signalData: Omit<Signal, 'createdAt' | 'createdBy'>) => {
    if (user?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied' });
      return;
    }
    const { id, ...data } = signalData;
    await updateDoc(doc(db, 'signals', id), data);
    toast({ title: 'Signal Updated' });
  }, [user, db, toast]);

  const deleteSignal = useCallback(async (signalId: string) => {
    if (user?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied' });
      return;
    }
    await deleteDoc(doc(db, 'signals', signalId));
    toast({ title: 'Signal Deleted' });
  }, [user, db, toast]);

  const value: AuthContextType = {
    user,
    firebaseUser,
    signals,
    allUsers,
    payments,
    loading,
    logout,
    addSignal,
    updateSignal,
    deleteSignal,
    getAuth: getAuthInstance,
    getDb: getDbInstance,
    getFunctions: getFunctionsInstance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
