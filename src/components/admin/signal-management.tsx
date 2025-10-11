"use client";

import React, { useState } from "react";
import type { Signal } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";


function SignalForm({ signal, onSave, onOpenChange }: { signal?: Signal | null, onSave: (signal: Omit<Signal, 'id' | 'createdAt'> | Signal) => void, onOpenChange: (open: boolean) => void }) {
    const [editedSignal, setEditedSignal] = useState<Partial<Signal>>(
      signal || {
        pair: '',
        title: '',
        action: 'BUY',
        entry: 0,
        stopLoss: 0,
        takeProfit: 0,
        status: 'free',
      }
    );
    
    const handleSave = () => {
        if (!editedSignal.pair || !editedSignal.title || !editedSignal.entry || !editedSignal.stopLoss || !editedSignal.takeProfit) {
            console.error("All fields are required");
            return;
        }
        onSave(editedSignal as Omit<Signal, 'id' | 'createdAt'> | Signal);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const isNumeric = ['entry', 'stopLoss', 'takeProfit'].includes(name);
      setEditedSignal({ ...editedSignal, [name]: isNumeric ? parseFloat(value) : value });
    };

    const handleSelectChange = (name: 'action' | 'status') => (value: string) => {
        setEditedSignal({ ...editedSignal, [name]: value as any });
    }
    
    return (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{signal ? 'Edit Signal' : 'Create Signal'}</DialogTitle>
            <DialogDescription>
              {signal ? 'Update the details for this signal.' : 'Enter the details for the new signal.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pair" className="text-right">Pair</Label>
              <Input id="pair" name="pair" placeholder="e.g. XAU/USD" value={editedSignal.pair || ''} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input id="title" name="title" placeholder="e.g. Gold Bullish Momentum" value={editedSignal.title || ''} onChange={handleChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="action" className="text-right">Action</Label>
                <Select name="action" value={editedSignal.action} onValueChange={handleSelectChange('action')}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="BUY">BUY</SelectItem>
                        <SelectItem value="SELL">SELL</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entry" className="text-right">Entry</Label>
              <Input id="entry" name="entry" type="number" value={editedSignal.entry || ''} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stopLoss" className="text-right">Stop Loss</Label>
              <Input id="stopLoss" name="stopLoss" type="number" value={editedSignal.stopLoss || ''} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="takeProfit" className="text-right">Take Profit</Label>
              <Input id="takeProfit" name="takeProfit" type="number" value={editedSignal.takeProfit || ''} onChange={handleChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select name="status" value={editedSignal.status} onValueChange={handleSelectChange('status')}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
    )
}

export function SignalManagement() {
  const { signals, addSignal, updateSignal, deleteSignal } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const handleSaveSignal = (signal: Omit<Signal, 'id' | 'createdAt'> | Signal) => {
    if ('id' in signal) {
        updateSignal(signal);
    } else {
        addSignal(signal);
    }
    setIsDialogOpen(false);
    setSelectedSignal(null);
  }

  const openEditDialog = (signal: Signal) => {
    setSelectedSignal(signal);
    setIsDialogOpen(true);
  }

  const openCreateDialog = () => {
    setSelectedSignal(null);
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="flex justify-between items-center">
            <div>
            <h3 className="text-lg font-medium">All Signals</h3>
            <p className="text-sm text-muted-foreground">
                Create, update, and manage all forex signals.
            </p>
            </div>
            <Button onClick={openCreateDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Signal
            </Button>
        </div>
        {isDialogOpen && (
          <SignalForm signal={selectedSignal} onSave={handleSaveSignal} onOpenChange={setIsDialogOpen} />
        )}
      </Dialog>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pair</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.map((signal) => (
              <TableRow key={signal.id}>
                <TableCell className="font-medium">{signal.pair}</TableCell>
                <TableCell>{signal.title}</TableCell>
                <TableCell>
                    <Badge variant={signal.action === "BUY" ? "default" : "destructive"} className={cn(signal.action === 'BUY' ? "bg-green-500" : "bg-red-500", "text-white")}>
                        {signal.action}
                    </Badge>
                </TableCell>
                <TableCell>{signal.entry.toFixed(4)}</TableCell>
                <TableCell>
                    <Badge variant={signal.status === "premium" ? "outline" : "secondary"}>
                        {signal.status}
                    </Badge>
                </TableCell>
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
                      <DropdownMenuItem onSelect={() => openEditDialog(signal)}>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start text-sm text-destructive font-normal px-2 py-1.5 relative select-none items-center rounded-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-destructive/10">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the signal.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSignal(signal.id, signal.status)} className={cn(buttonVariants({variant: "destructive"}))}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
