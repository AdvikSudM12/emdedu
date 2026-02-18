import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    const [{ data: profileData, error: profileError }, { data: roleData, error: roleError }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    // If we get a 401/403 or "JWT expired" type error, the user no longer exists — sign out
    if (profileError?.code === "PGRST301" || roleError?.code === "PGRST301") {
      await supabase.auth.signOut();
      return;
    }

    setProfile(profileData ?? null);
    setIsAdmin(roleData?.some((r) => r.role === "admin") ?? false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfileAndRole(user.id);
  }, [user, fetchProfileAndRole]);

  useEffect(() => {
    // Listen to auth state changes — this fires on every auth event including Google OAuth redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Verify the user still exists in the database
          await fetchProfileAndRole(session.user.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }

        setLoading(false);
        initializedRef.current = true;
      }
    );

    // Fallback: if no auth event fires within 3s (e.g. no session at all), unblock UI
    const fallback = setTimeout(() => {
      if (!initializedRef.current) {
        setLoading(false);
        initializedRef.current = true;
      }
    }, 3000);

    // Periodically validate session while app is open (catches server-side user deletion)
    const sessionCheck = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
      }
    }, 30000); // check every 30 seconds

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
      clearInterval(sessionCheck);
    };
  }, [fetchProfileAndRole]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
