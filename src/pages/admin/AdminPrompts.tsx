import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  id: string;
  title: string;
  category: string;
  prompt_text: string;
  created_at: string;
}

const emptyForm = { title: "", category: "", prompt_text: "" };

export default function AdminPrompts() {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPrompts = async () => {
    const { data } = await supabase.from("prompts").select("*").order("created_at", { ascending: false });
    setPrompts(data ?? []);
    setLoading(false);
  };
  useEffect(() => { fetchPrompts(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Prompt) => {
    setEditing(p);
    setForm({ title: p.title, category: p.category, prompt_text: p.prompt_text });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { title: form.title, category: form.category || "General", prompt_text: form.prompt_text };
    const { error } = editing
      ? await supabase.from("prompts").update(payload).eq("id", editing.id)
      : await supabase.from("prompts").insert(payload);

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: editing ? "Prompt updated" : "Prompt created" }); setShowModal(false); fetchPrompts(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("prompts").delete().eq("id", id);
    toast({ title: "Prompt deleted" });
    fetchPrompts();
  };

  const filtered = prompts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prompts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage prompt library</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Prompt</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search prompts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
          {prompts.length === 0 ? "No prompts yet." : "No results."}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Preview</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-primary">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs">
                    <span className="line-clamp-1 text-xs font-mono">{p.prompt_text}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
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
                            <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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
            <DialogTitle>{editing ? "Edit Prompt" : "New Prompt"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Writing" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prompt Text *</Label>
              <Textarea value={form.prompt_text} onChange={(e) => setForm({ ...form, prompt_text: e.target.value })} rows={6} className="font-mono text-sm" required />
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
