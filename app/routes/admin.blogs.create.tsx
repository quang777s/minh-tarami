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
import { useState } from "react";
import { RichTextEditor } from "~/components/editor/rich-text-editor";
import { ImageSelector } from "~/components/editor/image-selector";
import type { OutputData } from "@editorjs/editorjs";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type MediaFile = {
  name: string;
  id: string;
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
    media,
    locale,
    t: translations[locale].admin,
    supabaseUrl: process.env.SUPABASE_URL || "",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
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

  // Create new blog post (post with category_id = 2)
  const { error } = await supabase.client.from("tara_posts").insert({
    title,
    slug,
    post_type,
    body,
    category_id: 2, // Set category_id to 2 for blog posts
    featured_image,
    published_at: published_at || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_index
  });

  if (error) {
    return json({ error: "Failed to create blog post" });
  }

  return redirect("/admin/blogs");
};

export default function CreateBlog() {
  const { user, profile, media, locale, t, supabaseUrl } =
    useLoaderData<typeof loader>();
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [editorData, setEditorData] = useState<OutputData>();
  const submit = useSubmit();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // If slug is empty, generate it from title
    if (!formData.get("slug")) {
      const title = formData.get("title") as string;
      formData.set("slug", generateSlug(title));
    }

    // Add editor data to form
    if (editorData) {
      formData.set("body", JSON.stringify(editorData));
    } else {
      // If no editor data, set empty content
      formData.set("body", JSON.stringify({
        time: Date.now(),
        blocks: [],
        version: "2.24.3"
      }));
    }
    
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
              <h1 className="text-2xl md:text-3xl font-bold">
                Create New Blog Post
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Create a new blog post with rich content
              </p>
            </div>
          </div>

          {/* Create Blog Form */}
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
                  <Label htmlFor="post_type">Post Type</Label>
                  <Select name="post_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select post type" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-white dark:bg-gray-950 border shadow-lg">
                      <SelectItem value="post">Blog Post</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
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
                      <img
                        src={selectedImage}
                        alt="Featured"
                        className="h-20 w-20 object-cover rounded"
                      />
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_index">Order Index</Label>
                  <Input
                    id="order_index"
                    name="order_index"
                    type="number"
                    className="w-full"
                    defaultValue="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <RichTextEditor 
                    onChange={setEditorData} 
                    initialData={{
                      time: Date.now(),
                      blocks: [],
                      version: "2.24.3"
                    }}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" asChild>
                    <Link to="/admin/blogs">Cancel</Link>
                  </Button>
                  <Button type="submit">Create Blog Post</Button>
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