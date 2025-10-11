
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { User, Signal } from '@/lib/types';
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern for Firebase instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;

if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
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

const protectedRoutes = ['/dashboard', '/admin'];
const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode; }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                const userRef = doc(db, 'users', fbUser.uid);
                try {
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = { uid: userSnap.id, ...userSnap.data() } as User;
                        setUser(userData);
                    } else {
                        // This can happen if the user record in firestore is deleted
                        // but the auth record still exists. We should sign them out.
                        setUser(null);
                        await signOut(auth);
                    }
                } catch (err: any) {
                     if (err.code === 'unavailable' || err.code === 'permission-denied') {
                        console.warn("Could not fetch user profile:", err.message);
                        // Emit a contextual error for permission issues
                        if (err.code === 'permission-denied') {
                             const permissionError = new FirestorePermissionError({
                                path: userRef.path,
                                operation: 'get',
                            });
                            errorEmitter.emit('permission-error', permissionError);
                        }
                    } else {
                        console.error("Failed to fetch user document:", err);
                    }
                    // In any error case, sign out the user to be safe.
                    setUser(null);
                    await signOut(auth);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (loading) return;

        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

        // If not authenticated and on a protected route, redirect to login
        if (!user && isProtectedRoute) {
            router.replace('/login');
            return;
        }

        if (user) {
            // If user is on a public route (login/signup), redirect them to their dashboard
            if (isPublicRoute) {
                const destination = user.role === 'admin' ? '/admin' : '/dashboard';
                router.replace(destination);
                return;
            }

            // If an admin is on a non-admin page, redirect to admin dashboard
            if (user.role === 'admin' && !pathname.startsWith('/admin')) {
                router.replace('/admin');
                return;
            }

            // If a non-admin is trying to access the admin page, redirect to their dashboard
            if (user.role !== 'admin' && pathname.startsWith('/admin')) {
                router.replace('/dashboard');
                return;
            }
        }
    }, [user, loading, pathname, router]);

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
