
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MailCheck } from "lucide-react";
import Link from "next/link";

export default function SignupConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 pt-24">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
           <div className="flex justify-center mb-4">
            <MailCheck className="h-16 w-16 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
