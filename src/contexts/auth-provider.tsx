
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { User, Signal } from '@/lib/types';
import { SIGNALS as placeholderSignals, USERS as placeholderUsers } from '@/lib/placeholder-data';

type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  users: User[];
  signals: Signal[];
  loading: boolean;
  logout: () => void;
  updateUserRole: (userId: string, role: 'free' | 'pro' | 'admin') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addSignal: (signal: Omit<Signal, 'id' | 'createdAt'>) => Promise<void>;
  updateSignal: (signal: Signal) => Promise<void>;
  deleteSignal: (signalId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function seedInitialData() {
    try {
        const adminUserRef = doc(db, 'users', 'admin001');
        const adminUserSnap = await getDoc(adminUserRef);

        if (!adminUserSnap.exists()) {
            console.log("Seeding admin user...");
            try {
                // This is a placeholder for creating the auth user. 
                // In a real app, you would run a script or use the Firebase Admin SDK.
                // We'll just create the Firestore doc.
                await setDoc(adminUserRef, placeholderUsers.find(u => u.role === 'admin'));
                 console.log("IMPORTANT: Admin user 'admin@forexsignal.com' with password 'Admin798956!!' must be created in Firebase Authentication manually if not already present.");

            } catch (authError) {
                // If the user already exists in Auth but not Firestore, that's fine.
                if ((authError as any).code !== 'auth/email-already-in-use') {
                    console.error("Error creating admin auth user:", authError);
                }
            }
        }

        const signalsCollection = collection(db, 'signals');
        const signalsSnapshot = await getDoc(collection(db, 'signals'));
        if (signalsSnapshot.empty) {
            console.log("Seeding initial signals...");
            for (const signal of placeholderSignals) {
                await addDoc(signalsCollection, { ...signal, createdAt: serverTimestamp() });
            }
        }
    } catch (error) {
        console.error("Error during initial data seed:", error);
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

    // Seed data on initial load
    useEffect(() => {
        seedInitialData();
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                const userRef = doc(db, 'users', fbUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUser({ uid: userSnap.id, ...userSnap.data() } as User);
                } else {
                    // This can happen if the Firestore user doc isn't created yet
                    setUser(null); 
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Real-time listeners for signals and users
    useEffect(() => {
        const signalsQuery = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
        const unsubscribeSignals = onSnapshot(signalsQuery, (snapshot) => {
            const signalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
            setSignals(signalsData);
        }, (error) => {
            console.error("Error fetching signals:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not load signals." });
        });
        
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setUsers(usersData);
        }, (error) => {
            console.error("Error fetching users:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not load users." });
        });

        return () => {
            unsubscribeSignals();
            unsubscribeUsers();
        };
    }, [toast]);

  const logout = useCallback(async () => {
    try {
        await signOut(auth);
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
        const signalsCollection = collection(db, 'signals');
        await addDoc(signalsCollection, { ...signalData, createdAt: serverTimestamp() });
        toast({ title: "Signal Created" });
    } catch (error) {
        console.error("Failed to add signal:", error);
        toast({ variant: 'destructive', title: "Creation Failed" });
    }
  }, [toast]);


  const updateSignal = useCallback(async (signal: Signal) => {
    const { id, ...signalData } = signal;
    const signalRef = doc(db, 'signals', id);
    try {
        await updateDoc(signalRef, signalData);
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
