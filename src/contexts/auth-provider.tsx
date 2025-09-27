
"use client";

import type { User, Signal } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getFirebase } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    type Auth,
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
    type Firestore,
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
async function seedInitialData(auth: Auth, db: Firestore) {
  const adminEmail = "admin@forexsignal.com";
  const adminPassword = "Admin798956!!";
  const usersRef = collection(db, "users");
  
  const q = query(usersRef, where("email", "==", adminEmail));
  const querySnapshot = await getDocs(q);

  let adminExists = !querySnapshot.empty;

  if (!adminExists) {
    console.log("Admin user not found in Firestore, attempting to create...");
    try {
      // We try to sign in first to see if the auth user exists
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        // If sign-in succeeds, but Firestore doc was missing, this shouldn't happen with onAuthStateChanged logic, but as a fallback:
         const authUser = auth.currentUser;
         if (authUser) {
            const adminUserData: Omit<User, 'uid'> = {
                email: adminEmail,
                role: 'admin',
                createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', authUser.uid), adminUserData);
            console.log("Admin user existed in Auth, Firestore document created.");
         }
      } catch (error: any) {
        // If sign-in fails because the user doesn't exist, create both Auth user and Firestore doc
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          const adminUserData: Omit<User, 'uid'> = {
            email: adminEmail,
            role: 'admin',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', userCredential.user.uid), adminUserData);
          console.log("Admin user created successfully in Auth and Firestore.");
        } else {
           throw error; // Re-throw other sign-in errors
        }
      }
    } catch (error: any) {
      console.error("Error seeding admin user:", error);
    }
  }

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
    const { auth, db } = getFirebase();

    if (!auth || !db) {
        console.error("Firebase not initialized");
        setLoading(false);
        return;
    }
    
    // Don't await this, let it run in the background
    seedInitialData(auth, db);

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUser({ uid: doc.id, ...doc.data() } as User);
          } else {
            // This can happen if the firestore doc is deleted but auth user still exists
            setUser(null);
          }
          setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
        setLoading(false); // Fix: Ensure loading is false when no user is logged in
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
    const { auth, db } = getFirebase();
    if (!auth || !db) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'uid'>;
          toast({ title: 'Login Successful', description: 'Welcome back!' });
          const path = userData.role === 'admin' ? '/admin' : '/dashboard';
          router.push(path);
      } else {
          // This case should be rare, but handle it
          await signOut(auth); // Sign out the user as their DB record is missing
          throw new Error("User data not found in database. Please sign up again.");
      }
    } catch (error: any) {
        console.error("Login Error:", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.code === 'auth/invalid-credential' ? 'Invalid credentials. Please try again.' : error.message,
      });
    } finally {
        setLoading(false);
    }
  }, [router, toast]);

  const signup = useCallback(async (email: string, pass:string) => {
    const { auth, db } = getFirebase();
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
        
        // Fix: Explicitly fetch the user doc to populate the state correctly
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
            setUser({ uid: userDoc.id, ...userDoc.data() } as User);
        }

        toast({
            title: 'Account Created',
            description: 'You have been successfully signed up! Redirecting to dashboard...',
        });
        router.push('/dashboard');
    } catch (error: any) {
         console.error("Signup Error:", error);
        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  }, [router, toast]);
  
  const logout = useCallback(async () => {
    const { auth } = getFirebase();
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
  }, [router, toast]);

  const updateUserRole = useCallback(async (userId: string, role: 'free' | 'pro' | 'admin') => {
    const { db } = getFirebase();
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
    const { db } = getFirebase();
    if (!db) return;
    // In a real app, you would need a Cloud Function to delete the auth user.
    // This only deletes the Firestore record.
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
    const { db } = getFirebase();
    if (!db) return;
    const newDocRef = doc(collection(db, "signals"));
    const newSignal: Omit<Signal, 'id'> = {
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
    const { db } = getFirebase();
    if (!db) return;
    const signalDocRef = doc(db, 'signals', signal.id);
    const { id, ...updateData } = signal; // Do not write the id inside the document
    try {
      await updateDoc(signalDocRef, updateData);
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
    const { db } = getFirebase();
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

    