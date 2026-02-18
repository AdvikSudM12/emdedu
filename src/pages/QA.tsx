import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Plus, Clock, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Question {
  id: string;
  title: string;
  body: string;
  created_at: string;
  author_id: string;
  is_hidden: boolean;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
  answer_count: number;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function QA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    const { data: questionsData } = await supabase
      .from("questions")
      .select("*")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    if (questionsData) {
      // Fetch profiles and answer counts in parallel
      const withData = await Promise.all(
        questionsData.map(async (q) => {
          const [{ data: profileData }, { count }] = await Promise.all([
            supabase.from("profiles").select("display_name, avatar_url").eq("user_id", q.author_id).single(),
            supabase.from("answers").select("*", { count: "exact", head: true }).eq("question_id", q.id),
          ]);
          return { ...q, profiles: profileData ?? null, answer_count: count ?? 0 };
        })
      );
      setQuestions(withData as Question[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("questions")
      .insert({ title, body, author_id: user.id });

    if (error) {
      toast({ title: "Error posting question", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Question posted!" });
      setTitle("");
      setBody("");
      setShowModal(false);
      fetchQuestions();
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Q&A</h1>
          <p className="text-muted-foreground text-sm mt-1">Ask questions and get answers from the community</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Ask a Question
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
          No questions yet. Be the first to ask!
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => navigate(`/qa/${q.id}`)}
              className="w-full text-left rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                  {q.profiles?.avatar_url ? (
                    <img src={q.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {q.profiles?.display_name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground">{q.title}</h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{q.profiles?.display_name || "User"}</p>
                  {q.body && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{q.body}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {q.answer_count} {q.answer_count === 1 ? "answer" : "answers"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {timeAgo(q.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Ask Question Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="q-title">Title</Label>
              <Input
                id="q-title"
                placeholder="What's your question?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-body">Details <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="q-body"
                placeholder="Provide more context..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Posting..." : "Post question"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
