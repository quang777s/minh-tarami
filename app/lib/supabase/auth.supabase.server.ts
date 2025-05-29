import { json, redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "./supabase.server";

export const signInWithPassword = async (
  request: Request,
  successRedirectPath: string,
  email: string,
  password: string
) => {
  const supabase = createSupabaseServerClient(request);
  const { error } = await supabase.client.auth.signInWithPassword({
    email,
    password,
  });

  if (!error) {
    throw redirect(successRedirectPath, { headers: supabase.headers });
  }

  return json({ error: error.message });
};

export const signOut = async (
  request: Request,
  successRedirectPath: string = "/"
) => {
  const supabase = createSupabaseServerClient(request);
  const { error } = await supabase.client.auth.signOut();

  if (!error) {
    throw redirect(successRedirectPath, { headers: supabase.headers });
  }

  return json({ error: error.message });
};

export const getUser = async (request: Request) => {
  const supabase = createSupabaseServerClient(request);
  const {
    data: { session },
  } = await supabase.client.auth.getSession();

  return session?.user || null;
};

export const isUserLoggedIn = async (request: Request) => {
  const supabase = createSupabaseServerClient(request);
  const { data: { user }, error } = await supabase.client.auth.getUser();

  if (error) {
    console.error("Error checking user authentication:", error);
    return false;
  }

  return !!user;
};
