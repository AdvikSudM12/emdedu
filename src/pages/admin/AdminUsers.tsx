import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  email?: string;
  role: "admin" | "user";
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at");
    if (profiles) {
      const withRoles = await Promise.all(
        profiles.map(async (p) => {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", p.user_id);
          const isAdmin = roles?.some((r) => r.role === "admin") ?? false;
          return { ...p, role: isAdmin ? "admin" : "user" } as UserRow;
        })
      );
      setUsers(withRoles);
    }
    setLoading(false);
  };
  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId: string, newRole: "admin" | "user") => {
    // Remove all existing roles for this user
    await supabase.from("user_roles").delete().eq("user_id", userId);
    // Insert new role
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) {
      toast({ title: "Error changing role", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Role changed to ${newRole}` });
      fetchUsers();
    }
  };

  const filtered = users.filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage user roles and accounts</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">No users found.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            {u.display_name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-foreground">{u.display_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={u.role} onValueChange={(v) => changeRole(u.user_id, v as "admin" | "user")}>
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
