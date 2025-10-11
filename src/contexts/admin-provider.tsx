
'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { User, UpgradeRequest } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type AdminContextType = {
    user: User | null;
    loading: boolean;
    users: User[];
    upgradeRequests: UpgradeRequest[];
    updateUserRole: (userId: string, role: 'free' | 'pro' | 'admin') => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { 
        user, 
        loading, 
        allUsers, 
        upgradeRequests, 
        updateUserRole, 
        deleteUser 
    } = useAuth();
    
    // The main loading state is now handled by the AuthProvider.
    // We just need to ensure the user is an admin before rendering.
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

    if (user?.role !== 'admin') {
      // This should ideally not be seen as AuthProvider handles redirection.
      // It's a fallback.
      return (
         <div className="p-8">
            <h1 className="text-destructive">Access Denied</h1>
            <p>You do not have permission to view this page.</p>
         </div>
      )
    }
    
    const value = {
        user,
        loading,
        users: allUsers,
        upgradeRequests,
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
