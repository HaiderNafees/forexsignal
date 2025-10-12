// src/app/login/page.tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";

export default function LoginPage() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 pt-24">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex justify-center mb-4">
            <Logo />
          </Link>
          <CardTitle className="font-headline text-2xl">Login Disabled</CardTitle>
          <CardDescription>All backend functionality has been removed. This page is no longer active.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mt-4 text-center text-sm">
                <Link href="/" className="underline text-primary">
                Return to Home
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
