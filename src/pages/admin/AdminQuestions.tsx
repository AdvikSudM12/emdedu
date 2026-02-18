import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Trash2, EyeOff, Eye, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  title: string;
  body: string;
  author_id: string;
  is_hidden: boolean;
  created_at: string;
  display_name?: string;
}

export default function AdminQuestions() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchQuestions = async () => {
    const { data } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
    if (data) {
      const withNames = await Promise.all(
        data.map(async (q) => {
          const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", q.author_id).single();
          return { ...q, display_name: profile?.display_name || "User" };
        })
      );
      setQuestions(withNames);
    }
    setLoading(false);
  };
  useEffect(() => { fetchQuestions(); }, []);

  const toggleHide = async (q: Question) => {
    await supabase.from("questions").update({ is_hidden: !q.is_hidden }).eq("id", q.id);
    toast({ title: q.is_hidden ? "Question visible" : "Question hidden" });
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("questions").delete().eq("id", id);
    toast({ title: "Question deleted" });
    fetchQuestions();
  };

  const filtered = questions.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    (q.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Questions</h1>
        <p className="text-muted-foreground text-sm mt-1">Moderate community Q&A</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search questions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">No questions found.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Question</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Author</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filtered.map((q) => (
                <tr key={q.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground line-clamp-1">{q.title}</p>
                    {q.body && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{q.body}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{q.display_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.is_hidden ? "bg-muted text-muted-foreground" : "bg-secondary text-primary"
                    }`}>
                      {q.is_hidden ? "Hidden" : "Visible"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleHide(q)} title={q.is_hidden ? "Show" : "Hide"}>
                        {q.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete question?</AlertDialogTitle>
                            <AlertDialogDescription>All answers will also be deleted.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(q.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
