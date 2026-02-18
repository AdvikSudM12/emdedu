import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Upload } from "lucide-react";

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    let avatarUrl: string | null = null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName || null, bio: bio || null, avatar_url: avatarUrl })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Academy</h1>
        </div>
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">Set up your profile</CardTitle>
            <CardDescription>Tell us a little about yourself to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl text-muted-foreground">👤</span>
                    )}
                  </div>
                </div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                    <Upload className="h-4 w-4" /> Upload photo
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea
                  id="bio"
                  placeholder="A little about you..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                  Skip for now
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Saving..." : "Continue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
