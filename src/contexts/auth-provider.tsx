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
const publicRoutes = ['/login', '/signup'];

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
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
           const userData = { uid: userDoc.id, ...userDoc.data() } as User;
           setUser(userData);
           // Handle redirection right after setting user
           const isAdminRoute = pathname.startsWith('/admin');
           if (userData.role === 'admin' && !isAdminRoute) {
             router.replace('/admin');
           } else if (userData.role !== 'admin' && isAdminRoute) {
             router.replace('/dashboard');
           } else if (publicRoutes.includes(pathname)) {
             router.replace(userData.role === 'admin' ? '/admin' : '/dashboard');
           }
        } else {
             // This can happen if the user is deleted from Firestore but not from Auth.
             // Log them out to clear state.
             await signOut(auth);
             setUser(null);
             setFirebaseUser(null);
             if (protectedRoutes.some(route => pathname.startsWith(route))) {
               router.replace('/login');
             }
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
    // Only run listeners when auth state is resolved
    if (loading) return;

    let unsubscribeSignals: () => void = () => {};
    let unsubscribeUsers: () => void = () => {};
    let unsubscribePayments: () => void = () => {};

    if (user) { // User is logged in
      const isPro = user.proExpires ? user.proExpires.toMillis() > Date.now() : false;

      let signalsQuery;
      if (user.role === 'admin' || isPro) {
        // Admins and Pro users get all signals
        signalsQuery = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
      } else {
        // Free users get up to 2 free signals
        signalsQuery = query(
          collection(db, 'signals'),
          where('isPremium', '==', false)
          // orderBy and limit are removed to prevent needing a composite index.
          // We will sort and limit on the client.
        );
      }
      
      unsubscribeSignals = onSnapshot(signalsQuery, snapshot => {
        let fetchedSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
        
        if (user.role !== 'admin' && !isPro) {
           // Sort by date and take the latest 2 on the client
            fetchedSignals.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            fetchedSignals = fetchedSignals.slice(0, 2);
        }

        setSignals(fetchedSignals);
      }, (error) => {
        console.error("Signal fetch error:", error);
        toast({ variant: 'destructive', title: 'Error fetching signals', description: error.message });
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
    } else { // User is not logged in (guest)
      const guestQuery = query(
        collection(db, 'signals'),
        where('isPremium', '==', false)
        // orderBy and limit are removed to prevent needing a composite index.
      );
      unsubscribeSignals = onSnapshot(guestQuery, (snapshot) => {
        let fetchedSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
        // Sort by date and take the latest 2 on the client
        fetchedSignals.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setSignals(fetchedSignals.slice(0, 2));
      }, (error) => {
        console.error("Guest signal fetch error:", error);
        // Don't show toast for guests
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
