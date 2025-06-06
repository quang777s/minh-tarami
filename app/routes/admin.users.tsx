import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { Button } from "~/components/ui/button";
import { AdminMenu } from "~/components/admin-menu";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
  phone: string | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
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
    .eq('user_id', user.id)
    .single();


  if (error || !profile) {
    throw redirect("/user");
  }

  // Check if user has admin role
  if (profile.role !== 'admin') {
    throw redirect("/user");
  }

  // Get all users from profiles table
  const { data, error: usersError } = await supabase.client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (usersError) {
    throw new Error('Failed to fetch users');
  }

  const users = data as User[];

  // Get current locale
  const locale = await getLocale(request);
  
  return json({ 
    user, 
    profile,
    users,
    locale,
    t: translations[locale].admin
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const userId = formData.get("userId") as string;

  const supabase = createSupabaseServerClient(request);

  if (action === "updateRole") {
    const newRole = formData.get("role") as string;
    const { error } = await supabase.client
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      return json({ error: "Failed to update user role" });
    }
  }

  return json({ success: true });
};

export default function AdminUsers() {
  const { user, profile, users, locale, t } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
      <div className="grid gap-4 md:gap-6 md:grid-cols-[300px_1fr]">
        {/* Admin Menu */}
        <div className="md:block">
          <AdminMenu t={t} />
        </div>

        {/* Main Content */}
        <div className="space-y-4 md:space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{t.menu.users.all}</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                {t.descriptions.users}
              </p>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/users/${user.id}`}>
                              Edit
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {users.map((user: User) => (
                  <Card key={user.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                          {user.phone && (
                            <span className="text-sm text-muted-foreground">
                              {user.phone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={`/admin/users/${user.id}`}>
                          Edit User
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 