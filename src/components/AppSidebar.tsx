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
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Lessons", href: "/lessons", icon: BookOpen },
  { label: "Wiki", href: "/wiki", icon: FileText },
  { label: "Prompts", href: "/prompts", icon: Lightbulb },
  { label: "Q&A", href: "/qa", icon: MessageSquare },
  { label: "My Profile", href: "/profile", icon: User },
];

export default function AppSidebar() {
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <Sidebar className="border-r border-border bg-card w-60 flex-shrink-0">
      <SidebarHeader className="px-4 py-5">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-base font-bold text-foreground">Academy</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
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

          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive("/admin")
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  Admin Panel
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.display_name || "User"}</p>
          </div>
          <button
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
