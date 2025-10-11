'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, setDoc } from 'firebase/firestore';
import type { User, Signal, UpgradeRequest } from '@/lib/types';
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { getFunctions, httpsCallable } from 'firebase/functions';

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

if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signals: Signal[];
  loading: boolean;
  logout: () => void;
  addSignal: (signal: Omit<Signal, 'id' | 'createdAt'>) => Promise<void>;
  updateSignal: (signal: Signal) => Promise<void>;
  deleteSignal: (signalId: string) => Promise<void>;
  auth: Auth;
  db: Firestore;
  // Admin specific state
  allUsers: User[];
  upgradeRequests: UpgradeRequest[];
  updateUserRole: (userId: string, role: 'free' | 'pro' | 'admin') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const protectedRoutes = ['/dashboard', '/admin'];
const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode; }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setLoading(true);
            setFirebaseUser(fbUser);
            if (fbUser) {
                try {
                    const idTokenResult = await fbUser.getIdTokenResult(true);
                    const role = (idTokenResult.claims.role as 'free' | 'pro' | 'admin') || 'free';
                    
                    const userDocRef = doc(db, 'users', fbUser.uid);
                    const userSnap = await getDoc(userDocRef);

                    let currentUser: User | null = null;
                    if (userSnap.exists()) {
                        currentUser = { uid: userSnap.id, ...userSnap.data(), role } as User;
                    } else {
                         const newUserDoc: Omit<User, 'uid'|'role'|'createdAt'> = {
                             email: fbUser.email!,
                         };
                         await setDoc(userDocRef, {
                            ...newUserDoc,
                            role: 'free', 
                            createdAt: serverTimestamp()
                         });
                         currentUser = {
                             ...newUserDoc,
                             uid: fbUser.uid,
                             role: role,
                             createdAt: new Date().toISOString(),
                         };
                    }
                    setUser(currentUser);

                } catch (err: any) {
                    console.error("Error during auth state change:", err);
                    setUser(null);
                    if (auth) await signOut(auth);
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
        
        const isAdminRoute = pathname.startsWith('/admin');

        if (user) {
             if (user.role === 'admin' && !isAdminRoute) {
                router.replace('/admin');
                return;
            }
             if (user.role !== 'admin' && isAdminRoute) {
                router.replace('/dashboard');
                return;
            }
            if (publicRoutes.includes(pathname)) {
                router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
            }
        } else {
            const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
            if (isProtectedRoute) {
                 router.replace('/login');
            }
        }

    }, [user, loading, pathname, router]);

    // Data fetching useEffect
    useEffect(() => {
        if (!db) return;
        
        let unsubscribers: (()=>void)[] = [];

        // Always subscribe to all signals if user is admin, otherwise just free/pro
        const setupSignalListeners = () => {
            const freeSignalsQuery = query(collection(db, 'signals_free'), orderBy('createdAt', 'desc'));
            const proSignalsQuery = query(collection(db, 'signals_pro'), orderBy('createdAt', 'desc'));

            const unsubFree = onSnapshot(freeSignalsQuery, (snapshot) => {
                const freeSignalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
                setSignals(prev => [...prev.filter(s => s.status !== 'free'), ...freeSignalsData]);
            }, (error) => {
                if (error.code === 'permission-denied') {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'signals_free', operation: 'list'}));
                } else {
                   console.error("Free signal listener error:", error);
                }
            });
            unsubscribers.push(unsubFree);
            
            if (user?.role === 'pro' || user?.role === 'admin') {
                const unsubPro = onSnapshot(proSignalsQuery, (snapshot) => {
                    const proSignalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
                    setSignals(prev => [...prev.filter(s => s.status !== 'premium'), ...proSignalsData]);
                }, (error) => {
                    if (error.code === 'permission-denied') {
                         errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'signals_pro', operation: 'list'}));
                    } else {
                       console.error("Pro signal listener error:", error);
                    }
                });
                unsubscribers.push(unsubPro);
            } else {
                // If user is not pro/admin, ensure no pro signals are in state
                 setSignals(prev => prev.filter(s => s.status !== 'premium'));
            }
        }

        const setupAdminListeners = () => {
             if (user?.role === 'admin') {
                const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
                    const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
                    setAllUsers(usersData);
                }, (error) => {
                    if (error.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list' }));
                    } else {
                        console.error("User listener error:", error);
                    }
                });
                unsubscribers.push(unsubUsers);

                const requestsQuery = query(collection(db, "upgrade_requests"), orderBy("requestedAt", "desc"));
                const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
                    const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UpgradeRequest));
                    setUpgradeRequests(requestsData);
                }, (error) => {
                    console.error("Error fetching upgrade requests:", error);
                });
                unsubscribers.push(unsubRequests);
            } else {
                setAllUsers([]);
                setUpgradeRequests([]);
            }
        }
        
        setupSignalListeners();
        setupAdminListeners();

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [user, db]);


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


  const addSignal = useCallback(async (signalData: Omit<Signal, 'id' | 'createdAt'>) => {
    if (!db) return;
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
    if (!db) return;
    const { id, status, ...signalData } = signal;
    // This logic is flawed if a signal's status is changed. It might not be found in the original collection.
    // For simplicity, we assume status doesn't change, or we'd need a more complex transaction.
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
    if (!db) return;
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

  // Admin functions
    const updateUserRole = useCallback(async (userId: string, role: 'free' | 'pro' | 'admin') => {
        const functions = getFunctions();
        try {
            const setUserRoleFunc = httpsCallable(functions, 'setUserRole');
            await setUserRoleFunc({ uid: userId, role: role });
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
        const functions = getFunctions();
        try {
            const deleteUserFunc = httpsCallable(functions, 'deleteUser');
            await deleteUserFunc({ uid: userId });
            toast({
                variant: 'destructive',
                title: 'User Deleted',
                description: 'The user has been successfully deleted.',
            });
        } catch (error: any) {
            console.error('Error deleting user:', error);
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error.message || 'Could not delete the user.',
            });
        }
    }, [toast]);

  const contextValue = {
    user,
    firebaseUser,
    signals,
    loading,
    logout,
    addSignal,
    updateSignal,
    deleteSignal: (signalId: string) => {
        const signal = signals.find(s => s.id === signalId);
        if (signal) {
            return deleteSignal(signalId, signal.status);
        }
        toast({ variant: 'destructive', title: "Delete Failed", description: "Signal not found to determine its status." });
        return Promise.resolve();
    },
    auth,
    db,
    allUsers,
    upgradeRequests,
    updateUserRole,
    deleteUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
