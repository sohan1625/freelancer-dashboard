import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface DashboardLayoutProps {
  title: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function DashboardLayout({ title, children, headerActions }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground" />
              <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
            </div>
            {headerActions && <div>{headerActions}</div>}
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
