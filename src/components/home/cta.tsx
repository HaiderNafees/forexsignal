
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Cta() {
  return (
    <section className="bg-background py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="font-headline text-4xl md:text-5xl font-bold">
          Ready to Elevate Your Trading?
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Join thousands of traders who are getting their edge with Trader Choice. Sign up now and start your journey to smarter trading today.
        </p>
        <div className="mt-8">
          <Button size="lg" asChild>
            <Link href="/signup">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
