import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  id: string;
  title: string;
  category: string;
  prompt_text: string;
  created_at: string;
}

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPrompts(data ?? []);
        setLoading(false);
      });
  }, []);

  const categories = [...new Set(prompts.map((p) => p.category))];

  const filtered = prompts.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt_text.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !activeCategory || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyPrompt = async (prompt: Prompt) => {
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(prompt.id);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prompt Library</h1>
        <p className="text-muted-foreground text-sm mt-1">Ready-to-use prompts for your workflows</p>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
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

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
          {prompts.length === 0 ? "No prompts yet." : "No prompts match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((prompt) => {
            const isExpanded = expanded.has(prompt.id);
            return (
              <Card key={prompt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground">{prompt.title}</h3>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-primary mt-1">
                        {prompt.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 font-mono leading-relaxed">
                    {isExpanded ? prompt.prompt_text : prompt.prompt_text.slice(0, 120) + (prompt.prompt_text.length > 120 ? "..." : "")}
                  </div>

                  <div className="flex items-center gap-2">
                    {prompt.prompt_text.length > 120 && (
                      <button
                        onClick={() => toggleExpand(prompt.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {isExpanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show more</>}
                      </button>
                    )}
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs gap-1.5"
                      onClick={() => copyPrompt(prompt)}
                    >
                      {copied === prompt.id ? (
                        <><Check className="h-3 w-3 text-primary" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3" /> Copy</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
