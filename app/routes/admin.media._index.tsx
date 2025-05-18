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
import { Form } from "@remix-run/react";
import { Card, CardContent } from "~/components/ui/card";
import { X } from "lucide-react";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type Media = {
  id: string;
  name: string;
  url: string;
  created_at: string;
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

  // Get all media files
  const { data: media, error: mediaError } = await supabase.client
    .storage
    .from('post-medias')
    .list();

  if (mediaError) {
    throw new Error('Failed to fetch media files');
  }

  // Get current locale
  const locale = await getLocale(request);
  
  return json({ 
    user, 
    profile,
    media,
    locale,
    t: translations[locale].admin,
    supabaseUrl: process.env.SUPABASE_URL
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const mediaId = formData.get("mediaId") as string;

  const supabase = createSupabaseServerClient(request);

  if (action === "delete") {
    const { error } = await supabase.client
      .storage
      .from('post-medias')
      .remove([mediaId]);

    if (error) {
      return json({ error: "Failed to delete media file" });
    }
  }

  return json({ success: true });
};

export default function AdminMedia() {
  const { user, profile, media, locale, t, supabaseUrl } = useLoaderData<typeof loader>();

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
              <h1 className="text-2xl md:text-3xl font-bold">{t.menu.media.library}</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Manage your media files
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/admin/media/upload">
                {t.menu.media.upload}
              </Link>
            </Button>
          </div>

          {/* Media Grid */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {media.map((file) => (
                  <Card key={file.id} className="group relative">
                    <CardContent className="p-2">
                      <div className="aspect-square relative rounded-md overflow-hidden">
                        <img
                          src={`${supabaseUrl}/storage/v1/object/public/post-medias/${file.name}`}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Form method="post" className="absolute top-2 right-2">
                            <input type="hidden" name="action" value="delete" />
                            <input type="hidden" name="mediaId" value={file.name} />
                            <Button
                              variant="destructive"
                              size="icon"
                              type="submit"
                              className="h-8 w-8"
                              onClick={(e) => {
                                if (!confirm('Are you sure you want to delete this file?')) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </Form>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
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