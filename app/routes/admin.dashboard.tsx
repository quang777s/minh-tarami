import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";
import { LanguageSwitcher } from "~/components/language-switcher";
import { AdminMenu } from "~/components/admin-menu";
import { getLocale, setLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if user is logged in
  if (!(await isUserLoggedIn(request))) {
    throw redirect("/login");
  }

  // Get user data
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }

  // Get user's profile to check role
  const supabase = createSupabaseServerClient(request);
  const { data: profile, error } = await supabase.client
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !profile) {
    throw redirect("/user");
  }

  // Check if user has admin role
  if (profile.role !== 'admin') {
    throw redirect("/user");
  }

  // Get current locale
  const locale = await getLocale(request);
  
  return json({ 
    user, 
    profile,
    locale,
    t: translations[locale].admin
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const locale = formData.get("locale") as string;
  
  if (locale) {
    return redirect("/admin", {
      headers: {
        "Set-Cookie": await setLocale(request, locale as any),
      },
    });
  }
  
  return null;
};

export default function AdminDashboard() {
  const { user, profile, locale, t } = useLoaderData<typeof loader>();
  const { toast } = useToast();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Admin Menu */}
        <div className="md:block">
          <AdminMenu t={t} />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-3xl font-bold">{t.title}</h1>
              <p className="text-muted-foreground mt-1">
                {t.welcome}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LanguageSwitcher currentLocale={locale} />
              <Button variant="outline" asChild>
                <Link to="/user">{t.navigation.userDashboard}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/user/profile">{t.navigation.myProfile}</Link>
              </Button>
            </div>
          </div>

          {/* Admin Information Card */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              <h2 className="text-xl font-semibold mb-4">{t.information.title}</h2>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.information.email}</p>
                    <p className="mt-1 break-all">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.information.userId}</p>
                    <p className="mt-1 break-all">{user?.id}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.information.role}</p>
                  <p className="mt-1">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {profile.role}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-card rounded-lg border shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">{t.quickActions.title}</h3>
              <div className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  asChild
                >
                  <Link to="/admin/users">
                    {t.quickActions.manageUsers}
                  </Link>
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: t.toast.comingSoon,
                      description: t.toast.underDevelopment,
                    });
                  }}
                >
                  {t.quickActions.systemSettings}
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: t.toast.comingSoon,
                      description: t.toast.underDevelopment,
                    });
                  }}
                >
                  {t.quickActions.viewLogs}
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">{t.systemStatus.title}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.systemStatus.databaseStatus}</p>
                  <p className="mt-1 text-green-600">{t.systemStatus.connected}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.systemStatus.lastUpdated}</p>
                  <p className="mt-1">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 