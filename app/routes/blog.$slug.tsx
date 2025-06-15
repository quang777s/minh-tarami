import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import Menu from "~/components/Menu";
import BlogComments from "~/components/BlogComments";
import type { Comment } from "~/types/blog";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type ActionData = {
  error?: string;
  success?: boolean;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);

  // Fetch session, blog post and pages in parallel
  const [sessionResult, blogResult, pagesResult] = await Promise.all([
    supabase.client.auth.getSession(),
    supabase.client
      .from("tara_posts")
      .select("*")
      .eq("category_id", 2)
      .eq("slug", params.slug)
      .single(),
    supabase.client
      .from("tara_posts")
      .select("*")
      .eq("category_id", 1)
      .order("order_index", { ascending: true })
  ]);

  if (blogResult.error || !blogResult.data) {
    throw new Error("Blog post not found");
  }

  if (pagesResult.error || !pagesResult.data) {
    throw new Error("Failed to fetch pages");
  }

  // Get current locale
  const locale = await getLocale(request);

  return json(
    {
      blog: blogResult.data,
      pages: pagesResult.data,
      locale,
      t: translations[locale].landing,
      isLoggedIn: !!sessionResult.data.session,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=100, stale-while-revalidate=600",
      },
    }
  );
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);
  const formData = await request.formData();
  const commentText = formData.get("comment") as string;

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.client.auth.getSession();
  if (!session) {
    return json<ActionData>(
      { error: "Bạn cần đăng nhập để bình luận" },
      { status: 401 }
    );
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

    if (timeDiff < 60000) {
      // 60000ms = 1 minute
      const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
      return json<ActionData>(
        {
          error: `Vui lòng đợi ${secondsLeft} giây trước khi bình luận tiếp`,
        },
        { status: 429 }
      );
    }
  }

  // Get the blog post ID
  const { data: blog } = await supabase.client
    .from("tara_posts")
    .select("id")
    .eq("slug", params.slug)
    .single();

  if (!blog) {
    return json<ActionData>(
      { error: "Không tìm thấy bài viết" },
      { status: 404 }
    );
  }

  // Insert the comment
  const { error } = await supabase.client.from("tara_comments").insert({
    comment_text: commentText,
    post_id: blog.id,
    user_id: session.user.id,
  });

  if (error) {
    return json<ActionData>(
      { error: "Không thể đăng bình luận. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }

  return redirect(`/blog/${params.slug}`);
};

export default function BlogPost() {
  const { blog, pages, locale, t, isLoggedIn } = useLoaderData<typeof loader>();

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
      <section className="relative min-h-screen w-full">
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
      <BlogComments 
        slug={blog.slug}
        isLoggedIn={isLoggedIn} 
        locale={locale} 
      />

      {/* Fixed Copyright Bar */}
      <div className="fixed bottom-0 w-full bg-black backdrop-blur-sm py-3 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white text-sm">{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
