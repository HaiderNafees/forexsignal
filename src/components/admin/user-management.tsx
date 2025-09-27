"use client";

import React from "react";
import { USERS } from "@/lib/placeholder-data";
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
import { useToast } from "@/hooks/use-toast";

const roleIcons = {
  free: <UserIcon className="h-4 w-4 text-muted-foreground" />,
  pro: <Crown className="h-4 w-4 text-yellow-500" />,
  admin: <Shield className="h-4 w-4 text-red-500" />,
};

export function UserManagement() {
  const [users, setUsers] = React.useState<User[]>(USERS);
  const { toast } = useToast();

  const handleRoleChange = (userId: string, newRole: "free" | "pro") => {
    setUsers(users.map(u => u.uid === userId ? {...u, role: newRole} : u));
    toast({
        title: "User Role Updated",
        description: `User role has been successfully changed to ${newRole}.`,
    })
  };
  
  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.uid !== userId));
    toast({
        variant: "destructive",
        title: "User Removed",
        description: `User has been successfully removed.`,
    })
  };

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
                      <DropdownMenuItem onSelect={() => handleRoleChange(user.uid, 'pro')} disabled={user.role === 'pro'}>
                        Make Pro
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleRoleChange(user.uid, 'free')} disabled={user.role === 'free'}>
                        Make Free
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleDeleteUser(user.uid)} className="text-destructive" disabled={user.role === 'admin'}>
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
