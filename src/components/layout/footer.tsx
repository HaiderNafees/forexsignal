
import { Logo } from "@/components/logo";
import { Twitter, Facebook, Instagram } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const footerLinks = [
    { href: "/about", label: "About" },
    { href: "/features", label: "Features" },
    { href: "/signals", label: "Signals" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ];
  const socialLinks = [
      { href: "#", icon: <Twitter />, label: "Twitter" },
      { href: "#", icon: <Facebook />, label: "Facebook" },
      { href: "#", icon: <Instagram />, label: "Instagram" },
  ];

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between py-6">
            <div className="mb-4 md:mb-0">
                <Link href="/" aria-label="Trader Choice Home">
                    <Logo />
                </Link>
            </div>
            <nav className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4 md:mb-0">
                {footerLinks.map(link => (
                    <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                    </Link>
                ))}
            </nav>
            <div className="flex items-center space-x-4">
                {socialLinks.map(link => (
                    <Link key={link.label} href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                        {link.icon}
                        <span className="sr-only">{link.label}</span>
                    </Link>
                ))}
            </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Trader Choice Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
