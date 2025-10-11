
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, LifeBuoy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContactPage() {
  return (
    <div className="bg-background pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Get In Touch</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Have a question, feedback, or a partnership proposal? We'd love to hear from you. Our team is dedicated to providing you with the best possible support.
          </p>
        </header>

        <div className="grid md:grid-cols-5 gap-12">
          <div className="md:col-span-3">
            <Card>
                <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>Our team typically responds within 24 business hours.</CardDescription>
                </CardHeader>
                <CardContent>
                <form className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="Your Name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="your@email.com" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Select name="subject">
                            <SelectTrigger id="subject">
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General Inquiry</SelectItem>
                                <SelectItem value="support">Technical Support</SelectItem>
                                <SelectItem value="billing">Billing Question</SelectItem>
                                <SelectItem value="partnership">Partnership</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea id="message" placeholder="Please describe your inquiry in detail..." className="min-h-[150px]" />
                    </div>
                    <Button type="submit" className="w-full">Send Message</Button>
                </form>
                </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Reach out to us directly through these channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                    <div className="flex items-start gap-4">
                        <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">General Inquiries</h3>
                            <p className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">support@traderchoice.com</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <LifeBuoy className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Technical Support</h3>
                            <p className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">tech@traderchoice.com</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Support Hotline</h3>
                            <p className="text-muted-foreground">(+1) 555-123-4567</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Headquarters</h3>
                            <p className="text-muted-foreground">123 Trading Floor, Market St, Finance City, 10101</p>
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
