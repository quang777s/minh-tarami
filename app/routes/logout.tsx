import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { serialize } from "@supabase/ssr";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";

export const loader = async () => {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    serialize("sb-ksgakvcptahiqmhyailu-auth-token", "", {
      maxAge: 0, // This is the key to delete the cookie
      expires: new Date(0), // Ensure it expires immediately (optional, but good practice with maxAge=0)
      path: "/", // IMPORTANT: Must match the path the cookie was originally set with
      // domain: 'yourdomain.com', // Optional: if the cookie was set for a specific domain
      httpOnly: true, // IMPORTANT: Must match original settings if present
      sameSite: "lax", // IMPORTANT: Must match original settings if present
      secure: process.env.NODE_ENV === "production",
    })
  );
  return redirect("/login", { headers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);

  // Sign out from Supabase
  await supabase.client.auth.signOut();

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    serialize("sb-ksgakvcptahiqmhyailu-auth-token", "", {
      maxAge: 0, // This is the key to delete the cookie
      expires: new Date(0), // Ensure it expires immediately (optional, but good practice with maxAge=0)
      path: "/", // IMPORTANT: Must match the path the cookie was originally set with
      // domain: 'yourdomain.com', // Optional: if the cookie was set for a specific domain
      httpOnly: true, // IMPORTANT: Must match original settings if present
      sameSite: "lax", // IMPORTANT: Must match original settings if present
      secure: process.env.NODE_ENV === "production",
    })
  );

  // Redirect to home page
  return redirect("/login", {
    headers: headers,
  });
};
