
import { Logo } from "@/components/logo";
import { Twitter, Facebook, Instagram } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const footerLinks = [
    { href: "/about", label: "About Us" },
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ];
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center md:items-start">
                 <Link href="/" aria-label="ForexEdge Home">
                    <Logo />
                </Link>
                <p className="text-sm text-muted-foreground mt-2 text-center md:text-left">Premium Forex Signals & Analytics</p>
            </div>
            <div className="flex flex-col items-center">
                 <h3 className="font-headline text-lg font-semibold">Quick Links</h3>
                 <div className="flex flex-col items-center md:items-start gap-2 mt-4 text-center">
                    {footerLinks.map(link => (
                        <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                 </div>
            </div>
            <div className="flex flex-col items-center md:items-end">
                <h3 className="font-headline text-lg font-semibold">Follow Us</h3>
                <div className="flex space-x-6 mt-4">
                    <Link href="#" className="text-muted-foreground hover:text-primary">
                    <Twitter />
                    <span className="sr-only">Twitter</span>
                    </Link>
                    <Link href="#" className="text-muted-foreground hover:text-primary">
                    <Facebook />
                    <span className="sr-only">Facebook</span>
                    </Link>
                    <Link href="#" className="text-muted-foreground hover:text-primary">
                    <Instagram />
                    <span className="sr-only">Instagram</span>
                    </Link>
                </div>
            </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ForexEdge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
