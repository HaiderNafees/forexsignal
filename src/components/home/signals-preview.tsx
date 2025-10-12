
"use client";

import React from 'react';
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';


export function SignalsPreview() {

  return (
    <section id="signals" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Today's Free Signals</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Get a glimpse of our premium analysis.
            </p>
        </div>
         <Alert className="mb-8 max-w-2xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertTitle>Signals Unavailable</AlertTitle>
            <AlertDescription>
               Signal data cannot be loaded because the database connection has been removed.
            </AlertDescription>
        </Alert>
        <div className="mt-12 text-center">
            <Button asChild size="lg" variant="default">
                <Link href="/pricing">
                    Learn More About Pro
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
