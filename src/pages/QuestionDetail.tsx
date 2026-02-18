import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Star, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface Question {
  id: string;
  title: string;
  body: string;
  author_id: string;
  created_at: string;
}

interface Answer {
  id: string;
  body: string;
  author_id: string;
  is_best: boolean;
  created_at: string;
  profile: Profile | null;
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

function UserAvatar({ profile, size = "sm" }: { profile: Profile | null; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div className={cn("rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center", sz)}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-medium text-muted-foreground">
          {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
        </span>
      )}
    </div>
  );
}

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState<Question | null>(null);
  const [authorProfile, setAuthorProfile] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    const [{ data: qData }, { data: aData }] = await Promise.all([
      supabase.from("questions").select("*").eq("id", id).single(),
      supabase.from("answers").select("*").eq("question_id", id).order("is_best", { ascending: false }).order("created_at"),
    ]);

    setQuestion(qData);

    if (qData) {
      const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", qData.author_id).single();
      setAuthorProfile(profile);
    }

    if (aData) {
      const withProfiles = await Promise.all(
        aData.map(async (a) => {
          const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", a.author_id).single();
          return { ...a, profile: profile ?? null };
        })
      );
      setAnswers(withProfiles as Answer[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSubmitting(true);

    const { error } = await supabase.from("answers").insert({
      question_id: id,
      author_id: user.id,
      body: answerBody,
    });

    if (error) {
      toast({ title: "Error posting answer", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Answer posted!" });
      setAnswerBody("");
      fetchData();
    }
    setSubmitting(false);
  };

  const markBest = async (answerId: string) => {
    // Reset all, then mark this one
    await supabase.from("answers").update({ is_best: false }).eq("question_id", id!);
    await supabase.from("answers").update({ is_best: true }).eq("id", answerId);
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!question) return <div className="text-center text-muted-foreground py-20">Question not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/qa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Q&A
      </Link>

      {/* Question */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h1 className="text-xl font-bold text-foreground mb-3">{question.title}</h1>
        {question.body && <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{question.body}</p>}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <UserAvatar profile={authorProfile} />
          <span className="text-xs text-muted-foreground">{authorProfile?.display_name || "User"}</span>
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo(question.created_at)}
          </span>
        </div>
      </div>

      {/* Answers */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" />
          {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
        </h2>

        <div className="space-y-3">
          {answers.map((answer) => (
            <div
              key={answer.id}
              className={cn(
                "rounded-xl border p-4 shadow-sm transition-colors",
                answer.is_best
                  ? "border-accent bg-secondary"
                  : "border-border bg-card"
              )}
            >
              {answer.is_best && (
                <div className="flex items-center gap-1 text-xs font-semibold text-accent mb-2">
                  <Star className="h-3.5 w-3.5 fill-current" /> Best answer
                </div>
              )}
              <p className="text-sm text-foreground leading-relaxed">{answer.body}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <UserAvatar profile={answer.profile} />
                <span className="text-xs text-muted-foreground">{answer.profile?.display_name || "User"}</span>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {timeAgo(answer.created_at)}
                </span>
                {user && user.id === question.author_id && !answer.is_best && (
                  <button
                    onClick={() => markBest(answer.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark as best
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post answer */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3">Post an answer</h3>
        <form onSubmit={handleAnswer} className="space-y-3">
          <div>
            <Label htmlFor="answer" className="sr-only">Answer</Label>
            <Textarea
              id="answer"
              placeholder="Write your answer..."
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? "Posting..." : "Post answer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
