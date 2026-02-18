import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Calendar, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  created_at: string;
}

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase
        .from("lessons")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        setLessons(data);
        const cats = [...new Set(data.map((l) => l.category))];
        setCategories(cats);
      }
      setLoading(false);
    };
    fetchLessons();
  }, []);

  const filtered = lessons.filter((l) => {
    const matchSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = !activeCategory || l.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lessons</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse all available learning materials</p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                !activeCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary hover:text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
          {lessons.length === 0 ? "No lessons available yet." : "No lessons match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lesson) => (
            <Link key={lesson.id} to={`/lessons/${lesson.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer h-full">
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
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-primary flex-shrink-0">
                      {lesson.category}
                    </span>
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
  );
}
