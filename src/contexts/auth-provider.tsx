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
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  limit
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, Signal, Payment } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signals: Signal[];
  allUsers: User[];
  payments: Payment[];
  loading: boolean;
  signalsLoading: boolean;
  adminLoading: boolean;
  signup: (email: string, password: string) => Promise<any>;
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
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);
  const pathname = usePathname();


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        
        const unsubscribeUser = onSnapshot(userDocRef, (userDocSnap) => {
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as User;
                setUser(userData);
            } else {
                setUser(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user document:", error);
            setUser(null);
            setLoading(false);
        });

        return () => unsubscribeUser();

      } else {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);


  // Listener for signals data
  useEffect(() => {
    setSignalsLoading(true);
    let q;

    if (user && (user.role === 'admin' || user.role === 'pro')) {
      // Admin and Pro users get all signals
      q = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
    } else {
      // Guests and Free users get only free signals
      q = query(collection(db, 'signals'), where('type', '==', 'free'), orderBy('createdAt', 'desc'));
    }
    
    const unsubscribeSignals = onSnapshot(q, (snapshot) => {
      let fetchedSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
      setSignals(fetchedSignals);
      setSignalsLoading(false);
    }, (error) => {
        console.error("Error fetching signals:", error);
        setSignals([]);
        setSignalsLoading(false);
    });

    return () => unsubscribeSignals();
  }, [user, loading]); // Depend on user and loading state


  // Listeners for admin-specific data
  useEffect(() => {
    if (user?.role !== 'admin') {
      setAllUsers([]);
      setPayments([]);
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => doc.data() as User));
       setAdminLoading(false);
    }, () => setAdminLoading(false));

    const paymentsQuery = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
       setAdminLoading(false);
    }, () => setAdminLoading(false));

    return () => {
      unsubscribeUsers();
      unsubscribePayments();
    };
  }, [user?.role]);


  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Note: The user document in Firestore is created by the `onUserCreate` Cloud Function.
    return userCredential;
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
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
    signalsLoading,
    adminLoading,
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
