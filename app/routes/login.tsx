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
import Menu from "~/components/Menu";

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

  // Force Vietnamese locale for guest users
  const locale = "vi";
  const { data: pages } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("category_id", 1)
    .order("order_index", { ascending: true });

  if (!pages) {
    throw new Error("Failed to fetch pages");
  }

  return json({ 
    locale, 
    pages, 
    t: {
      ...translations[locale].auth.login,
      logo: translations[locale].landing.logo,
      menu: translations[locale].landing.menu
    } 
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return json({ error: "Email và mật khẩu là bắt buộc" });
  }

  return signInWithPassword(request, "/user", email, password);
};

export default function Login() {
  const { t, pages } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-black">
      <Menu pages={pages} t={t} isLoggedIn={false} />
      <div className="flex items-center justify-center p-4 pt-40">
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
                  <div className="text-right">
                    <a href="/forgot-password" className="text-sm text-gray-400 hover:text-white hover:underline">
                      {t.form.forgotPassword}
                    </a>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white text-black hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t.form.submitting : t.form.submit}
                </Button>

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
    </div>
  );
}
