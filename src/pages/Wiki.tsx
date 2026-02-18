import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface WikiArticle {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface CategoryGroup {
  category: string;
  articles: WikiArticle[];
}

export default function Wiki() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WikiArticle | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("wiki_articles")
      .select("*")
      .order("title")
      .then(({ data }) => {
        if (data) {
          setArticles(data);
          // Open all categories by default
          const cats = new Set(data.map((a) => a.category));
          setOpenCategories(cats);
          if (data.length > 0) setSelected(data[0]);
        }
        setLoading(false);
      });
  }, []);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.body.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: CategoryGroup[] = Object.values(
    filtered.reduce((acc, article) => {
      if (!acc[article.category]) acc[article.category] = { category: article.category, articles: [] };
      acc[article.category].articles.push(article);
      return acc;
    }, {} as Record<string, CategoryGroup>)
  );

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
        {/* Left sidebar */}
        <div className="w-56 flex-shrink-0 space-y-3">
          <h1 className="text-lg font-bold text-foreground">Wiki</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <nav className="space-y-1">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-6 rounded bg-muted animate-pulse" />)}
              </div>
            ) : grouped.length === 0 ? (
              <p className="text-xs text-muted-foreground">No articles found.</p>
            ) : (
              grouped.map((group) => (
                <div key={group.category}>
                  <button
                    onClick={() => toggleCategory(group.category)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
                  >
                    {group.category}
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 transition-transform",
                        openCategories.has(group.category) && "rotate-90"
                      )}
                    />
                  </button>
                  {openCategories.has(group.category) && (
                    <div className="ml-2 space-y-0.5">
                      {group.articles.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setSelected(a)}
                          className={cn(
                            "w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors",
                            selected?.id === a.id
                              ? "bg-secondary text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {a.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">
                  {selected.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Updated {new Date(selected.updated_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-6">{selected.title}</h1>
              <div className="prose max-w-none">
                <ReactMarkdown>{selected.body}</ReactMarkdown>
              </div>
            </div>
          ) : !loading && articles.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No articles yet. Admins can add articles from the admin panel.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
