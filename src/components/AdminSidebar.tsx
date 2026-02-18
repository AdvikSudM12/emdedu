import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Lightbulb,
  MessageSquare,
  Users,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Lessons", href: "/admin/lessons", icon: BookOpen },
  { label: "Wiki", href: "/admin/wiki", icon: FileText },
  { label: "Prompts", href: "/admin/prompts", icon: Lightbulb },
  { label: "Questions", href: "/admin/questions", icon: MessageSquare },
  { label: "Users", href: "/admin/users", icon: Users },
];

export default function AdminSidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const isActive = (href: string, exact?: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <Sidebar className="border-r border-border bg-card w-56 flex-shrink-0">
      <SidebarHeader className="px-4 py-5">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground block">Academy</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarMenu>
          {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href, item.exact)
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "A"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{profile?.display_name || "Admin"}</p>
          </div>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
