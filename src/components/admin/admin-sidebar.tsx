
'use client';

import {
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarMenuBadge,
  SidebarGroup,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Users, Bot, Signal, ArrowUpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '../auth/user-nav';

export function AdminSidebar() {
    const { logout } = useAuth();
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo />
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroup>
            <SidebarMenuItem>
              <SidebarMenuButton href="/admin" isActive>
                <Users />
                Users
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/admin">
                <Signal />
                Signals
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/admin">
                <ArrowUpCircle />
                Upgrades
                <SidebarMenuBadge>3</SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/admin">
                <Bot />
                AI Assistant
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className='flex items-center gap-2'>
            <UserNav />
             <button onClick={logout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
            </button>
        </div>
      </SidebarFooter>
    </>
  );
}
