import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { json, redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import Menu from "~/components/Menu";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type Blog = {
  id: number;
  title: string;
  slug: string;
  featured_image: string | null;
  body: string;
  published_at: string | null;
};

type Page = {
  id: number;
  title: string;
  slug: string;
};

type Comment = {
  id: number;
  comment_text: string;
  created_at: string;
  user_id: string;
  user: {
    name: string;
  };
};

type ActionData = {
  error?: string;
  success?: boolean;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);

  // Check if user is logged in
  const { data: { session } } = await supabase.client.auth.getSession();

  // Fetch all blog posts for menu
  const { data: blogs, error: blogsError } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("category_id", 2)
    .order("order_index", { ascending: true });

  if (blogsError) {
    throw new Error("Failed to fetch blog posts");
  }

  // Fetch the specific blog post
  const { data: blog, error: blogError } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("category_id", 2)
    .eq("slug", params.slug)
    .single();

  if (blogError || !blog) {
    throw new Error("Blog post not found");
  }

  // Fetch comments for this blog post
  const { data: comments, error: commentsError } = await supabase.client
    .from("tara_comments")
    .select(`
      *,
      user:profiles (
        name
      )
    `)
    .eq("post_id", blog.id)
    .order("created_at", { ascending: false });

  if (commentsError) {
    console.error("Supabase comments query error:", commentsError);
    throw commentsError;
    throw new Error("Failed to fetch comments");
  }

  const { data: pages, error: pagesError } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("category_id", 1)
    .order("order_index", { ascending: true });

  if (pagesError || !pages) {
    throw new Error("Failed to fetch pages");
  }

  // Get current locale
  const locale = await getLocale(request);

  return json({ 
    blog, 
    blogs, 
    pages, 
    comments,
    locale, 
    t: translations[locale].landing,
    isLoggedIn: !!session 
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);
  const formData = await request.formData();
  const commentText = formData.get("comment") as string;

  // Check if user is logged in
  const { data: { session } } = await supabase.client.auth.getSession();
  if (!session) {
    return json<ActionData>({ error: "Bạn cần đăng nhập để bình luận" }, { status: 401 });
  }

  // Check for rate limiting - only allow one comment per minute
  const { data: recentComments } = await supabase.client
    .from("tara_comments")
    .select("created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recentComments && recentComments.length > 0) {
    const lastCommentTime = new Date(recentComments[0].created_at).getTime();
    const now = new Date().getTime();
    const timeDiff = now - lastCommentTime;
    
    if (timeDiff < 60000) { // 60000ms = 1 minute
      const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
      return json<ActionData>({ 
        error: `Vui lòng đợi ${secondsLeft} giây trước khi bình luận tiếp` 
      }, { status: 429 });
    }
  }

  // Get the blog post ID
  const { data: blog } = await supabase.client
    .from("tara_posts")
    .select("id")
    .eq("slug", params.slug)
    .single();

  if (!blog) {
    return json<ActionData>({ error: "Không tìm thấy bài viết" }, { status: 404 });
  }

  // Insert the comment
  const { error } = await supabase.client
    .from("tara_comments")
    .insert({
      comment_text: commentText,
      post_id: blog.id,
      user_id: session.user.id
    });

  if (error) {
    return json<ActionData>({ error: "Không thể đăng bình luận. Vui lòng thử lại sau." }, { status: 500 });
  }

  return redirect(`/blog/${params.slug}`);
};

export default function BlogPost() {
  const { blog, blogs, pages, comments, locale, t, isLoggedIn } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    // Set black background for blog page
    document.documentElement.classList.add("bg-black");
    document.body.classList.add("bg-black");

    // Cleanup function to remove black background when leaving the page
    return () => {
      document.documentElement.classList.remove("bg-black");
      document.body.classList.remove("bg-black");
    };
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Menu pages={pages} t={t} isLoggedIn={isLoggedIn} />

      {/* Blog Content */}
      <section className="relative min-h-screen w-full bg-dark pt-10">
        <div className="relative">
          <div className="absolute inset-0 bg-black/50"></div>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${
                blog.featured_image || "/default-slide.jpg"
              })`,
            }}
          ></div>
          <div className="relative z-10 w-full flex justify-center pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white font-vietnamese">
                {blog.title}
              </h1>
              {blog.published_at && (
                <p className="text-white mb-8 font-vietnamese">
                  {new Date(blog.published_at).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              <div
                className="prose prose-invert prose-white max-w-none font-vietnamese text-white"
                dangerouslySetInnerHTML={{
                  __html: blog.body,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Comments Section */}
      <section className="relative w-full bg-black py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8">Bình luận</h2>
          
          {/* Comment Form */}
          {isLoggedIn ? (
            <Form method="post" className="mb-8">
              <div className="mb-4">
                <textarea
                  name="comment"
                  rows={4}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                  placeholder="Viết bình luận của bạn..."
                  required
                />
              </div>
              {actionData?.error && (
                <p className="text-red-500 mb-4">{actionData.error}</p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors duration-300 disabled:opacity-50"
              >
                {isSubmitting ? "Đang đăng..." : "Đăng bình luận"}
              </button>
            </Form>
          ) : (
            <div className="mb-8 p-4 bg-black/50 rounded-lg">
              <p className="text-white">
                Vui lòng{" "}
                <Link to="/login" className="text-blue-400 hover:text-blue-300">
                  đăng nhập
                </Link>{" "}
                để bình luận.
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment: Comment) => (
              <div key={comment.id} className="bg-black/50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <p className="text-white font-medium">{comment.user.name}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(comment.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-white">{comment.comment_text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fixed Copyright Bar */}
      <div className="fixed bottom-0 w-full bg-black backdrop-blur-sm py-3 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white text-sm">{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
