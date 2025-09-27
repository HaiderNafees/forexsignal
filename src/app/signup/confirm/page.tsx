
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";
import Link from "next/link";

export default function SignupConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 pt-24">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <MailCheck className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="font-headline text-2xl">Account Created!</CardTitle>
          <CardDescription>
            Your account has been successfully created. You can now log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            In a real application, you would receive an email to confirm your account before you can log in.
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
