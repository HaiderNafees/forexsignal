
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
import { getFirestore, type Firestore, CACHE_SIZE_UNLIMITED, memoryLocalCache } from "firebase/firestore";
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
let functions: Functions;

if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app, {
      localCache: memoryLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }),
  });
  functions = getFunctions(app);
}

async function seedInitialData() {
    if (typeof window === 'undefined' || (window as any).hasSeeded) return;

    try {
        console.log("Checking for initial data seed...");
        
        try {
            await createUserWithEmailAndPassword(auth, 'forexsignaldmn@gmail.com', 'Admin798956!!');
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
                const signalRef = doc(db, 'signals', id);
                return setDoc(signalRef, { ...signalData, createdAt: serverTimestamp() }).catch(serverError => {
                    // Non-blocking, best-effort seeding.
                    console.warn(`Could not seed signal ${id}:`, serverError.message);
                });
            });
            await Promise.all(signalPromises);
        }

        (window as any).hasSeeded = true;
        console.log("Seeding check complete.");

    } catch (error: any) {
        if((error as any).code === 'auth/configuration-not-found' || (error as any).code === 'unavailable') {
            console.warn("Auth configuration not found or service unavailable. This might be expected in some environments. Skipping admin creation.");
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
            setFirebaseUser(fbUser);
            if (fbUser) {
                const userRef = doc(db, 'users', fbUser.uid);
                onSnapshot(userRef, (userSnap) => {
                    if (userSnap.exists()) {
                        const userData = { uid: userSnap.id, ...userSnap.data() } as User;
                        setUser(userData);
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                }, async (error) => {
                    if (error.code === 'permission-denied') {
                        const permissionError = new FirestorePermissionError({
                            path: userRef.path,
                            operation: 'get',
                        });
                        errorEmitter.emit('permission-error', permissionError);
                    } else if (error.code === 'unavailable') {
                        toast({
                            variant: 'destructive',
                            title: 'Connection Error',
                            description: 'Could not connect to the database. Please check your internet connection or Firestore rules.',
                        });
                    }
                     else {
                        console.error("User doc listener error:", error);
                    }
                    setUser(null);
                    setLoading(false);
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [toast]);

    useEffect(() => {
        if (!user || !db) {
            setSignals([]);
            setUsers([]);
            return;
        };
        
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
                    });
                    errorEmitter.emit('permission-error', permissionError);
                } else {
                   console.error("Signal listener error:", error);
                   toast({ variant: 'destructive', title: 'Error', description: 'Could not load signals.' });
                }
            }
        );

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
                        });
                        errorEmitter.emit('permission-error', permissionError);
                    } else {
                        console.error("User listener error:", error);
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
    try {
        const setUserRole = httpsCallable(functions, 'setUserRole');
        await setUserRole({ uid: userId, role: role });
        toast({
            title: 'User Role Updated',
            description: `User role has been successfully changed to ${role}.`,
        });
    } catch (error: any) {
        console.error("Error updating user role:", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not update user role via function.',
        });
    }
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
