
import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-xl font-bold font-headline text-primary", className)}>
      <CheckCircle2 className="h-6 w-6" />
      <span>Trader Choice</span>
    </div>
  );
}
