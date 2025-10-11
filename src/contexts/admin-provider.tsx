
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type AdminContextType = {
    user: User | null;
    loading: boolean;
    users: User[];
    updateUserRole: (userId: string, role: 'free' | 'pro' | 'admin') => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading, db } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [adminLoading, setAdminLoading] = useState(true);
    const { toast } = useToast();
    const [functions, setFunctions] = useState<Functions | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const funcs = getFunctions();
            setFunctions(funcs);
        }
    }, []);

    useEffect(() => {
        if (authLoading) {
            setAdminLoading(true);
            return;
        }

        // If auth has loaded but there's no user, or the user is not an admin, redirect.
        if (!user || user.role !== 'admin') {
            router.replace('/dashboard');
            return;
        }

        // At this point, user is confirmed to be an admin. Proceed with fetching admin data.
        if (!db) {
            setAdminLoading(false);
            return;
        }

        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setUsers(usersData);
            setAdminLoading(false);
        }, (error) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: collection(db, 'users').path, operation: 'list' }));
            } else {
                console.error("User listener error:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load user data.' });
            }
            setAdminLoading(false);
        });

        return () => {
            unsubscribeUsers();
        };

    }, [user, authLoading, db, toast, router]);

    const updateUserRole = useCallback(async (userId: string, role: 'free' | 'pro' | 'admin') => {
        if (!functions) {
             toast({ variant: 'destructive', title: 'Error', description: 'Functions service not available.' });
             return;
        }
        try {
            const setUserRoleFunc = httpsCallable(functions, 'setUserRole');
            await setUserRoleFunc({ uid: userId, role: role });
            // The onSnapshot listener will update the state automatically.
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
        if (!functions) {
             toast({ variant: 'destructive', title: 'Error', description: 'Functions service not available.' });
             return;
        }
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
    }, [toast, functions]);
    
    const loading = authLoading || adminLoading;

    if (loading) {
       return (
          <div className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-12 w-1/4" />
              <Skeleton className="h-8 w-1/2" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            </div>
          </div>
        );
    }
    
    const value = {
        user,
        loading,
        users,
        updateUserRole,
        deleteUser,
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    )
}

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
