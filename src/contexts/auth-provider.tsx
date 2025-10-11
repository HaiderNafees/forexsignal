
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
                try {
                    const idTokenResult = await fbUser.getIdTokenResult(true); // Force refresh
                    const role = (idTokenResult.claims.role as 'free' | 'pro' | 'admin') || 'free';
                    
                    const userRef = doc(db, 'users', fbUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = { uid: userSnap.id, ...userSnap.data(), role } as User;
                        setUser(userData);
                    } else {
                        // This is a new user, create their profile document
                        const newUserProfile = {
                            uid: fbUser.uid,
                            email: fbUser.email!,
                            role: 'free', // Default role
                            createdAt: serverTimestamp(),
                        };
                        
                        const userDocRef = doc(db, 'users', fbUser.uid);
                        await setDoc(userDocRef, newUserProfile);
                        setUser({
                             uid: fbUser.uid,
                             email: fbUser.email!,
                             role: 'free',
                             createdAt: new Date().toISOString(),
                        });
                    }
                } catch (err: any) {
                     console.error("Error during auth state change:", err);
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

        if (!user && isProtectedRoute) {
            router.replace('/login');
            return;
        }

        if (user) {
            if (isPublicRoute) {
                const destination = user.role === 'admin' ? '/admin' : '/dashboard';
                router.replace(destination);
                return;
            }

            if (user.role === 'admin' && !pathname.startsWith('/admin')) {
                router.replace('/admin');
                return;
            }

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
        
        const freeSignalsQuery = query(collection(db, 'signals_free'), orderBy('createdAt', 'desc'));
        const proSignalsQuery = query(collection(db, 'signals_pro'), orderBy('createdAt', 'desc'));

        const unsubFree = onSnapshot(freeSignalsQuery, 
            (snapshot) => {
                const freeSignalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
                setSignals(prev => [...prev.filter(s => s.status !== 'free'), ...freeSignalsData]);
            }, 
            (error) => {
                if (error.code === 'permission-denied') {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({ path: collection(db, 'signals_free').path, operation: 'list'}));
                } else {
                   console.error("Free signal listener error:", error);
                }
            }
        );

        let unsubPro = () => {};
        if (user.role === 'admin' || user.role === 'pro') {
            unsubPro = onSnapshot(proSignalsQuery,
                (snapshot) => {
                    const proSignalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
                    setSignals(prev => [...prev.filter(s => s.status !== 'premium'), ...proSignalsData]);
                },
                (error) => {
                    if (error.code === 'permission-denied') {
                         errorEmitter.emit('permission-error', new FirestorePermissionError({ path: collection(db, 'signals_pro').path, operation: 'list'}));
                    } else {
                       console.error("Pro signal listener error:", error);
                    }
                }
            );
        } else {
            setSignals(prev => prev.filter(s => s.status !== 'premium'));
        }

        let unsubscribeUsers = () => {};
        if (user.role === 'admin') {
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            unsubscribeUsers = onSnapshot(usersQuery, 
                (snapshot) => {
                    const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
                    setUsers(usersData);
                }, 
                (error) => {
                    if (error.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: collection(db, 'users').path, operation: 'list' }));
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
            unsubFree();
            unsubPro();
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
        const setUserRoleFunc = httpsCallable(functions, 'setUserRole');
        await setUserRoleFunc({ uid: userId, role: role });

        // Update local state immediately for better UX
        setUsers(prevUsers => prevUsers.map(u => u.uid === userId ? { ...u, role } : u));
        
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
  }, [toast, functions]);

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
        .catch((serverError) => {
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
    const collectionName = signalData.status === 'premium' ? 'signals_pro' : 'signals_free';
    const signalsCollection = collection(db, collectionName);
    const newSignalData = { ...signalData, createdAt: serverTimestamp() };
    addDoc(signalsCollection, newSignalData)
        .then(() => {
            toast({ title: "Signal Created", description: "The new signal has been added successfully." });
        })
        .catch((serverError) => {
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
  }, [toast, db]);


  const updateSignal = useCallback(async (signal: Signal) => {
    const { id, status, ...signalData } = signal;
    const collectionName = status === 'premium' ? 'signals_pro' : 'signals_free';
    const signalRef = doc(db, collectionName, id);
    updateDoc(signalRef, { ...signalData })
        .then(() => {
            toast({ title: "Signal Updated", description: "The signal has been updated successfully." });
        })
        .catch((serverError) => {
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
  }, [toast, db]);
  
  const deleteSignal = useCallback(async (signalId: string, status: 'free' | 'premium') => {
    const collectionName = status === 'premium' ? 'signals_pro' : 'signals_free';
    const signalRef = doc(db, collectionName, signalId);
    deleteDoc(signalRef)
        .then(() => {
            toast({
                variant: "destructive",
                title: "Signal Deleted",
                description: "The signal has been removed."
            });
        })
        .catch((serverError) => {
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
  }, [toast, db]);

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
    deleteSignal: (signalId: string) => {
        const signal = signals.find(s => s.id === signalId);
        if (signal) {
            return deleteSignal(signalId, signal.status);
        }
        return Promise.resolve();
    },
    auth,
    db,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
