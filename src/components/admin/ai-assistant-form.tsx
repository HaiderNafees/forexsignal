"use client";

import React, { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { generateSuggestions } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Clipboard, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialState = {
  message: "",
  suggestion: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Generating..." : "Generate Suggestion"}
    </Button>
  );
}

export function AiAssistantForm() {
  const [state, formAction] = useFormState(generateSuggestions, initialState);
  const [taskType, setTaskType] = useState("suggestNewSignals");
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    if (state.suggestion) {
      navigator.clipboard.writeText(state.suggestion);
      setIsCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Signal Assistant</CardTitle>
          <CardDescription>
            Leverage AI to suggest new signals or analyze impact.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type</Label>
              <Select name="taskType" value={taskType} onValueChange={setTaskType}>
                <SelectTrigger id="taskType">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestNewSignals">Suggest New Signals</SelectItem>
                  <SelectItem value="summarizeImpact">Summarize Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {taskType === "suggestNewSignals" && (
              <div className="space-y-2">
                <Label htmlFor="marketTrends">Market Trends</Label>
                <Textarea
                  id="marketTrends"
                  name="marketTrends"
                  placeholder="e.g., 'Strong bullish sentiment on gold due to inflation fears...'"
                />
              </div>
            )}

            {taskType === "summarizeImpact" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="existingSignals">Existing Signals</Label>
                  <Textarea
                    id="existingSignals"
                    name="existingSignals"
                    placeholder="e.g., 'Active BUY on XAU/USD, SELL on EUR/JPY...'"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userGroups">User Groups</Label>
                  <Textarea
                    id="userGroups"
                    name="userGroups"
                    placeholder="e.g., 'Free users see 2 signals, Pro users see all. Focus on risk for free users.'"
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot /> AI-Generated Output
          </CardTitle>
          <CardDescription>
            The AI's response will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {state.suggestion ? (
            <div className="relative rounded-md border bg-muted p-4 h-full text-sm whitespace-pre-wrap font-code">
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={handleCopyToClipboard}
              >
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
              </Button>
              {state.suggestion}
            </div>
          ) : (
             <div className="flex items-center justify-center h-full rounded-md border border-dashed">
                <p className="text-muted-foreground">Waiting for input...</p>
             </div>
          )}
           {state.message && state.message !== "success" && (
            <p className="text-sm text-destructive mt-2">{state.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
