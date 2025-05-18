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
import { Form } from "@remix-run/react";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
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

  // Get all categories
  const { data: categories, error: categoriesError } = await supabase.client
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (categoriesError) {
    throw new Error('Failed to fetch categories');
  }

  // Get current locale
  const locale = await getLocale(request);
  
  return json({ 
    user, 
    profile,
    categories,
    locale,
    t: translations[locale].admin
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const categoryId = formData.get("categoryId") as string;

  const supabase = createSupabaseServerClient(request);

  if (action === "delete") {
    const { error } = await supabase.client
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      return json({ error: "Failed to delete category" });
    }
  }

  return json({ success: true });
};

export default function AdminCategories() {
  const { user, profile, categories, locale, t } = useLoaderData<typeof loader>();

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
              <h1 className="text-3xl font-bold">{t.menu.categories.title}</h1>
              <p className="text-muted-foreground mt-1">
                Manage categories and their hierarchy
              </p>
            </div>
            <Button asChild>
              <Link to="/admin/categories/create">
                {t.menu.categories.create}
              </Link>
            </Button>
          </div>

          {/* Categories Table */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Parent Category</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category: Category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        {category.parent_id 
                          ? categories.find(c => c.id === category.parent_id)?.name || '-'
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(category.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/categories/${category.id}`}>
                              Edit
                            </Link>
                          </Button>
                          <Form method="post">
                            <input type="hidden" name="action" value="delete" />
                            <input type="hidden" name="categoryId" value={category.id} />
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              type="submit"
                              onClick={(e) => {
                                if (!confirm('Are you sure you want to delete this category?')) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </Form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 