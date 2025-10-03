
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { User, Signal } from '@/lib/types';
import { SIGNALS as placeholderSignals, USERS as placeholderUsers } from '@/lib/placeholder-data';
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCMNEY5IcP7nGwKW7nt98AfTze1d62F8SE",
    authDomain: "forexsignal-371b3.firebaseapp.com",
    projectId: "forexsignal-371b3",
    storageBucket: "forexsignal-371b3.appspot.com",
    messagingSenderId: "617111923339",
    appId: "1:617111923339:web:063a079794acf64a3e028e"
};

// Singleton pattern for Firebase instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} else if (typeof window !== 'undefined') {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
}


async function seedInitialData() {
    try {
        // This check is to prevent seeding every time on hot-reload in dev
        if ((window as any).hasSeeded) return;

        console.log("Checking for initial data seed...");

        const adminUserRef = doc(db, 'users', 'admin001');
        const adminUserSnap = await getDoc(adminUserRef);

        if (!adminUserSnap.exists()) {
            console.log("Seeding admin user and initial signals...");
            const adminData = placeholderUsers.find(u => u.role === 'admin');
            if (adminData) {
                // In a real app, you'd have a secure script to create the auth user.
                // For this project, we assume the auth user is created manually or via a separate script.
                // We are only seeding the Firestore document.
                await setDoc(adminUserRef, {
                  uid: adminData.uid,
                  email: adminData.email,
                  role: adminData.role,
                  createdAt: serverTimestamp(),
                });
                console.log("IMPORTANT: Ensure admin user 'admin@forexsignal.com' with password 'Admin798956!!' exists in Firebase Authentication.");
            }
        }
        
        // Check if signals collection is empty by trying to get one doc
        const firstSignalRef = doc(db, 'signals', 'sig001');
        const firstSignalSnap = await getDoc(firstSignalRef);

        if (!firstSignalSnap.exists()) {
            console.log("Seeding initial signals...");
            const signalPromises = placeholderSignals.map(signal => {
                const { id, ...signalData } = signal;
                return setDoc(doc(db, 'signals', id), { ...signalData, createdAt: serverTimestamp() });
            });
            await Promise.all(signalPromises);
        }

        (window as any).hasSeeded = true; // Mark as seeded
        console.log("Seeding check complete.");

    } catch (error) {
        console.error("Error during initial data seed:", error);
    }
}


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
  auth: Auth;
  db: Firestore;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

    // Seed data on initial client-side load
    useEffect(() => {
        seedInitialData();
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                const userRef = doc(db, 'users', fbUser.uid);
                try {
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setUser({ uid: userSnap.id, ...userSnap.data() } as User);
                    } else {
                        // This can happen if the user exists in Auth but not in Firestore.
                        // For this app, we'll log them out to force a clean signup.
                        console.warn("User record not found in Firestore. Forcing logout.");
                        await signOut(auth);
                        setUser(null); 
                    }
                } catch(e) {
                    console.error("Error fetching user document", e);
                    // Handle offline error gracefully
                     if ((e as any).code === 'unavailable') {
                        toast({ variant: 'destructive', title: 'Connection Error', description: 'Could not connect to the database. Please check your internet connection.' });
                    }
                }

            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    // Real-time listeners for signals and users
    useEffect(() => {
        const signalsQuery = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
        const unsubscribeSignals = onSnapshot(signalsQuery, (snapshot) => {
            const signalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
            setSignals(signalsData);
        }, (error) => {
            console.error("Error fetching signals:", error);
            // Don't toast on every error, could be noisy (e.g., permissions)
        });
        
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setUsers(usersData);
        }, (error) => {
            console.error("Error fetching users:", error);
        });

        return () => {
            unsubscribeSignals();
            unsubscribeUsers();
        };
    }, []);

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
        toast({ variant: 'destructive', title: "Update Failed", description: 'Could not update user role.' });
    }
  }, [toast]);

  const deleteUser = useCallback(async (userId: string) => {
    // In a real app, this would require an admin function to delete the Auth user.
    // Here we just delete the Firestore record.
    const userRef = doc(db, 'users', userId);
    try {
        await deleteDoc(userRef);
        toast({
          variant: 'destructive',
          title: 'User Record Removed',
          description: 'The user record from Firestore has been removed.',
        });
    } catch (error) {
        console.error("Failed to delete user:", error);
        toast({ variant: 'destructive', title: "Delete Failed", description: 'Could not delete user record.' });
    }
  }, [toast]);

  const addSignal = useCallback(async (signalData: Omit<Signal, 'id' | 'createdAt'>) => {
    try {
        const signalsCollection = collection(db, 'signals');
        await addDoc(signalsCollection, { ...signalData, createdAt: serverTimestamp() });
        toast({ title: "Signal Created", description: "The new signal has been added successfully." });
    } catch (error) {
        console.error("Failed to add signal:", error);
        toast({ variant: 'destructive', title: "Creation Failed", description: "Could not create the new signal." });
    }
  }, [toast]);


  const updateSignal = useCallback(async (signal: Signal) => {
    const { id, ...signalData } = signal;
    const signalRef = doc(db, 'signals', id);
    try {
        await updateDoc(signalRef, { ...signalData });
        toast({ title: "Signal Updated", description: "The signal has been updated successfully." });
    } catch (error) {
        console.error("Failed to update signal:", error);
        toast({ variant: 'destructive', title: "Update Failed", description: "Could not update the signal." });
    }
  }, [toast]);
  
  const deleteSignal = useCallback(async (signalId: string) => {
    const signalRef = doc(db, 'signals', signalId);
    try {
        await deleteDoc(signalRef);
        toast({
            variant: "destructive",
            title: "Signal Deleted",
            description: "The signal has been removed."
        });
    } catch (error) {
        console.error("Failed to delete signal:", error);
        toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete the signal." });
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
    auth,
    db,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

    