import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { Button } from "~/components/ui/button";
import { AdminMenu } from "~/components/admin-menu";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { useToast } from "~/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Check if user is logged in
  if (!(await isUserLoggedIn(request))) {
    throw redirect("/login");
  }

  // Get user data
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }

  // Get user's profile to check role
  const supabase = createSupabaseServerClient(request);
  const { data: profile, error } = await supabase.client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    throw redirect("/user");
  }

  // Check if user has admin role
  if (profile.role !== 'admin') {
    throw redirect("/user");
  }

  // Get the user being edited
  const { data: targetUser, error: targetUserError } = await supabase.client
    .from('profiles')
    .select('*')
    .eq('id', params.userId)
    .single();

  if (targetUserError || !targetUser) {
    throw redirect("/admin/users");
  }

  // Get current locale
  const locale = await getLocale(request);
  
  return json({ 
    user, 
    profile,
    targetUser,
    locale,
    t: translations[locale].admin
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const role = formData.get("role") as string;
  const phone = formData.get("phone") as string;

  const supabase = createSupabaseServerClient(request);

  const { error } = await supabase.client
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      role,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.userId);

  if (error) {
    return json({ error: "Failed to update user" });
  }

  return redirect("/admin/users");
};

export default function EditUser() {
  const { user, profile, targetUser, locale, t } = useLoaderData<typeof loader>();
  const { toast } = useToast();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Admin Menu */}
        <div className="md:block">
          <AdminMenu t={t} />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-3xl font-bold">Edit User</h1>
              <p className="text-muted-foreground mt-1">
                Update user information and role
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin/users">Back to Users</Link>
            </Button>
          </div>

          {/* Edit Form */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              <Form method="post" className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={targetUser.first_name || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={targetUser.last_name || ''}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue={targetUser.role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={targetUser.phone || ''}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" type="button" asChild>
                    <Link to="/admin/users">Cancel</Link>
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 