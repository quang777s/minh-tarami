import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useSubmit } from "@remix-run/react";
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
import { useState, useEffect } from "react";
import RichTextEditor from "~/components/RichTextEditor";
import { ImageSelector } from "~/components/editor/image-selector";
import { X } from "lucide-react";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type MediaFile = {
  name: string;
  id: string;
  created_at: string;
};

type Page = {
  id: number;
  title: string;
  slug: string;
  post_type: string;
  body: string;
  category_id: number | null;
  featured_image: string | null;
  published_at: string | null;
  order_index: number | null;
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
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) {
    throw redirect("/user");
  }

  // Check if user has admin role
  if (profile.role !== "admin") {
    throw redirect("/user");
  }

  // Get page data
  const { data: page, error: pageError } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("id", params.id)
    .eq("category_id", 1) // Ensure it's a page
    .single();

  if (pageError || !page) {
    throw new Error("Page not found");
  }

  // Get all media files
  const { data: media, error: mediaError } = await supabase.client.storage
    .from("taramind")
    .list();

  if (mediaError) {
    throw new Error("Failed to fetch media files");
  }

  // Get current locale
  const locale = await getLocale(request);

  return json({
    user,
    profile,
    page,
    media,
    locale,
    t: translations[locale].admin,
    supabaseUrl: process.env.SUPABASE_URL || "",
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle delete action
  if (intent === "delete") {
    const supabase = createSupabaseServerClient(request);
    const { error } = await supabase.client
      .from("tara_posts")
      .delete()
      .eq("id", params.id)
      .eq("category_id", 1); // Ensure it's a page

    if (error) {
      return json({ error: "Failed to delete page" });
    }

    return redirect("/admin/pages");
  }

  // Handle update action
  const title = formData.get("title") as string;
  let slug = formData.get("slug") as string;
  const post_type = formData.get("post_type") as string;
  const body = formData.get("body") as string;
  const featured_image = formData.get("featured_image") as string;
  const published_at = formData.get("published_at") as string;
  const order_index = parseInt(formData.get("order_index") as string) || 0;

  // Generate slug from title if empty
  if (!slug) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const supabase = createSupabaseServerClient(request);

  // Update page
  const { error } = await supabase.client
    .from("tara_posts")
    .update({
      title,
      slug,
      post_type,
      body,
      category_id: 1, // Ensure it stays a page
      featured_image,
      published_at: published_at || null,
      updated_at: new Date().toISOString(),
      order_index,
    })
    .eq("id", params.id)
    .eq("category_id", 1); // Ensure it's a page

  if (error) {
    return json({ error: "Failed to update page" });
  }

  return redirect("/admin/pages");
};

export default function EditPage() {
  const { user, profile, page, media, locale, t, supabaseUrl } =
    useLoaderData<typeof loader>();
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(
    page.featured_image || ""
  );
  const [slug, setSlug] = useState<string>(page.slug);
  const [content, setContent] = useState<string>(page.body);
  const submit = useSubmit();

  // Initialize editor with page content
  useEffect(() => {
    try {
      setContent(page.body);
    } catch (error) {
      console.error("Failed to parse page content:", error);
    }
  }, [page.body]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // If slug is empty, generate it from title
    if (!formData.get("slug")) {
      const title = formData.get("title") as string;
      formData.set("slug", generateSlug(title));
    }

    // Add editor content to form
    formData.set("body", content);

    submit(formData, { method: "post" });
  };

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageDialogOpen(false);
  };

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
              <h1 className="text-2xl md:text-3xl font-bold">Edit Page</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Edit page content and settings
              </p>
            </div>
          </div>

          {/* Edit Page Form */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              <Form method="post" className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      className="w-full"
                      defaultValue={page.title}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      className="w-full"
                      value={slug}
                      onChange={handleSlugChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post_type">Page Type</Label>
                  <Select
                    name="post_type"
                    required
                    defaultValue={page.post_type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select page type" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-white dark:bg-gray-950 border shadow-lg">
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="landing">Landing Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsImageDialogOpen(true)}
                    >
                      Select Image
                    </Button>
                    {selectedImage && (
                      <div className="relative">
                        <img
                          src={selectedImage}
                          alt="Featured"
                          className="h-20 w-20 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => setSelectedImage("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <input
                    type="hidden"
                    name="featured_image"
                    value={selectedImage}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="published_at">Publish Date (Optional)</Label>
                  <Input
                    id="published_at"
                    name="published_at"
                    type="datetime-local"
                    className="w-full"
                    defaultValue={
                      page.published_at
                        ? new Date(page.published_at).toISOString().slice(0, 16)
                        : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_index">Order Index</Label>
                  <Input
                    id="order_index"
                    name="order_index"
                    type="number"
                    className="w-full"
                    defaultValue={page.order_index || 0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <RichTextEditor value={content} onChange={setContent} />
                </div>

                <div className="flex justify-between gap-4">
                  <div className="flex gap-4">
                    <Button variant="outline" asChild>
                      <Link to="/admin/pages">Cancel</Link>
                    </Button>
                    <Button type="submit">Update Page</Button>
                  </div>
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <Button
                      variant="destructive"
                      type="submit"
                      onClick={(e) => {
                        if (
                          !confirm("Are you sure you want to delete this page?")
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Delete Page
                    </Button>
                  </Form>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>

      <ImageSelector
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        media={media}
        supabaseUrl={supabaseUrl}
        onSelect={handleImageSelect}
      />
    </div>
  );
}
