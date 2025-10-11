
import { AdminProvider } from '@/contexts/admin-provider';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <SidebarProvider>
         <Sidebar>
            <AdminSidebar />
         </Sidebar>
         <SidebarInset>
            {children}
        </SidebarInset>
      </SidebarProvider>
    </AdminProvider>
  );
}
