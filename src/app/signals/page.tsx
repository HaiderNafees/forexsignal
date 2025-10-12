
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function SignalsPage() {

  return (
    <section id="signals" className="py-16 md:py-24 bg-card pt-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold">Trading Signals</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              This feature is currently disabled as all backend functionality has been removed.
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
                <Link href="/">
                    Return to Home
                </Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
