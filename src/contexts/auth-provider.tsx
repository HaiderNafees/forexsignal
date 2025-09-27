
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
    signOut,
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
    where,
} from 'firebase/firestore';
import { SIGNALS } from '@/lib/placeholder-data';

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
  if (!auth || !db) return; // Guard against uninitialized Firebase

  const adminEmail = "admin@forexsignal.com";
  const adminPassword = "Admin798956!!";
  const usersRef = collection(db, "users");
  
  // Check if admin user exists in Firestore
  const q = query(usersRef, where("email", "==", adminEmail));
  const querySnapshot = await getDocs(q);

  let adminExists = !querySnapshot.empty;

  if (!adminExists) {
    console.log("Admin user not found, attempting to create...");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUserData: Omit<User, 'uid'> = {
        email: adminEmail,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), adminUserData);
      console.log("Admin user created successfully.");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin email already exists in Auth. This is expected if Firestore doc was missing.');
      } else {
        console.error("Error seeding admin user:", error);
      }
    }
  }

  // Seed signals if the collection is empty
  const signalsRef = collection(db, "signals");
  const signalsSnapshot = await getDocs(signalsRef);
  if (signalsSnapshot.empty) {
    console.log("Seeding signals...");
    const batch = SIGNALS.map(signal => {
        const signalDocRef = doc(signalsRef, signal.id);
        return setDoc(signalDocRef, signal);
    });
    await Promise.all(batch);
    console.log("Signals seeded.");
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
    // auth might not be initialized on first render.
    if (!auth || !db) {
        // If it's not initialized, it will be soon, and this effect will re-run.
        setLoading(false); // Set loading to false to show the page.
        return;
    }

    seedInitialData();

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUser({ uid: doc.id, ...doc.data() } as User);
          } else {
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

    const usersCollectionRef = collection(db, 'users');
    const qUsers = query(usersCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(allUsers);
    });

    const signalsCollectionRef = collection(db, 'signals');
    const qSignals = query(signalsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribeSignals = onSnapshot(qSignals, (snapshot) => {
      const allSignals = snapshot.docs.map(doc => ({ ...doc.data() as Signal, id: doc.id }));
      setSignals(allSignals);
    });

    return () => {
        unsubscribeAuth();
        unsubscribeUsers();
        unsubscribeSignals();
    };
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
          throw new Error("User data not found in database.");
      }
    } catch (error: any) {
        console.error("Login Error:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
      });
      setLoading(false);
    }
  }, [router, toast]);

  const signup = useCallback(async (email: string, pass:string) => {
    if (!auth || !db) return;
    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser: Omit<User, 'uid'> = {
            email: userCredential.user.email!,
            role: 'free',
            createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
        toast({
            title: 'Account Created',
            description: 'You have been successfully signed up! Redirecting to dashboard...',
        });
        // The onAuthStateChanged listener will handle setting the user and loading state, and redirect.
        router.push('/dashboard');
    } catch (error: any) {
         console.error("Signup Error:", error);
        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: error.message,
        });
        setLoading(false);
    }
  }, [router, toast]);
  
  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
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
    const newSignal: Signal = {
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
