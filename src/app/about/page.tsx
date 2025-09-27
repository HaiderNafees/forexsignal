
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Target, Users } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AboutPage() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'hero'); // Re-using hero for now

  return (
    <div className="bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">About ForexEdge</h1>
          <p className="text-muted-foreground mt-3 max-w-3xl mx-auto">
            We are a team of passionate financial analysts, data scientists, and software engineers dedicated to empowering retail traders with the tools and insights typically reserved for institutional investors.
          </p>
        </header>

        {aboutImage && (
             <div className="relative w-full h-96 rounded-lg overflow-hidden mb-12 shadow-lg">
                <Image
                    src={aboutImage.imageUrl}
                    alt="ForexEdge Team"
                    fill
                    className="object-cover"
                    data-ai-hint="office team"
                />
                 <div className="absolute inset-0 bg-black/50" />
            </div>
        )}

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
                <h2 className="font-headline text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-4">
                    Our mission is to democratize the forex market. We believe that every trader, regardless of experience or capital, deserves access to high-quality data, professional-grade analytical tools, and a supportive community. By combining cutting-edge technology with seasoned trading expertise, we deliver actionable insights that help you trade smarter, not harder.
                </p>
                <p className="text-muted-foreground">
                    We are obsessively committed to transparency, accuracy, and the long-term success of our members. Your journey in the markets is our priority, and we're here to provide the support and technology you need to thrive every step of the way.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Target className="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>Actionable Insights</CardTitle>
                            <p className="text-sm text-muted-foreground">Delivering clear, data-driven signals to eliminate noise.</p>
                        </div>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Users className="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>Community Focused</CardTitle>
                            <p className="text-sm text-muted-foreground">Building a collaborative and supportive network of traders.</p>
                        </div>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Building className="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>Constant Innovation</CardTitle>
                            <p className="text-sm text-muted-foreground">Continuously improving our platform and algorithms.</p>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
