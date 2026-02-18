import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, FileText, MessageSquare, Calendar } from "lucide-react";

interface Stats {
  lessonsCount: number;
  wikiCount: number;
  unansweredCount: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  created_at: string;
}

function CategoryPill({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">
      {category}
    </span>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ lessonsCount: 0, wikiCount: 0, unansweredCount: 0 });
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { count: lessonsCount },
        { count: wikiCount },
        { data: lessons },
        { count: unansweredCount },
      ] = await Promise.all([
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("wiki_articles").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*").order("created_at", { ascending: false }).limit(4),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("is_hidden", false),
      ]);

      setStats({
        lessonsCount: lessonsCount ?? 0,
        wikiCount: wikiCount ?? 0,
        unansweredCount: unansweredCount ?? 0,
      });
      setRecentLessons(lessons ?? []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const greetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "☀️";
    if (hour < 18) return "👋";
    return "🌙";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome card */}
      <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold">
          {greetingEmoji()} Hello, {profile?.display_name || "there"}!
        </h1>
        <p className="mt-1 text-primary-foreground/80 text-sm">
          Welcome back to Academy. Here's what's happening today.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{loading ? "–" : stats.lessonsCount}</p>
              <p className="text-xs text-muted-foreground">Total lessons</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{loading ? "–" : stats.wikiCount}</p>
              <p className="text-xs text-muted-foreground">Wiki articles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <MessageSquare className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{loading ? "–" : stats.unansweredCount}</p>
              <p className="text-xs text-muted-foreground">Unanswered questions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent lessons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent lessons</h2>
          <Link to="/lessons" className="text-sm text-primary hover:underline font-medium">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : recentLessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            No lessons yet. Admins can add lessons from the admin panel.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recentLessons.map((lesson) => (
              <Link key={lesson.id} to={`/lessons/${lesson.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {lesson.thumbnail_url ? (
                      <img
                        src={lesson.thumbnail_url}
                        alt={lesson.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-secondary">
                        <BookOpen className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-1">{lesson.title}</h3>
                      <CategoryPill category={lesson.category} />
                    </div>
                    {lesson.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(lesson.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
