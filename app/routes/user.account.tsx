import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, Form, useActionData } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { redirect } from "@remix-run/node";
// import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { useToast } from "~/hooks/use-toast";
import { useEffect } from "react";
import Menu from "~/components/Menu";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type ActionData = {
  success?: boolean;
  error?: string;
  type?: 'profile' | 'password';
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

  // Get current locale
  const locale = "vi";
  // const locale = await getLocale(request);

  return json({ 
    user, 
    pages,
    locale, 
    menuT: translations[locale].landing,
    accountT: translations[locale].user.account,
    isLoggedIn: true 
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const formType = formData.get("formType") as string;
  const supabase = createSupabaseServerClient(request);

  if (formType === 'profile') {
    const displayName = formData.get("displayName") as string;

    // Update user metadata
    const { error: userError } = await supabase.client.auth.updateUser({
      data: { full_name: displayName },
    });

    if (userError) {
      return json<ActionData>({ error: "Failed to update display name", type: 'profile' });
    }

    // Get the current user's ID
    const { data: { session } } = await supabase.client.auth.getSession();
    if (!session?.user.id) {
      return json<ActionData>({ error: "User not found", type: 'profile' });
    }

    // Update the name in profiles table
    const { error: profileError } = await supabase.client
      .from('profiles')
      .update({ name: displayName })
      .eq('user_id', session.user.id);

    if (profileError) {
      console.error("Failed to update profile name:", profileError);
      return json<ActionData>({ error: "Failed to update profile name", type: 'profile' });
    }

    return json<ActionData>({ success: true, type: 'profile' });
  } else if (formType === 'password') {
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      return json<ActionData>({ 
        error: "New passwords do not match", 
        type: 'password' 
      });
    }

    if (newPassword.length < 6) {
      return json<ActionData>({ 
        error: "Password must be at least 6 characters long", 
        type: 'password' 
      });
    }

    // Update password
    const { error } = await supabase.client.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return json<ActionData>({ 
        error: "Failed to update password. Please try again.", 
        type: 'password' 
      });
    }

    return json<ActionData>({ success: true, type: 'password' });
  }

  return json<ActionData>({ error: "Invalid form type" });
};

export default function UserAccount() {
  const { user, pages, menuT, accountT, isLoggedIn } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { toast } = useToast();

  useEffect(() => {
    if (actionData?.success) {
      toast({
        title: "Thành công",
        description: actionData.type === 'profile' 
          ? "Cập nhật tên hiển thị thành công"
          : "Cập nhật mật khẩu thành công",
        className: "bg-gray-900 text-white border-gray-800",
      });
    } else if (actionData?.error) {
      toast({
        title: "Lỗi",
        description: actionData.error,
        variant: "destructive",
        className: "bg-red-900 text-white border-red-800",
      });
    }
  }, [actionData, toast]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Menu pages={pages} t={menuT} isLoggedIn={isLoggedIn} />
      <div className="container mx-auto px-4 py-8 max-w-4xl pt-20">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{accountT.title}</h1>
            <p className="text-gray-400">{accountT.description}</p>
          </div>

          {/* Profile Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">
                {accountT.sections.profile.title}
              </CardTitle>
              <CardDescription>
                {accountT.sections.profile.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="formType" value="profile" />
                <div className="space-y-2">
                  <Label htmlFor="displayName">Tên hiển thị</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    defaultValue={user?.user_metadata?.full_name || ""}
                    placeholder="Nhập tên hiển thị của bạn"
                    className="text-white bg-gray-800 border-gray-700 focus:border-gray-600"
                  />
                </div>
                <Button type="submit">Lưu thay đổi</Button>
              </Form>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">
                {accountT.sections.security.title}
              </CardTitle>
              <CardDescription>
                {accountT.sections.security.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="formType" value="password" />
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại"
                    className="text-white bg-gray-800 border-gray-700 focus:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    className="text-white bg-gray-800 border-gray-700 focus:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Xác nhận mật khẩu mới"
                    className="text-white bg-gray-800 border-gray-700 focus:border-gray-600"
                  />
                </div>
                <Button type="submit">Cập nhật mật khẩu</Button>
              </Form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">
                {accountT.sections.notifications.title}
              </CardTitle>
              <CardDescription>
                {accountT.sections.notifications.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-400">
                  Tính năng cài đặt thông báo sẽ sớm ra mắt...
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/user">{accountT.actions.back}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
