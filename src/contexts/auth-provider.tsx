'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, setDoc, writeBatch, getDocs, collectionGroup } from 'firebase/firestore';
import type { User, Signal, UpgradeRequest } from '@/lib/types';
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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
  deleteSignal: (signalId: string, status: 'free' | 'premium') => Promise<void>;
  auth: Auth;
  db: Firestore;
  allUsers: User[];
  upgradeRequests: UpgradeRequest[];
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
                         // Ensure role in Firestore matches claim, important after custom claim is set
                        const firestoreRole = userSnap.data().role;
                        if (firestoreRole !== role) {
                            await updateDoc(userDocRef, { role });
                        }
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
                             role: 'free', // Always default to free on creation, claim will update it
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

    useEffect(() => {
        if (!db) return;
        
        const allSignalsQuery = query(collectionGroup(db, 'signals'), orderBy('createdAt', 'desc'));
        const unsubscribeSignals = onSnapshot(allSignalsQuery, (snapshot) => {
            const signalsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Determine status from parent collection ID
                    status: doc.ref.parent.id === 'signals_pro' ? 'premium' : 'free',
                } as Signal;
            });
            setSignals(signalsData);
        }, (error) => {
            console.error("Error fetching all signals:", error);
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'signals_free or signals_pro', operation: 'list' }));
            }
        });


        let unsubUsers: () => void = () => {};
        let unsubRequests: () => void = () => {};

        if (user?.role === 'admin') {
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            unsubUsers = onSnapshot(usersQuery, (snapshot) => {
                const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
                setAllUsers(usersData);
            }, (error) => {
                console.error("User listener error:", error);
            });

            const requestsQuery = query(collection(db, "upgrade_requests"), orderBy("requestedAt", "desc"));
            unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
                const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UpgradeRequest));
                setUpgradeRequests(requestsData);
            }, (error) => {
                console.error("Error fetching upgrade requests:", error);
            });
        } else {
            setAllUsers([]);
            setUpgradeRequests([]);
        }

        return () => {
            unsubscribeSignals();
            unsubUsers();
            unsubRequests();
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
  }, [router, toast, auth]);


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
    const batch = writeBatch(db);
    const originalStatus = signals.find(s => s.id === signal.id)?.status;
    const newStatus = signal.status;

    const { id, ...signalData } = signal;

    if (originalStatus && originalStatus !== newStatus) {
        // Status has changed, so we need to delete from the old collection and add to the new one
        const oldCollectionName = originalStatus === 'premium' ? 'signals_pro' : 'signals_free';
        const oldDocRef = doc(db, oldCollectionName, id);
        batch.delete(oldDocRef);

        const newCollectionName = newStatus === 'premium' ? 'signals_pro' : 'signals_free';
        const newDocRef = doc(db, newCollectionName, id);
        batch.set(newDocRef, signalData);
    } else {
        // Status is the same, just update the document in place
        const collectionName = newStatus === 'premium' ? 'signals_pro' : 'signals_free';
        const signalRef = doc(db, collectionName, id);
        batch.update(signalRef, signalData);
    }

    batch.commit().then(() => {
        toast({ title: "Signal Updated", description: "The signal has been updated successfully." });
    }).catch(serverError => {
         if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `signals_${originalStatus} or signals_${newStatus}`,
                operation: 'write',
                requestResourceData: signalData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        } else {
            toast({ variant: 'destructive', title: "Update Failed", description: "Could not update the signal." });
        }
    });

  }, [toast, db, signals]);
  
  const deleteSignal = useCallback(async (signalId: string, status: 'free' | 'premium') => {
    if (!db) return;
    const collectionName = status === 'premium' ? 'signals_pro' : 'signals_free';
    const signalRef = doc(db, collectionName, signalId);
    deleteDoc(signalRef)
        .then(() => {
            toast({
                title: "Signal Deleted",
                description: "The signal has been removed.",
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
    signals,
    loading,
    logout,
    addSignal,
    updateSignal,
    deleteSignal,
    auth,
    db,
    allUsers,
    upgradeRequests,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
