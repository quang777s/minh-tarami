import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { createServiceRoleClient } from "~/lib/supabase/supabase.service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/user";

  if (!code) {
    return redirect("/login?error=No code provided");
  }

  const supabase = createSupabaseServerClient(request);
  const { data: { session }, error: sessionError } = await supabase.client.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error("Auth callback error:", sessionError);
    return redirect("/login?error=Authentication failed");
  }

  if (session?.user) {
    try {
      // Check if profile exists
      const serviceClient = createServiceRoleClient();
      const { data: existingProfile, error: profileCheckError } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (profileCheckError && profileCheckError.code !== "PGRST116") { // PGRST116 is "no rows returned"
        console.error("Profile check error:", profileCheckError);
        return redirect("/login?error=Failed to check user profile");
      }

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await serviceClient
          .from("profiles")
          .insert([
            {
              user_id: session.user.id,
              email: session.user.email,
              role: "customer",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              phone: null
            },
          ]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
          return redirect("/login?error=Failed to create user profile");
        }
      }
    } catch (error) {
      console.error("Unexpected error during profile handling:", error);
      return redirect("/login?error=An unexpected error occurred");
    }
  }

  return redirect(next);
}; 