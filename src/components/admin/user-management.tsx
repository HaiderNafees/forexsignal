"use client";

import React from "react";
import { User } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, User as UserIcon, Shield, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const roleIcons = {
  free: <UserIcon className="h-4 w-4 text-muted-foreground" />,
  pro: <Crown className="h-4 w-4 text-yellow-500" />,
  admin: <Shield className="h-4 w-4 text-red-500" />,
};

export function UserManagement() {
  const { users, updateUserRole, deleteUser } = useAuth();
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">All Users</h3>
        <p className="text-sm text-muted-foreground">
          Manage user accounts, roles, and permissions.
        </p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined On</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'pro' ? 'default' : 'secondary'} className="flex items-center gap-2 w-fit">
                    {roleIcons[user.role]}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => updateUserRole(user.uid, 'pro')} disabled={user.role === 'pro'}>
                        Make Pro
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => updateUserRole(user.uid, 'free')} disabled={user.role === 'free'}>
                        Make Free
                      </DropdownMenuItem>
                       <DropdownMenuItem onSelect={() => updateUserRole(user.uid, 'admin')} disabled={user.role === 'admin'}>
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => deleteUser(user.uid)} className="text-destructive" disabled={user.role === 'admin'}>
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
