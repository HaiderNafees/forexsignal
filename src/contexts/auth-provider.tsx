
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User, Signal } from '@/lib/types';
import { USERS as placeholderUsers, SIGNALS as placeholderSignals } from '@/lib/placeholder-data';


type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  users: User[];
  signals: Signal[];
  loading: boolean;
  logout: () => void;
  updateUserRole: (userId: string, role: 'free' | 'pro' | 'admin') => void;
  deleteUser: (userId: string) => void;
  addSignal: (signal: Omit<Signal, 'id' | 'createdAt'>) => Promise<void>;
  updateSignal: (signal: Signal) => Promise<void>;
  deleteSignal: (signalId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function seedInitialData() {
    // Seed Users
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    if (usersSnapshot.empty) {
        console.log("Seeding initial users...");
        for (const user of placeholderUsers) {
            await setDoc(doc(db, 'users', user.uid), user);
        }
    }

    // Seed Signals
    const signalsCollection = collection(db, 'signals');
    const signalsSnapshot = await getDocs(signalsCollection);
    if (signalsSnapshot.empty) {
        console.log("Seeding initial signals...");
        for (const signal of placeholderSignals) {
            await setDoc(doc(db, 'signals', signal.id), signal);
        }
    }
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsersAndSignals = async () => {
        try {
            // Seed data if collections are empty
            await seedInitialData();

            // Fetch users
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const usersList = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
            setUsers(usersList);

            // Fetch signals
            const signalsCollection = collection(db, 'signals');
            const signalsSnapshot = await getDocs(signalsCollection);
            const signalsList = signalsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Signal));
             // sort by createdAt descending
            signalsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSignals(signalsList);
        } catch (error) {
            console.error("Error fetching initial data:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not load platform data."})
        }
    };

    fetchUsersAndSignals();
  }, [toast]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUser({ uid: docSnap.id, ...docSnap.data() } as User);
        } else {
          // Can happen if Firestore doc is deleted but user still authenticated
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    try {
        await auth.signOut();
        setUser(null);
        setFirebaseUser(null);
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/login');
    } catch (error) {
        console.error("Logout failed:", error);
        toast({ variant: 'destructive', title: 'Logout Failed', description: 'An error occurred during logout.' });
    }
  }, [router, toast]);

  const updateUserRole = useCallback(async (userId: string, role: 'free' | 'pro' | 'admin') => {
    const userRef = doc(db, 'users', userId);
    try {
        await updateDoc(userRef, { role });
        setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role } : u));
        toast({
            title: 'User Role Updated',
            description: `User role has been successfully changed to ${role}.`,
        });
    } catch (error) {
        console.error("Failed to update role:", error);
        toast({ variant: 'destructive', title: "Update Failed" });
    }
  }, [toast]);

  const deleteUser = useCallback(async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    try {
        await deleteDoc(userRef);
        // Note: This doesn't delete the Firebase Auth user, only the Firestore record.
        // For a full implementation, you'd need a Cloud Function to delete the auth user.
        setUsers(prev => prev.filter(u => u.uid !== userId));
        toast({
          variant: 'destructive',
          title: 'User Removed',
          description: 'The user record has been successfully removed.',
        });
    } catch (error) {
        console.error("Failed to delete user:", error);
        toast({ variant: 'destructive', title: "Delete Failed" });
    }
  }, [toast]);

  const addSignal = useCallback(async (signalData: Omit<Signal, 'id' | 'createdAt'>) => {
    try {
        const newSignal = {
            ...signalData,
            createdAt: new Date().toISOString(),
        };
        const signalsCollection = collection(db, 'signals');
        // Firestore will generate an ID
        const docRef = await setDoc(doc(signalsCollection, `sig_${Date.now()}`), newSignal);
        setSignals(prev => [{...newSignal, id: docRef.id}, ...prev]);
        toast({ title: "Signal Created" });
    } catch (error) {
        console.error("Failed to add signal:", error);
        toast({ variant: 'destructive', title: "Creation Failed" });
    }
  }, [toast]);


  const updateSignal = useCallback(async (signal: Signal) => {
    const signalRef = doc(db, 'signals', signal.id);
    try {
        await updateDoc(signalRef, { ...signal });
        setSignals(prev => prev.map(s => s.id === signal.id ? signal : s));
        toast({ title: "Signal Updated" });
    } catch (error) {
        console.error("Failed to update signal:", error);
        toast({ variant: 'destructive', title: "Update Failed" });
    }
  }, [toast]);
  
  const deleteSignal = useCallback(async (signalId: string) => {
    const signalRef = doc(db, 'signals', signalId);
    try {
        await deleteDoc(signalRef);
        setSignals(prev => prev.filter(s => s.id !== signalId));
        toast({
            variant: "destructive",
            title: "Signal Deleted",
        });
    } catch (error) {
        console.error("Failed to delete signal:", error);
        toast({ variant: 'destructive', title: "Delete Failed" });
    }
  }, [toast]);

  const contextValue = {
    user,
    firebaseUser,
    users,
    signals,
    loading,
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
