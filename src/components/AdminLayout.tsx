import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/AdminSidebar";
import { BookOpen } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2 ml-auto">
              <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> Back to app
              </Link>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
