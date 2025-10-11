
"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/admin-provider";
import { useAuth } from "@/hooks/use-auth";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { UpgradeRequest } from "@/lib/types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export function UpgradeRequests() {
  const { db } = useAuth();
  const { updateUserRole } = useAdmin();
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "upgrade_requests"), orderBy("requestedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UpgradeRequest));
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching upgrade requests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch upgrade requests.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, toast]);

  const handleApprove = async (request: UpgradeRequest) => {
    // First, update the user's role to 'pro'
    await updateUserRole(request.uid, 'pro');
    
    // After successfully updating the role, delete the request document
    if (!db) return;
    const requestRef = doc(db, 'upgrade_requests', request.id);
    deleteDoc(requestRef).catch(async (serverError) => {
       if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: requestRef.path,
                operation: 'delete',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        } else {
            toast({
                variant: 'destructive',
                title: 'Cleanup Failed',
                description: 'User was upgraded, but failed to remove the request. Please remove it manually.'
            });
        }
    });
  };

  const handleDeny = (requestId: string) => {
    if (!db) return;
    const requestRef = doc(db, 'upgrade_requests', requestId);
    deleteDoc(requestRef).then(() => {
      toast({
        title: "Request Denied",
        description: "The upgrade request has been removed.",
      });
    }).catch(async (serverError) => {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: requestRef.path,
                operation: 'delete',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        } else {
            toast({
                variant: "destructive",
                title: "Failed to Deny",
                description: "Could not remove the request. Please try again.",
            });
        }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">User Upgrade Requests</h3>
        <p className="text-sm text-muted-foreground">
          Review and approve user requests to upgrade to the Pro plan.
        </p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Loading requests...</TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">No pending upgrade requests.</TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.email}</TableCell>
                  <TableCell>{request.requestedAt?.toDate ? new Date(request.requestedAt.toDate()).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => handleApprove(request)} size="sm" className="mr-2">Approve</Button>
                    <Button onClick={() => handleDeny(request.id)} size="sm" variant="destructive">Deny</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
