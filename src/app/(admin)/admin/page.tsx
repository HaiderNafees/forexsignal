
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-provider';
import type { Signal, User, Payment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Edit, Trash } from 'lucide-react';

// --- Signal Management ---
function SignalForm({
  signal,
  onSave,
  onClose,
}: {
  signal?: Signal | null;
  onSave: (data: Omit<Signal, 'id' | 'createdAt' | 'createdBy'> | Omit<Signal, 'createdAt' | 'createdBy'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: signal?.title ?? '',
    description: signal?.description ?? '',
    entryPrice: signal?.entryPrice ?? 0,
    takeProfit: signal?.takeProfit ?? 0,
    stopLoss: signal?.stopLoss ?? 0,
    isPremium: signal?.isPremium ?? false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({...prev, isPremium: checked}));
  }

  const handleSubmit = () => {
    if (signal?.id) {
        onSave({ id: signal.id, ...formData });
    } else {
        onSave(formData);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{signal ? 'Edit Signal' : 'Create Signal'}</DialogTitle>
          <DialogDescription>Fill in the details for the trading signal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className='space-y-2'>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} />
            </div>
            <div className='space-y-2'>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className='space-y-2'>
                    <Label htmlFor="entryPrice">Entry Price</Label>
                    <Input id="entryPrice" name="entryPrice" type="number" value={formData.entryPrice} onChange={handleChange} />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor="takeProfit">Take Profit</Label>
                    <Input id="takeProfit" name="takeProfit" type="number" value={formData.takeProfit} onChange={handleChange} />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor="stopLoss">Stop Loss</Label>
                    <Input id="stopLoss" name="stopLoss" type="number" value={formData.stopLoss} onChange={handleChange} />
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="isPremium" checked={formData.isPremium} onCheckedChange={handleCheckboxChange} />
                <Label htmlFor="isPremium">Premium Signal</Label>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SignalManagement() {
  const { signals, addSignal, updateSignal, deleteSignal } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const handleSave = (data: any) => {
    if (data.id) {
        updateSignal(data);
    } else {
        addSignal(data);
    }
    setIsFormOpen(false);
    setSelectedSignal(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Signals</h2>
        <Button onClick={() => { setSelectedSignal(null); setIsFormOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Signal
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Entry Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.map((signal) => (
              <TableRow key={signal.id}>
                <TableCell>{signal.title}</TableCell>
                <TableCell>{signal.entryPrice}</TableCell>
                <TableCell>
                  <Badge variant={signal.isPremium ? 'default' : 'secondary'}>
                    {signal.isPremium ? 'Premium' : 'Free'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedSignal(signal); setIsFormOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSignal(signal.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {isFormOpen && <SignalForm signal={selectedSignal} onSave={handleSave} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}

// --- User Management ---
function UserManagement() {
  const { allUsers } = useAuth();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Users</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Pro Status</TableHead><TableHead>Pro Expires</TableHead></TableRow></TableHeader>
          <TableBody>
            {allUsers.map(user => (
              <TableRow key={user.uid}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                    <Badge variant={user.proExpires && user.proExpires.toMillis() > Date.now() ? 'default' : 'secondary'}>
                        {user.proExpires && user.proExpires.toMillis() > Date.now() ? 'Pro' : 'Free'}
                    </Badge>
                </TableCell>
                <TableCell>{user.proExpires ? user.proExpires.toDate().toLocaleDateString() : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// --- Payment Management ---
function PaymentManagement() {
  const { payments } = useAuth();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Payments</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>User ID</TableHead><TableHead>TX Hash</TableHead><TableHead>Status</TableHead><TableHead>Created At</TableHead></TableRow></TableHeader>
          <TableBody>
            {payments.map(payment => (
              <TableRow key={payment.id}>
                <TableCell>{payment.uid}</TableCell>
                <TableCell className='max-w-xs truncate'>{payment.txHash}</TableCell>
                <TableCell>
                    <Badge variant={payment.status === 'verified' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
                        {payment.status}
                    </Badge>
                </TableCell>
                <TableCell>{payment.createdAt.toDate().toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// --- Main Admin Page ---
export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading || user?.role !== 'admin') {
    return <div className="flex h-screen items-center justify-center">Loading or insufficient permissions...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Tabs defaultValue="signals">
        <TabsList>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="signals" className="pt-6">
          <SignalManagement />
        </TabsContent>
        <TabsContent value="users" className="pt-6">
          <UserManagement />
        </TabsContent>
        <TabsContent value="payments" className="pt-6">
          <PaymentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
