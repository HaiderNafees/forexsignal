"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "./user-management";
import { SignalManagement } from "./signal-management";
import { AiAssistantForm } from "./ai-assistant-form";
import { Users, Bot, Signal } from "lucide-react";

export function AdminTabs() {
  return (
    <Tabs defaultValue="users" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4"/>
            Users
        </TabsTrigger>
        <TabsTrigger value="signals">
            <Signal className="mr-2 h-4 w-4"/>
            Signals
        </TabsTrigger>
        <TabsTrigger value="ai-assistant">
            <Bot className="mr-2 h-4 w-4"/>
            AI Assistant
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <UserManagement />
      </TabsContent>
      <TabsContent value="signals">
        <SignalManagement />
      </TabsContent>
      <TabsContent value="ai-assistant">
        <AiAssistantForm />
      </TabsContent>
    </Tabs>
  );
}
