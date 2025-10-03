
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { User, Signal } from '@/lib/types';
import { SIGNALS as placeholderSignals } from '@/lib/placeholder-data';
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

// Your web app's Firebase configuration - A stable, pre-configured project
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

if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

async function seedInitialData() {
    if (typeof window === 'undefined' || (window as any).hasSeeded) return;

    try {
        console.log("Checking for initial data seed...");
        
        try {
            await createUserWithEmailAndPassword(auth, 'admin@forexsignal.com', 'Admin798956!!');
            console.log("Admin user created in Firebase Auth.");
        } catch (error: any) {
            if (error.code !== 'auth/email-already-in-use') {
                 console.error("Error creating admin user:", error);
            } else {
                console.log("Admin user already exists in Firebase Auth.");
            }
        }

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

        (window as any).hasSeeded = true;
        console.log("Seeding check complete.");

    } catch (error: any) {
        if((error as any).code === 'auth/configuration-not-found') {
            console.warn("Auth configuration not found. This might be expected in some environments. Skipping admin creation.");
        } else {
            console.error("Error during initial data seed:", error);
        }
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

    useEffect(() => {
        seedInitialData();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setLoading(true);
            setFirebaseUser(fbUser);
            if (fbUser) {
                const userRef = doc(db, 'users', fbUser.uid);
                try {
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = { uid: userSnap.id, ...userSnap.data() } as User;
                        setUser(userData);
                    } else {
                         // This case can happen if the user record is not yet created during signup
                         setUser(null);
                    }
                } catch(e: any) {
                     if (e.code === 'permission-denied') {
                        const permissionError = new FirestorePermissionError({
                            path: userRef.path,
                            operation: 'get',
                        } satisfies SecurityRuleContext);
                        errorEmitter.emit('permission-error', permissionError);
                    } else {
                        console.error("Error fetching user document", e);
                        if ((e as any).code === 'unavailable') {
                            toast({ variant: 'destructive', title: 'Connection Error', description: 'Could not connect to the database. Please check your internet connection.' });
                        }
                    }
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    // Real-time listeners for signals and users (conditionally)
    useEffect(() => {
        if (!user || !db) {
            setSignals([]);
            setUsers([]);
            return;
        };
        
        // Only authenticated users should attempt to read signals
        const signalsQuery = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
        const unsubscribeSignals = onSnapshot(signalsQuery, 
            (snapshot) => {
                const signalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
                setSignals(signalsData);
            }, 
            async (error) => {
                if (error.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: collection(db, 'signals').path,
                        operation: 'list',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                } else {
                   toast({ variant: 'destructive', title: 'Error', description: 'Could not load signals.' });
                }
            }
        );

        // Only admin users can read the full user list
        let unsubscribeUsers = () => {};
        if (user.role === 'admin') {
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            unsubscribeUsers = onSnapshot(usersQuery, 
                (snapshot) => {
                    const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
                    setUsers(usersData);
                }, 
                async (error) => {
                    if (error.code === 'permission-denied') {
                        const permissionError = new FirestorePermissionError({
                            path: collection(db, 'users').path,
                            operation: 'list',
                        } satisfies SecurityRuleContext);
                        errorEmitter.emit('permission-error', permissionError);
                    } else {
                        toast({ variant: 'destructive', title: 'Error', description: 'Could not load user data.' });
                    }
                }
            );
        } else {
            setUsers([]); 
        }

        return () => {
            unsubscribeSignals();
            unsubscribeUsers();
        };
    }, [user, toast]);

  const logout = useCallback(async () => {
    try {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/login');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Logout Failed', description: 'An error occurred during logout.' });
    }
  }, [router, toast]);

  const updateUserRole = useCallback(async (userId: string, role: 'free' | 'pro' | 'admin') => {
    const userRef = doc(db, 'users', userId);
    const roleData = { role };
    updateDoc(userRef, roleData)
        .then(() => {
            toast({
                title: 'User Role Updated',
                description: `User role has been successfully changed to ${role}.`,
            });
        })
        .catch(async (serverError) => {
            if(serverError.code === 'permission-denied'){
                 const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: roleData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({ variant: 'destructive', title: "Update Failed", description: 'Could not update user role.' });
            }
        });
  }, [toast]);

  const deleteUser = useCallback(async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    deleteDoc(userRef)
        .then(() => {
            toast({
                variant: 'destructive',
                title: 'User Record Removed',
                description: 'The user record from Firestore has been removed.',
            });
        })
        .catch(async (serverError) => {
            if(serverError.code === 'permission-denied'){
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'delete',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            } else {
                 toast({ variant: 'destructive', title: "Delete Failed", description: 'Could not delete user record.' });
            }
        });
  }, [toast]);

  const addSignal = useCallback(async (signalData: Omit<Signal, 'id' | 'createdAt'>) => {
    const signalsCollection = collection(db, 'signals');
    const newSignalData = { ...signalData, createdAt: serverTimestamp() };
    addDoc(signalsCollection, newSignalData)
        .then(() => {
            toast({ title: "Signal Created", description: "The new signal has been added successfully." });
        })
        .catch(async (serverError) => {
             if(serverError.code === 'permission-denied'){
                const permissionError = new FirestorePermissionError({
                    path: signalsCollection.path,
                    operation: 'create',
                    requestResourceData: newSignalData
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({ variant: 'destructive', title: "Creation Failed", description: "Could not create the new signal." });
            }
        });
  }, [toast]);


  const updateSignal = useCallback(async (signal: Signal) => {
    const { id, ...signalData } = signal;
    const signalRef = doc(db, 'signals', id);
    updateDoc(signalRef, { ...signalData })
        .then(() => {
            toast({ title: "Signal Updated", description: "The signal has been updated successfully." });
        })
        .catch(async (serverError) => {
            if(serverError.code === 'permission-denied'){
                const permissionError = new FirestorePermissionError({
                    path: signalRef.path,
                    operation: 'update',
                    requestResourceData: signalData
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({ variant: 'destructive', title: "Update Failed", description: "Could not update the signal." });
            }
        });
  }, [toast]);
  
  const deleteSignal = useCallback(async (signalId: string) => {
    const signalRef = doc(db, 'signals', signalId);
    deleteDoc(signalRef)
        .then(() => {
            toast({
                variant: "destructive",
                title: "Signal Deleted",
                description: "The signal has been removed."
            });
        })
        .catch(async (serverError) => {
            if(serverError.code === 'permission-denied'){
                const permissionError = new FirestorePermissionError({
                    path: signalRef.path,
                    operation: 'delete',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            } else {
                 toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete the signal." });
            }
        });
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
