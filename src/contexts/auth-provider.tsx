
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
    orderBy,
    getDoc,
    getDocs,
    where
} from 'firebase/firestore';
import { USERS, SIGNALS } from '@/lib/placeholder-data';

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

// Function to seed initial data
async function seedInitialData() {
  if (!db || !auth) return;

  // Check if admin user exists
  const adminEmail = "admin@forexsignal.com";
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", adminEmail));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log("Admin user not found, seeding database...");
    
    // Seed admin user
    try {
      const adminUserCred = await createUserWithEmailAndPassword(auth, adminEmail, "Admin798956!!");
      const adminUserData: Omit<User, 'uid'> = {
        email: adminEmail,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', adminUserCred.user.uid), adminUserData);
      console.log("Admin user created successfully.");

      // You can also seed other users if you want, but for now, we just ensure admin exists.
      
      // Seed signals
      const signalsRef = collection(db, "signals");
      const signalsSnapshot = await getDocs(signalsRef);
      if (signalsSnapshot.empty) {
        console.log("Seeding signals...");
        for (const signal of SIGNALS) {
            const signalDocRef = doc(signalsRef, signal.id);
            await setDoc(signalDocRef, signal);
        }
        console.log("Signals seeded.");
      }

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists in Auth, skipping creation.');
      } else {
        console.error("Error seeding admin user:", error);
      }
    }
  } else {
    console.log("Admin user already exists. Skipping seeding.");
  }
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    
    seedInitialData();

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = { ...doc.data() as User, uid: doc.id };
            setUser(userData);
          } else {
            setUser(null); // User exists in Auth but not Firestore, log them out
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
    if (!db) return;
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ ...doc.data() as User, uid: doc.id }));
      setUsers(allUsers);
    }, (error) => {
        console.error("Error fetching users: ", error);
    });

    return () => unsubscribeUsers();
  }, []);

  useEffect(() => {
    if (!db) return;
    const signalsCollectionRef = collection(db, 'signals');
    const q = query(signalsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribeSignals = onSnapshot(q, (snapshot) => {
      const allSignals = snapshot.docs.map(doc => ({ ...doc.data() as Signal, id: doc.id }));
      setSignals(allSignals);
    }, (error) => {
        console.error("Error fetching signals: ", error);
    });

    return () => unsubscribeSignals();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    if (!auth || !db) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          toast({ title: 'Login Successful', description: 'Welcome back!' });
          const path = userData.role === 'admin' ? '/admin' : '/dashboard';
          router.push(path);
      } else {
          throw new Error("User data not found.");
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  const signup = useCallback(async (email: string, pass: string) => {
    if (!auth || !db) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      const newUser: Omit<User, 'uid'> = {
        email: firebaseUser.email!,
        role: 'free',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      toast({
        title: 'Account Created',
        description: 'You have been successfully signed up! Redirecting to dashboard...',
      });
      router.push('/dashboard');

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
    if (!auth) return;
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
    if (!db) return;
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
    if (!db) return;
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
    if (!db) return;
    const newDocRef = doc(collection(db, "signals"));
    const newSignal: Omit<Signal, 'id'> & { id: string, createdAt: string } = {
        id: newDocRef.id,
        ...signalData,
        createdAt: new Date().toISOString(),
    };
    try {
        await setDoc(newDocRef, newSignal);
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
    if (!db) return;
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
    if (!db) return;
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
      {children}
    </AuthContext.Provider>
  );
}
