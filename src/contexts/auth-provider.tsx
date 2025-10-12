
'use client';

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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
} from 'firebase/firestore';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { User, Signal, Payment } from '@/lib/types';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

// --- TYPES ---
interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signals: Signal[];
  allUsers: User[]; // For admin
  payments: Payment[]; // For admin
  loading: boolean;
  logout: () => void;
  addSignal: (signal: Omit<Signal, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateSignal: (signal: Omit<Signal, 'createdAt' | 'createdBy'>) => Promise<void>;
  deleteSignal: (signalId: string) => Promise<void>;
  auth: Auth;
  db: Firestore;
}

// --- CONTEXT ---
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- HOOK ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- PROVIDER ---
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

  const isPro = user?.proExpires ? user.proExpires.toMillis() > Date.now() : false;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUser({ uid: snap.id, ...snap.data() } as User);
          } else {
            // This case should be handled by the user creation cloud function
            console.warn("User document not found for authenticated user.");
            setUser(null);
          }
          setLoading(false);
        });
        return () => unsubscribeDoc();
      } else {
        setFirebaseUser(null);
        setUser(null);
        setSignals([]);
        setAllUsers([]);
        setPayments([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Handle redirection logic
    const isAdminRoute = pathname.startsWith('/admin');
    if (user) {
      if (user.role === 'admin' && !isAdminRoute) {
        router.replace('/admin');
      } else if (user.role !== 'admin' && isAdminRoute) {
        router.replace('/dashboard');
      } else if (publicRoutes.includes(pathname)) {
        router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } else {
      if (protectedRoutes.some(route => pathname.startsWith(route))) {
        router.replace('/login');
      }
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    if (!user) {
      // For logged-out users, only fetch free signals
      const freeSignalsQuery = query(
        collection(db, 'signals'),
        where('isPremium', '==', false),
        orderBy('createdAt', 'desc'),
        limit(2)
      );
      const unsubscribe = onSnapshot(freeSignalsQuery, (snapshot) => {
        const signalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
        setSignals(signalsData);
      });
      return () => unsubscribe();
    }

    // For logged-in users
    let unsubscribeSignals: () => void;
    if (user.role === 'admin' || isPro) {
      // Admins and Pro users get all signals
      const allSignalsQuery = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
      unsubscribeSignals = onSnapshot(allSignalsQuery, snapshot => {
        const signalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
        setSignals(signalsData);
      });
    } else {
      // Free users get today's 2 free signals
       const today = new Date();
       today.setHours(0, 0, 0, 0);
       const freeSignalsQuery = query(
         collection(db, 'signals'),
         where('isPremium', '==', false),
         where('createdAt', '>=', Timestamp.fromDate(today)),
         orderBy('createdAt', 'desc'),
         limit(2)
       );
       unsubscribeSignals = onSnapshot(freeSignalsQuery, snapshot => {
         const signalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
         setSignals(signalsData);
       });
    }

    let unsubscribeUsers: () => void = () => {};
    let unsubscribePayments: () => void = () => {};
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

    return () => {
      unsubscribeSignals();
      unsubscribeUsers();
      unsubscribePayments();
    };
  }, [user, isPro]);


  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: 'Logged Out' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: error.message });
    }
  }, [router, toast]);

  const addSignal = useCallback(async (signalData: Omit<Signal, 'id' | 'createdAt' | 'createdBy'>) => {
    if (user?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied' });
      return;
    }
    await addDoc(collection(db, 'signals'), {
      ...signalData,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    toast({ title: 'Signal Created' });
  }, [user, toast]);

  const updateSignal = useCallback(async (signalData: Omit<Signal, 'createdAt' | 'createdBy'>) => {
    if (user?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied' });
      return;
    }
    const { id, ...data } = signalData;
    await updateDoc(doc(db, 'signals', id), data);
    toast({ title: 'Signal Updated' });
  }, [user, toast]);

  const deleteSignal = useCallback(async (signalId: string) => {
    if (user?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied' });
      return;
    }
    await deleteDoc(doc(db, 'signals', signalId));
    toast({ title: 'Signal Deleted' });
  }, [user, toast]);

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
    auth,
    db,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
