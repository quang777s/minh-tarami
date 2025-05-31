import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, Form, useActionData } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { redirect } from "@remix-run/node";
import { getLocale } from "~/i18n/i18n.server";
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

  // Get user data
  const user = await getUser(request);

  // Get current locale
  const locale = await getLocale(request);

  return json({ user, locale, t: translations[locale].user.account });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const formType = formData.get("formType") as string;
  const supabase = createSupabaseServerClient(request);

  if (formType === 'profile') {
    const displayName = formData.get("displayName") as string;

    // Update user metadata
    const { error } = await supabase.client.auth.updateUser({
      data: { full_name: displayName },
    });

    if (error) {
      return json<ActionData>({ error: "Failed to update display name", type: 'profile' });
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
  const { user, t } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { toast } = useToast();

  useEffect(() => {
    if (actionData?.success) {
      toast({
        title: "Success",
        description: actionData.type === 'profile' 
          ? "Display name updated successfully"
          : "Password updated successfully",
        className: "bg-gray-900 text-white border-gray-800",
      });
    } else if (actionData?.error) {
      toast({
        title: "Error",
        description: actionData.error,
        variant: "destructive",
        className: "bg-red-900 text-white border-red-800",
      });
    }
  }, [actionData, toast]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-400">{t.description}</p>
          </div>

          {/* Profile Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">
                {t.sections.profile.title}
              </CardTitle>
              <CardDescription>
                {t.sections.profile.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="formType" value="profile" />
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    defaultValue={user?.user_metadata?.full_name || ""}
                    placeholder="Enter your display name"
                    className="text-white bg-gray-800 border-gray-700 focus:border-gray-600"
                  />
                </div>
                <Button type="submit">Save Changes</Button>
              </Form>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">
                {t.sections.security.title}
              </CardTitle>
              <CardDescription>
                {t.sections.security.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="formType" value="password" />
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                    className="text-white bg-gray-800 border-gray-700 focus:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    className="text-white bg-gray-800 border-gray-700 focus:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    className="text-white bg-gray-800 border-gray-700 focus:border-gray-600"
                  />
                </div>
                <Button type="submit">Update Password</Button>
              </Form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">
                {t.sections.notifications.title}
              </CardTitle>
              <CardDescription>
                {t.sections.notifications.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add notification settings form here */}
                <p className="text-gray-400">
                  Notification settings form coming soon...
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/user">{t.actions.back}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
