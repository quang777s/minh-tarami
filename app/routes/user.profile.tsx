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
  
  // Get current locale
  const locale = await getLocale(request);
  
  return json({ user, locale, t: translations[locale].user.profile });
};

export default function UserProfile() {
  const { user, t } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-400">{t.description}</p>
          </div>

          {/* Profile Information Card */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">{t.information.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">{t.information.email}</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">{t.information.userId}</p>
                    <p className="font-medium">{user?.id}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">{t.information.name}</p>
                    <p className="font-medium">
                      {user?.user_metadata?.full_name || t.information.notProvided}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">{t.information.emailVerified}</p>
                    <p className="font-medium">{user?.email_confirmed_at ? 'Yes' : 'No'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">{t.information.lastSignIn}</p>
                    <p className="font-medium">
                      {user?.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/user">
                {t.actions.dashboard}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/user/account">
                {t.actions.accountSettings}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/admin/dashboard">
                {t.actions.adminDashboard}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
