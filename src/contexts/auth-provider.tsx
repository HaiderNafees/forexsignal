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
  setDoc,
  getDoc,
  Unsubscribe,
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
    let unsubscribeUser: Unsubscribe | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: docSnap.id, ...docSnap.data() } as User);
          } else {
             // This case might happen if the user document hasn't been created yet.
             setUser(null);
          }
          setLoading(false);
        }, (error) => {
           console.error("Error fetching user profile:", error);
           setUser(null);
           setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  useEffect(() => {
    if (loading) return; // Wait for auth loading to finish

    let unsubscribeSignals: Unsubscribe | undefined;
    let unsubscribeUsers: Unsubscribe | undefined;
    let unsubscribePayments: Unsubscribe | undefined;

    if (user) {
        setSignalsLoading(true);
        setAdminLoading(true);

        const signalsQuery = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
        unsubscribeSignals = onSnapshot(signalsQuery, (snapshot) => {
            const fetchedSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
            setSignals(fetchedSignals);
            setSignalsLoading(false);
        }, (error) => {
            console.error("Error fetching signals:", error);
            setSignalsLoading(false);
        });

        if (user.role === 'admin') {
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
                setAllUsers(snapshot.docs.map(doc => doc.data() as User));
            }, (error) => console.error("Error fetching users:", error));

            const paymentsQuery = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
            unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
                setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
                setAdminLoading(false);
            }, (error) => {
                console.error("Error fetching payments:", error)
                setAdminLoading(false);
            });
        } else {
            setAdminLoading(false);
        }
    } else {
        // No user, clear all data and set loading to false
        setSignals([]);
        setAllUsers([]);
        setPayments([]);
        setSignalsLoading(false);
        setAdminLoading(false);
    }
    
    return () => {
        unsubscribeSignals && unsubscribeSignals();
        unsubscribeUsers && unsubscribeUsers();
        unsubscribePayments && unsubscribePayments();
    };

  }, [user, loading]);

  const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email: string, password: string): Promise<FirebaseUser> => {
    return signInWithEmailAndPassword(auth, email, password).then(
      (userCredential) => userCredential.user
    );
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
