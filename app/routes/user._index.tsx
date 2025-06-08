import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { redirect } from "@remix-run/node";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import Menu from "~/components/Menu";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if user is logged in
  if (!(await isUserLoggedIn(request))) {
    throw redirect("/login");
  }

  const supabase = createSupabaseServerClient(request);

  // Get user data
  const user = await getUser(request);
  
  // Fetch pages for menu
  const { data: pages, error: pagesError } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("category_id", 1)
    .order("order_index", { ascending: true });

  if (pagesError || !pages) {
    throw new Error("Failed to fetch pages");
  }

  // Force Vietnamese locale for user dashboard
  const locale = "vi";
  
  return json({ 
    user, 
    pages,
    locale, 
    t: {
      ...translations[locale].user.dashboard,
      logo: translations[locale].landing.logo,
      menu: translations[locale].landing.menu
    },
    isLoggedIn: true 
  });
};

export default function UserDashboard() {
  const { user, pages, t, isLoggedIn } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-black text-white">
      <Menu pages={pages} t={t} isLoggedIn={isLoggedIn} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl pt-20">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-400">{t.description}</p>
          </div>

          {/* Quick Links */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">{t.quickLinks.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-auto py-4">
                  <Link to="/user/profile" className="flex flex-col items-center gap-2">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{t.quickLinks.profile}</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4">
                  <Link to="/user/account" className="flex flex-col items-center gap-2">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{t.quickLinks.account}</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4">
                  <Link to="/admin/dashboard" className="flex flex-col items-center gap-2">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span>{t.quickLinks.admin}</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">{t.recentActivity.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">{t.recentActivity.noActivity}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
