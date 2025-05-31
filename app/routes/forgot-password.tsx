import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);
  const { data: { session } } = await supabase.client.auth.getSession();

  if (session) {
    return redirect("/user");
  }

  const locale = await getLocale(request);
  return json({ locale, t: translations[locale].auth.forgotPassword });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return json({ error: "Email is required" });
  }

  const supabase = createSupabaseServerClient(request);
  const { error } = await supabase.client.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(request.url).origin}/reset-password`,
  });

  if (error) {
    return json({ error: error.message });
  }

  return json({ success: true });
};

export default function ForgotPassword() {
  const { t } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">{t.title}</CardTitle>
            <CardDescription className="text-gray-400">{t.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              {actionData?.error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{actionData.error}</AlertDescription>
                </Alert>
              )}

              {actionData?.success && (
                <Alert className="bg-green-900/50 border-green-800">
                  <AlertDescription>{t.successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">{t.form.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.form.emailPlaceholder}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-gray-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? t.form.submitting : t.form.submit}
              </Button>

              <div className="text-center text-sm text-gray-400">
                <a href="/login" className="text-white hover:underline">
                  {t.form.backToLogin}
                </a>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 