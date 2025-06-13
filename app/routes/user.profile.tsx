import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, Form } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { serialize } from "@supabase/ssr";
import Menu from "~/components/Menu";
import wheelSpinData from "~/data/wheel-spin.json";

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
  if (!user) {
    throw redirect("/login");
  }

  // Get user's profile with signature
  const { data: profile } = await supabase.client
    .from("profiles")
    .select("signature")
    .eq("user_id", user.id)
    .single();

  // Get signature details if exists
  const signatureDetails = profile?.signature 
    ? wheelSpinData.find(item => item.name === profile.signature)
    : null;

  // Fetch pages for menu
  const { data: pages, error: pagesError } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("category_id", 1)
    .order("order_index", { ascending: true });

  if (pagesError || !pages) {
    throw new Error("Failed to fetch pages");
  }

  // Force Vietnamese locale for user profile
  const locale = "vi";

  return json({ 
    user, 
    pages,
    locale, 
    t: {
      ...translations[locale].user.profile,
      logo: translations[locale].landing.logo,
      menu: translations[locale].landing.menu
    },
    isLoggedIn: true,
    signatureDetails
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);
  await supabase.client.auth.signOut();
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    serialize("sb-ksgakvcptahiqmhyailu-auth-token", "", {
      maxAge: 0,
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  );
  return redirect("/login", {
    headers: headers,
  });
};

export default function UserProfile() {
  const { user, pages, t, isLoggedIn, signatureDetails } = useLoaderData<typeof loader>();

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

          {/* Profile Information Card */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">{t.information.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      {t.information.email}
                    </p>
                    <p className="font-medium">{user?.email}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      {t.information.userId}
                    </p>
                    <p className="font-medium">{user?.id}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      {t.information.name}
                    </p>
                    <p className="font-medium">
                      {user?.user_metadata?.full_name ||
                        t.information.notProvided}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      {t.information.emailVerified}
                    </p>
                    <p className="font-medium">
                      {user?.email_confirmed_at ? "Yes" : "No"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">
                      {t.information.lastSignIn}
                    </p>
                    <p className="font-medium">
                      {user?.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Signature Details Section */}
                {signatureDetails ? (
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 text-purple-300">Kết Quả Vòng Quay</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-400">Loại</p>
                        <p className="font-medium">{signatureDetails.type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-400">Vùng Hệ Thần Kinh</p>
                        <p className="font-medium">{signatureDetails.nervous_system_area}</p>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <p className="text-sm text-gray-400">Ghi Chú</p>
                        <p className="font-medium">{signatureDetails.note}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                    <h3 className="text-lg font-semibold mb-4 text-purple-300">Bạn Chưa Có Kết Quả Vòng Quay</h3>
                    <p className="text-gray-400 mb-6">Hãy tham gia vòng quay để khám phá kết quả của bạn!</p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Link to="/vong-quay">Quay Ngay</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/user">{t.actions.dashboard}</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/user/account">{t.actions.accountSettings}</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/admin/dashboard">{t.actions.adminDashboard}</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/user/data-deletion">{t.actions.dataDeletion}</Link>
            </Button>
            <Form method="post">
              <Button type="submit" variant="destructive" className="w-full">
                {t.actions.logout}
              </Button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
