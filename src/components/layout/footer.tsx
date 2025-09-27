import { Logo } from "@/components/logo";
import { Twitter, Facebook, Instagram } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row gap-8">
          <div className="flex-shrink-0">
             <Link href="/" aria-label="ForexEdge Home">
              <Logo />
            </Link>
          </div>
          <div className="flex space-x-6">
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
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ForexEdge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
