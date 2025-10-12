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
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, Signal, Payment } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  signals: Signal[];
  allUsers: User[];
  payments: Payment[];
  loading: boolean;
  signalsLoading: boolean;
  adminLoading: boolean;
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
  const [signals, setSignals] = useState<Signal[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: docSnap.id, ...docSnap.data() } as User);
          } else {
            // This case can happen if the Firestore doc isn't created yet or was deleted.
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
        setSignals([]);
        setAllUsers([]);
        setPayments([]);
        setLoading(false);
        setSignalsLoading(false);
        setAdminLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
        setSignals([]);
        setSignalsLoading(false);
        return;
    }

    setSignalsLoading(true);
    // A single, simple query for all signals, ordered by creation time.
    const signalsQuery = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
    
    const unsubscribeSignals = onSnapshot(signalsQuery, (snapshot) => {
      const fetchedSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
      
      // Apply filtering on the client-side based on the user's role.
      if (user.role === 'admin' || user.role === 'pro') {
        setSignals(fetchedSignals);
      } else {
        // Free users see only the latest 2 free signals.
        const freeSignals = fetchedSignals.filter(s => s.type === 'free').slice(0, 2);
        setSignals(freeSignals);
      }
      setSignalsLoading(false);
    }, (error) => {
        console.error("Error fetching signals:", error);
        setSignals([]);
        setSignalsLoading(false);
    });

    return () => unsubscribeSignals();
  }, [user]);

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
      setAdminLoading(false); // Set loading to false once users are fetched
    }, (error) => {
      console.error("Error fetching users:", error);
       setAdminLoading(false);
    });

    const paymentsQuery = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
    }, (error) => {
       console.error("Error fetching payments:", error);
    });

    return () => {
      unsubscribeUsers();
      unsubscribePayments();
    };
  }, [user]);

  const signup = async (email: string, password: string): Promise<FirebaseUser> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // The onUserCreate cloud function will handle role assignment.
    return userCredential.user;
  };

  const login = async (email: string, password: string): Promise<FirebaseUser> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const logout = () => {
    return signOut(auth);
  };

  const addSignal = async (signal: Omit<Signal, 'id' | 'createdBy' | 'createdAt'>) => {
    if (user?.role !== 'admin') throw new Error('Permission denied');
    await addDoc(collection(db, 'signals'), {
      ...signal,
      createdBy: user.uid,
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
