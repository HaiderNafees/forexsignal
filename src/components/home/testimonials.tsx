
"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Star } from "lucide-react";

const testimonials = [
  {
    id: "avatar-1",
    name: "John D.",
    role: "Pro Trader",
    quote: "Trader Choice has been a game-changer for my trading strategy. The signals are incredibly accurate, and the analytics help me see the market with so much more clarity.",
  },
  {
    id: "avatar-2",
    name: "Sarah L.",
    role: "Part-Time Trader",
    quote: "As someone who can't watch the charts all day, Trader Choice is perfect. I get reliable signals and can execute trades with confidence. The Pro plan is worth every penny.",
  },
  {
    id: "avatar-3",
    name: "Mike P.",
    role: "Beginner Trader",
    quote: "I was new to forex and feeling overwhelmed. This platform made it so much easier to get started. The free signals helped me learn without risking much.",
  },
];

export function Testimonials() {
  const getAvatar = (id: string) => {
    return PlaceHolderImages.find(p => p.id === id);
  }

  return (
    <section className="bg-background py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="font-headline text-4xl md:text-5xl font-bold">
            Trusted by Traders Worldwide
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            Don't just take our word for it. Here's what our members have to say.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => {
            const avatar = getAvatar(testimonial.id);
            return (
                <Card key={testimonial.id} className="flex flex-col justify-between transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardContent className="pt-6">
                    <div className="flex text-yellow-400 mb-4">
                        {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                </CardContent>
                <div className="p-6 pt-0 flex items-center gap-4">
                    {avatar && (
                        <Image
                        src={avatar.imageUrl}
                        alt={avatar.description}
                        width={48}
                        height={48}
                        className="rounded-full"
                        data-ai-hint={avatar.imageHint}
                        />
                    )}
                    <div>
                        <p className="font-semibold font-headline">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                </div>
                </Card>
            )
          })}
        </div>
      </div>
    </section>
  );
}
