
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This context is only for the admin panel
type AdminContextType = {
    user: User | null;
    loading: boolean;
    users: User[];
    updateUserRole: (userId: string, role: 'free' | 'pro' | 'admin') => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { user, loading, db } = useAuth(); // We get the base user and db connection from the main AuthProvider
    const [users, setUsers] = useState<User[]>([]);
    const [adminLoading, setAdminLoading] = useState(true);
    const { toast } = useToast();
    const [functions, setFunctions] = useState<Functions | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const funcs = getFunctions();
            setFunctions(funcs);
        }
    }, []);

    useEffect(() => {
        if (loading) {
            setAdminLoading(true);
            return;
        }
        if (!user || user.role !== 'admin') {
            // No need to fetch admin data if not an admin
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

    }, [user, loading, db, toast]);

    const updateUserRole = useCallback(async (userId: string, role: 'free' | 'pro' | 'admin') => {
        if (!functions) {
             toast({ variant: 'destructive', title: 'Error', description: 'Functions service not available.' });
             return;
        }
        try {
            const setUserRoleFunc = httpsCallable(functions, 'setUserRole');
            await setUserRoleFunc({ uid: userId, role: role });
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

    const value = {
        user,
        loading: loading || adminLoading,
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
