import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";

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
  
  return json({ user, locale, t: translations[locale].user.dataDeletion });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);
  const user = await getUser(request);

  if (!user) {
    return json({ error: "User not found" });
  }

  try {
    const { error } = await supabase.client.auth.admin.deleteUser(user.id);

    if (error) {
      return json({ error: error.message });
    }

    // Sign out the user after successful deletion
    await supabase.client.auth.signOut();
    return redirect("/login");
  } catch (error) {
    return json({ error: "Failed to delete account" });
  }
};

export default function UserDataDeletion() {
  const { user, t } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-400">{t.description}</p>
          </div>

          {/* Warning Card */}
          <Card className="bg-yellow-900/50 border-yellow-800">
            <CardHeader>
              <CardTitle className="text-xl text-yellow-200 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t.warning.title}
              </CardTitle>
              <CardDescription className="text-yellow-200/80">
                {t.warning.description}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Data Deletion Information */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">{t.information.title}</CardTitle>
              <CardDescription className="text-gray-400">
                {t.information.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">{t.information.whatWillBeDeleted}</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {t.information.deletionItems.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">{t.information.process.title}</h3>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300">
                    {t.information.process.steps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/user/profile">
                {t.actions.cancel}
              </Link>
            </Button>
            <Form method="post" className="flex-1">
              <Button 
                type="submit" 
                variant="destructive" 
                className="w-full"
              >
                {t.actions.confirmDeletion}
              </Button>
            </Form>
          </div>

          {/* Error Alert */}
          {actionData?.error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionData.error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
} 