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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
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
    .eq('user_id', user.id)
    .single();

  if (error || !profile) {
    throw redirect("/user");
  }

  // Check if user has admin role
  if (profile.role !== 'admin') {
    throw redirect("/user");
  }

  // Get the category to edit
  const { data: category, error: categoryError } = await supabase.client
    .from('tara_categories')
    .select('*')
    .eq('id', params.categoryId)
    .single();

  if (categoryError || !category) {
    throw new Error('Category not found');
  }

  // Get all categories for parent selection
  const { data: categories, error: categoriesError } = await supabase.client
    .from('tara_categories')
    .select('*')
    .neq('id', category.id) // Exclude current category from parent options
    .order('name', { ascending: true });

  if (categoriesError) {
    throw new Error('Failed to fetch categories');
  }

  // Get current locale
  const locale = await getLocale(request);
  
  return json({ 
    user, 
    profile,
    category,
    categories,
    locale,
    t: translations[locale].admin
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const parentId = formData.get("parentId") as string;

  const supabase = createSupabaseServerClient(request);

  const { error } = await supabase.client
    .from('tara_categories')
    .update({
      name,
      parent_id: parentId === "none" ? null : parseInt(parentId),
    })
    .eq('id', params.categoryId);

  if (error) {
    return json({ error: "Failed to update category" });
  }

  return redirect("/admin/categories");
};

export default function EditCategory() {
  const { user, profile, category, categories, locale, t } = useLoaderData<typeof loader>();

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
              <h1 className="text-3xl font-bold">Edit Category</h1>
              <p className="text-muted-foreground mt-1">
                Update category details
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin/categories">
                Back to Categories
              </Link>
            </Button>
          </div>

          {/* Edit Category Form */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              <Form method="post" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      defaultValue={category.name}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentId">Parent Category (Optional)</Label>
                    <Select name="parentId" defaultValue={category.parent_id?.toString() || "none"}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map((cat: Category) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <Button variant="outline" asChild>
                    <Link to="/admin/categories">Cancel</Link>
                  </Button>
                  <Button type="submit">Update Category</Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 