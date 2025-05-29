import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { signInWithPassword } from "~/lib/supabase/auth.supabase.server";
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
  const supabase = createSupabaseServerClient(request);
  const {
    data: { session },
  } = await supabase.client.auth.getSession();

  if (session) {
    return redirect("/user");
  }

  const locale = await getLocale(request);
  return json({ locale, t: translations[locale].auth.login });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const provider = formData.get("provider");

  // Commented out Google login for now
  /*
  if (provider === "google") {
    const supabase = createSupabaseServerClient(request);
    const { data, error } = await supabase.client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      return json({ error: error.message });
    }

    return redirect(data.url);
  }
  */

  // Handle email/password login
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return json({ error: "Email and password are required" });
  }

  return signInWithPassword(request, "/user", email, password);
};

export default function Login() {
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
                <Label htmlFor="email" className="text-gray-200">
                  {t.form.email}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.form.emailPlaceholder}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

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

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-gray-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? t.form.submitting : t.form.submit}
              </Button>

              {/* Commented out social login section
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900 px-2 text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <Form method="post">
                <input type="hidden" name="provider" value="google" />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 border-none"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t.form.googleLogin || "Continue with Google"}
                </Button>
              </Form>
              */}

              <div className="text-center text-sm text-gray-400">
                <p>{t.form.noAccount}</p>
                <a href="/register" className="text-white hover:underline">
                  {t.form.register}
                </a>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
