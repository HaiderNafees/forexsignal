"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { Logo } from '@/components/logo';

export function Header() {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#signals", label: "Signals" },
    { href: "/#pricing", label: "Pricing" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-card/80 shadow-md backdrop-blur-sm" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="ForexEdge Home">
          <Logo className={cn(isScrolled ? "text-primary" : "text-white")} />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isScrolled ? "text-foreground" : "text-gray-200 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted/50" />
          ) : user ? (
            <UserNav />
          ) : (
            <>
              <Button variant="ghost" asChild className={cn(isScrolled ? "text-primary" : "text-white hover:bg-white/10 hover:text-white")}>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
