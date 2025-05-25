import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
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
import { Card, CardContent } from "~/components/ui/card";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type TaraPost = {
  id: number;
  title: string;
  slug: string;
  post_type: string;
  body: string;
  created_at: string;
  updated_at: string;
  publish_at: string;
  featured_image: string;
  category_id: number;
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

  // Get all tara_posts
  const { data: posts, error: postsError } = await supabase.client
    .from('tara_posts')
    .select(`
      *,
      tara_categories (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (postsError) {
    throw new Error('Failed to fetch posts');
  }

  // Get current locale
  const locale = await getLocale(request);
  
  return json({ 
    user, 
    profile,
    posts,
    locale,
    t: translations[locale].admin
  });
};

export default function AdminPosts() {
  const { user, profile, posts, locale, t } = useLoaderData<typeof loader>();

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
              <h1 className="text-2xl md:text-3xl font-bold">{t.menu.posts.title}</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Manage all posts and their content
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/admin/posts/create">
                {t.menu.posts.create}
              </Link>
            </Button>
          </div>

          {/* Posts List */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post: TaraPost & { tara_categories: { name: string } }) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell>{post.post_type}</TableCell>
                        <TableCell>{post.tara_categories?.name || '-'}</TableCell>
                        <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {post.publish_at 
                            ? new Date(post.publish_at).toLocaleDateString()
                            : 'Active'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/posts/${post.id}`}>
                                Edit
                              </Link>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this post?')) {
                                  // TODO: Implement delete functionality
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {posts.map((post: TaraPost & { tara_categories: { name: string } }) => (
                  <Card key={post.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Type: {post.post_type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Category: {post.tara_categories?.name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(post.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Published: {post.publish_at 
                            ? new Date(post.publish_at).toLocaleDateString()
                            : 'Draft'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link to={`/admin/posts/${post.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this post?')) {
                              // TODO: Implement delete functionality
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
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