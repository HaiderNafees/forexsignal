
'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, Signal, Payment } from '@/lib/types';

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
  updateSignal: (id: string, signal: Partial<Omit<Signal, 'id'>>) => Promise<void>;
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

  // Listener for Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listener for user profile data from Firestore
  useEffect(() => {
    if (!firebaseUser) return;

    setLoading(true);
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser(docSnap.data() as User);
      } else {
        setUser(null); // User exists in auth, but not in firestore
      }
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, [firebaseUser]);
  

  // Listener for signals data based on user role
  useEffect(() => {
    setLoading(true);
    let q;
    if (user && (user.role === 'admin' || user.role === 'pro')) {
      // Admins and Pro users get all signals
      q = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
    } else {
      // Guests and Free users get the latest 2 free signals
      q = query(collection(db, 'signals'), where('type', '==', 'free'), orderBy('createdAt', 'desc'), limit(2));
    }

    const unsubscribeSignals = onSnapshot(q, (snapshot) => {
      const fetchedSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
      setSignals(fetchedSignals);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching signals:", error);
        setSignals([]);
        setLoading(false);
    });

    return () => unsubscribeSignals();
  }, [user]);

  // Listeners for admin-specific data
  useEffect(() => {
    if (user?.role !== 'admin') {
      setAllUsers([]);
      setPayments([]);
      return;
    }

    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => doc.data() as User));
    });

    const paymentsQuery = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
    });

    return () => {
      unsubscribeUsers();
      unsubscribePayments();
    };
  }, [user?.role]);


  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Note: The user document in Firestore is created by the `onUserCreate` Cloud Function.
    return userCredential.user;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const addSignal = async (signal: Omit<Signal, 'id' | 'createdBy' | 'createdAt'>) => {
    if (user?.role !== 'admin' || !firebaseUser) throw new Error('Permission denied');
    await addDoc(collection(db, 'signals'), {
      ...signal,
      createdBy: firebaseUser.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateSignal = async (id: string, signal: Partial<Omit<Signal, 'id'>>) => {
    if (user?.role !== 'admin') throw new Error('Permission denied');
    await updateDoc(doc(db, 'signals', id), signal);
  };
  
  const deleteSignal = async (id: string) => {
    if (user?.role !== 'admin') throw new Error('Permission denied');
    await deleteDoc(doc(db, 'signals', id));
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
