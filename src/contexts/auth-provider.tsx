'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import type { User, Signal, Payment } from '@/lib/types';
import { useRouter } from 'next/navigation';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signals: Signal[];
  allUsers: User[];
  payments: Payment[];
  loading: boolean;
  signup: (email: string, password: string) => Promise<FirebaseUser>;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  addSignal: (signal: Omit<Signal, 'id' | 'createdBy' | 'createdAt'>) => Promise<void>;
  updateSignal: (id: string, signal: Partial<Signal>) => Promise<void>;
  deleteSignal: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          setUser(userData);
        } else {
          // This case might happen if the Firestore doc creation fails after signup
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeSignals: () => void;

    setLoading(true);
    // Base query for signals ordered by creation date
    const signalsQuery = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));

    if (user) {
      if (user.role === 'admin' || user.role === 'pro') {
        // Admin and Pro users get all signals
        unsubscribeSignals = onSnapshot(signalsQuery, (snapshot) => {
          const allSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
          setSignals(allSignals);
          setLoading(false);
        });
      } else {
        // Free users get the 2 latest free signals
        const freeSignalsQuery = query(collection(db, 'signals'), where('type', '==', 'free'), orderBy('createdAt', 'desc'), limit(2));
         unsubscribeSignals = onSnapshot(freeSignalsQuery, (snapshot) => {
          const freeSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
          setSignals(freeSignals);
          setLoading(false);
        });
      }
    } else {
      // Guests get the 2 latest free signals
      const guestSignalsQuery = query(collection(db, 'signals'), where('type', '==', 'free'), orderBy('createdAt', 'desc'), limit(2));
      unsubscribeSignals = onSnapshot(guestSignalsQuery, (snapshot) => {
        const guestSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
        setSignals(guestSignals);
        setLoading(false);
      });
    }

    // Fetch extra data for admin
    let unsubscribeUsers: () => void;
    let unsubscribePayments: () => void;
    if (user?.role === 'admin') {
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data() as User);
        setAllUsers(users);
      });
       unsubscribePayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
        const payments = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Payment);
        setPayments(payments);
      });
    }


    return () => {
      if (unsubscribeSignals) unsubscribeSignals();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribePayments) unsubscribePayments();
    };
  }, [user]);

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Firestore doc and role are set by the onUserCreate cloud function
    return userCredential.user;
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    router.push('/');
  };

  const addSignal = async (signal: Omit<Signal, 'id' | 'createdBy' | 'createdAt'>) => {
    if (user?.role !== 'admin') throw new Error('Permission denied');
    await addDoc(collection(db, 'signals'), {
      ...signal,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateSignal = async (id: string, signal: Partial<Signal>) => {
    if (user?.role !== 'admin') throw new Error('Permission denied');
    const signalDocRef = doc(db, 'signals', id);
    await updateDoc(signalDocRef, signal);
  };
  
  const deleteSignal = async (id: string) => {
    if (user?.role !== 'admin') throw new Error('Permission denied');
    const signalDocRef = doc(db, 'signals', id);
    await deleteDoc(signalDocRef);
  };

  const value = {
    user,
    firebaseUser,
    signals,
    allUsers,
    payments,
    loading,
    signup,
    login,
    logout,
    addSignal,
    updateSignal,
    deleteSignal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
