
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Get In Touch</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Have a question, comment, or feedback? We'd love to hear from you. Fill out the form below or use our contact details.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>Our team will get back to you within 24 hours.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your Name" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="your@email.com" />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="How can we help you?" className="min-h-[150px]" />
                </div>
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start gap-4">
                        <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Email</h3>
                            <p className="text-muted-foreground">support@forexedge.com</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Phone</h3>
                            <p className="text-muted-foreground">(+1) 555-123-4567</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Office</h3>
                            <p className="text-muted-foreground">123 Trading Floor, Market St, Finance City</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
