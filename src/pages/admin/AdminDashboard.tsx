import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, Lightbulb, MessageSquare, Users, HelpCircle } from "lucide-react";

interface Stats {
  users: number;
  lessons: number;
  wiki: number;
  prompts: number;
  questions: number;
}

const statItems = [
  { key: "users", label: "Total users", icon: Users, color: "text-primary bg-secondary" },
  { key: "lessons", label: "Lessons", icon: BookOpen, color: "text-primary bg-secondary" },
  { key: "wiki", label: "Wiki articles", icon: FileText, color: "text-primary bg-secondary" },
  { key: "prompts", label: "Prompts", icon: Lightbulb, color: "text-primary bg-secondary" },
  { key: "questions", label: "Open questions", icon: HelpCircle, color: "text-accent bg-secondary" },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, lessons: 0, wiki: 0, prompts: 0, questions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: users },
        { count: lessons },
        { count: wiki },
        { count: prompts },
        { count: questions },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("wiki_articles").select("*", { count: "exact", head: true }),
        supabase.from("prompts").select("*", { count: "exact", head: true }),
        supabase.from("questions").select("*", { count: "exact", head: true }).eq("is_hidden", false),
      ]);

      setStats({
        users: users ?? 0,
        lessons: lessons ?? 0,
        wiki: wiki ?? 0,
        prompts: prompts ?? 0,
        questions: questions ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your Academy platform</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statItems.map((item) => (
          <Card key={item.key} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl mb-3 ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">{loading ? "–" : stats[item.key]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
