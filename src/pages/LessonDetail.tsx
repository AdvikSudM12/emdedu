import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Calendar, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  category: string;
  created_at: string;
}

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [related, setRelated] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchLesson = async () => {
      const { data } = await supabase.from("lessons").select("*").eq("id", id).single();
      setLesson(data);
      if (data) {
        const { data: relatedData } = await supabase
          .from("lessons")
          .select("*")
          .eq("category", data.category)
          .neq("id", id)
          .limit(3);
        setRelated(relatedData ?? []);
      }
      setLoading(false);
    };
    fetchLesson();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-center text-muted-foreground py-20">Lesson not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/lessons" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to lessons
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">
            {lesson.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(lesson.created_at).toLocaleDateString()}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
      </div>

      {/* Video embed */}
      {lesson.video_url ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
          <iframe
            src={lesson.video_url}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            title={lesson.title}
          />
        </div>
      ) : lesson.thumbnail_url ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
          <img src={lesson.thumbnail_url} alt={lesson.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video w-full rounded-xl bg-muted flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30" />
        </div>
      )}

      {/* Description */}
      {lesson.description && (
        <div className="prose max-w-none">
          <p className="text-base text-foreground leading-relaxed">{lesson.description}</p>
        </div>
      )}

      {/* Related lessons */}
      {related.length > 0 && (
        <div className="pt-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Related lessons</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} to={`/lessons/${r.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {r.thumbnail_url ? (
                      <img src={r.thumbnail_url} alt={r.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-secondary">
                        <BookOpen className="h-6 w-6 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{r.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
