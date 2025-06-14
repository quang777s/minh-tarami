import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Menu from "~/components/Menu";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if user is logged in
  if (!(await isUserLoggedIn(request))) {
    return redirect("/login");
  }

  const supabase = createSupabaseServerClient(request);
  const { data: { session } } = await supabase.client.auth.getSession();

  if (!session) {
    return redirect("/login");
  }

  // Check if user has a signature
  const { data: profile } = await supabase.client
    .from("profiles")
    .select("signature")
    .eq("user_id", session.user.id)
    .single();

  // Fetch pages for menu
  const { data: pages, error: pagesError } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("category_id", 1)
    .order("order_index", { ascending: true });

  if (pagesError || !pages) {
    throw new Error("Failed to fetch pages");
  }

  // Force Vietnamese locale
  const locale = "vi";

  // If user has a signature, redirect to user dashboard
  if (profile?.signature) {
    return redirect("/user");
  }

  // If user doesn't have a signature, redirect to wheel spin
  return redirect("/vong-quay");
};

export default function LoginSuccess() {
  const { pages, t } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-black">
      <Menu pages={pages} t={t} isLoggedIn={true} />
      <div className="flex items-center justify-center p-4 pt-40">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white text-center">
              Đang chuyển hướng...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-center">
              Vui lòng đợi trong giây lát...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 