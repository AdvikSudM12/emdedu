import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // This function uses the SERVICE_ROLE key — only callable with a valid secret token
    const authHeader = req.headers.get("Authorization");
    const setupToken = Deno.env.get("ADMIN_SETUP_TOKEN");

    // Allow either a valid setup token (for first bootstrap) OR an existing admin
    const isBootstrap = setupToken && authHeader === `Bearer ${setupToken}`;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let callerIsAdmin = false;

    if (!isBootstrap) {
      // Verify via JWT that caller is admin
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
        { global: { headers: { Authorization: authHeader ?? "" } } }
      );
      const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      callerIsAdmin = roles?.some((r) => r.role === "admin") ?? false;
      if (!callerIsAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    const { user_id, action } = await req.json();
    if (!user_id || !["grant", "revoke"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid payload. Need user_id and action: grant|revoke" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "grant") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", "admin");
      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
