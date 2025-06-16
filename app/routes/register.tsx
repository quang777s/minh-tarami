import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { createServiceRoleClient } from "~/lib/supabase/supabase.service.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
  const { data: { session } } = await supabase.client.auth.getSession();

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
      ...translations[locale].auth.register,
      logo: translations[locale].landing.logo,
      menu: translations[locale].landing.menu
    }
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const fullName = formData.get("name") as string;
  const supabase = createSupabaseServerClient(request);

  if (password !== confirmPassword) {
    return json({ error: "Mật khẩu không khớp" });
  }

  // Validate password strength
  if (password.length < 6) {
    return json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
  }

  const { data: authData, error: signUpError } = await supabase.client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback?type=signup`,
      data: {
        full_name: fullName
      }
    },
  });

  if (signUpError) {
    return json({ error: signUpError.message });
  }

  if (authData.user) {
    try {
      // Create profile record using service role client
      const serviceClient = createServiceRoleClient();

      const { error: profileError } = await serviceClient
        .from("profiles")
        .insert([
          {
            user_id: authData.user.id,
            email: email,
            name: fullName,
            role: "customer",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            phone: null
          },
        ]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Try to delete the auth user since profile creation failed
        await supabase.client.auth.admin.deleteUser(authData.user.id);
        return json({ error: `Không thể tạo hồ sơ người dùng: ${profileError.message}` });
      }
    } catch (error) {
      console.error("Unexpected error during profile creation:", error);
      return json({ error: "Đã xảy ra lỗi không mong muốn khi tạo hồ sơ" });
    }
  }

  const successMessage = encodeURIComponent("Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản của bạn.");
  return redirect(`/login?message=${successMessage}`);
};

export default function Register() {
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

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-200">{t.form.name}</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={t.form.namePlaceholder}
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200">{t.form.password}</Label>
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
                  <Label htmlFor="confirmPassword" className="text-gray-200">{t.form.confirmPassword}</Label>
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

                <div className="text-center text-sm text-gray-400">
                  <p>{t.form.hasAccount}</p>
                  <a href="/login" className="text-white hover:underline">
                    {t.form.login}
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
