
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { Logo } from '@/components/logo';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';

export function Header() {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Check on initial render
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    } else {
        setIsScrolled(true);
    }
  }, [isHomePage, pathname]);

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/signals", label: "Signals" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];
  
  const headerClasses = cn(
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
    isScrolled || !isHomePage ? "bg-card/80 shadow-md backdrop-blur-sm" : "bg-transparent"
  );
  
  const linkClasses = cn(
      "text-sm font-medium transition-colors hover:text-primary",
      isScrolled || !isHomePage ? "text-foreground" : "text-gray-200 hover:text-white"
  );

  const mobileLinkClasses = cn(
      "text-foreground hover:text-primary transition-colors"
  );

  const mobileTriggerClasses = cn(
      isScrolled || !isHomePage ? "text-primary" : "text-white hover:bg-white/10 hover:text-white"
  )

  const logoClasses = cn(
    isScrolled || !isHomePage ? "text-primary" : "text-white"
  )
  
  const loginButtonClasses = cn(
      isScrolled || !isHomePage ? "" : "text-white hover:bg-white/10 hover:text-white"
  )

  return (
    <header className={headerClasses}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="ForexEdge Home">
          <Logo className={logoClasses} />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted/50" />
            ) : user ? (
              <UserNav />
            ) : (
              <>
                <Button variant="ghost" asChild className={loginButtonClasses}>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={mobileTriggerClasses}>
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm bg-card">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center border-b pb-4">
                    <Link href="/" aria-label="ForexEdge Home">
                        <Logo />
                    </Link>
                    <SheetClose asChild>
                         <Button variant="ghost" size="icon">
                            <X className="h-6 w-6" />
                            <span className="sr-only">Close menu</span>
                        </Button>
                    </SheetClose>
                  </div>
                  <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link href={link.href} className={mobileLinkClasses}>
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="mt-auto pt-8 border-t">
                     {loading ? (
                        <div className="h-10 w-full animate-pulse rounded-md bg-muted/50" />
                      ) : user ? (
                        <div className="flex flex-col gap-4">
                          <p className="text-center text-muted-foreground">{user.email}</p>
                          <SheetClose asChild>
                            <Button asChild className="w-full">
                              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>Dashboard</Link>
                            </Button>
                          </SheetClose>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <SheetClose asChild>
                            <Button asChild variant="outline" className="w-full">
                              <Link href="/login">Login</Link>
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                          <Button asChild className="w-full">
                            <Link href="/signup">Sign Up</Link>
                          </Button>
                          </SheetClose>
                        </div>
                      )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
           {user && !loading && <div className="md:hidden"><UserNav /></div>}
        </div>
      </div>
    </header>
  );
}
