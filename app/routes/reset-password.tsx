import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/login");
  }

  const supabase = createSupabaseServerClient(request);

  const { data: verifyData, error: verifyError } =
    await supabase.client.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });

  if (verifyError) {
    return json({ error: "Invalid or expired reset token" });
  }

  const locale = await getLocale(request);
  return json(
    { locale, t: translations[locale].auth.resetPassword, token },
    { headers: supabase.headers }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return json({ error: "Reset token is missing" });
  }

  if (!password || !confirmPassword) {
    return json({ error: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return json({ error: "Passwords do not match" });
  }

  if (password.length < 6) {
    return json({ error: "Password must be at least 6 characters long" });
  }

  const supabase = createSupabaseServerClient(request);

  // Then update the password
  const { error } = await supabase.client.auth.updateUser({
    password: password,
  });

  if (error) {
    return json({ error: error.message });
  }

  return redirect("/login?message=Password has been reset successfully");
};

export default function ResetPassword() {
  const { t } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              {t.title}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              {actionData?.error && (
                <Alert
                  variant="destructive"
                  className="bg-red-900/50 border-red-800"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{actionData.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  {t.form.password}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t.form.passwordPlaceholder}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-200">
                  {t.form.confirmPassword}
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t.form.confirmPasswordPlaceholder}
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
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
