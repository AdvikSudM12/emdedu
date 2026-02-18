import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  category: string;
  created_at: string;
}

const emptyForm = { title: "", description: "", video_url: "", thumbnail_url: "", category: "" };

export default function AdminLessons() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchLessons = async () => {
    const { data } = await supabase.from("lessons").select("*").order("created_at", { ascending: false });
    setLessons(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLessons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditing(lesson);
    setForm({
      title: lesson.title,
      description: lesson.description || "",
      video_url: lesson.video_url || "",
      thumbnail_url: lesson.thumbnail_url || "",
      category: lesson.category,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description || null,
      video_url: form.video_url || null,
      thumbnail_url: form.thumbnail_url || null,
      category: form.category || "General",
    };

    const { error } = editing
      ? await supabase.from("lessons").update(payload).eq("id", editing.id)
      : await supabase.from("lessons").insert(payload);

    if (error) {
      toast({ title: "Error saving lesson", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Lesson updated" : "Lesson created" });
      setShowModal(false);
      fetchLessons();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting lesson", variant: "destructive" });
    } else {
      toast({ title: "Lesson deleted" });
      fetchLessons();
    }
  };

  const filtered = lessons.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lessons</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage lesson content</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Lesson
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search lessons..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
          {lessons.length === 0 ? "No lessons yet. Create one!" : "No results."}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filtered.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-12 rounded bg-muted overflow-hidden flex-shrink-0">
                        {lesson.thumbnail_url ? (
                          <img src={lesson.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-foreground">{lesson.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-primary">
                      {lesson.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(lesson.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(lesson)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete lesson?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(lesson.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Lesson" : "New Lesson"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Design" required />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>VK Video URL (embed)</Label>
              <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://vk.com/video_ext.php?..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
