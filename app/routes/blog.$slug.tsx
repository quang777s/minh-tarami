import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import Menu from "~/components/Menu";
import BlogComments from "~/components/BlogComments";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
};

const getBreadcrumbAncestors = (
  category: Category,
  allCategories: Category[],
  ancestors: Category[] = []
): Category[] => {
  if (!category.parent_id) return ancestors;
  const parent = allCategories.find((c) => c.id === category.parent_id);
  if (parent) {
    return getBreadcrumbAncestors(parent, allCategories, [
      parent,
      ...ancestors,
    ]);
  }
  return ancestors;
};

type ActionData = {
  error?: string;
  success?: boolean;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);

  // Fetch session, blog post and pages in parallel
  // Fetch all categories for breadcrumbs
  const { data: categories } = await supabase.client
    .from("tara_categories")
    .select("*");

  const [sessionResult, blogResult, pagesResult, categoriesResult] =
    await Promise.all([
      supabase.client.auth.getSession(),
      supabase.client
        .from("tara_posts")
        .select("*")
        .neq("category_id", 1)
        .eq("slug", params.slug)
        .single(),
      supabase.client
        .from("tara_posts")
        .select("*")
        .eq("category_id", 1)
        .order("order_index", { ascending: true }),
      supabase.client.from("tara_categories").select("*").gt("id", 3),
    ]);

  if (blogResult.error || !blogResult.data) {
    throw new Error("Blog post not found");
  }

  if (pagesResult.error || !pagesResult.data) {
    throw new Error("Failed to fetch pages");
  }

  if (categoriesResult.error || !categoriesResult.data) {
    throw new Error("Failed to fetch categories");
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
      currentCategory: categoriesResult.data?.find(
        (c) => c.id === blogResult.data.category_id
      ),
      categories: categoriesResult.data,
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
  const { blog, pages, locale, t, isLoggedIn, currentCategory, categories } =
    useLoaderData<typeof loader>();

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
            <div className="max-w-7xl lg:w-[80rem] mx-auto px-4 sm:px-6 lg:px-8">
              {/* Breadcrumbs */}
              {currentCategory && (
                <div className="text-violet-100 flex gap-2 items-center flex-wrap mb-4">
                  <Link to="/blog" className="hover:text-violet-300">
                    Blog
                  </Link>
                  <span className="text-white/50 mx-2">{">"}</span>
                  {getBreadcrumbAncestors(currentCategory, categories).map(
                    (ancestor) => (
                      <span
                        key={ancestor.id}
                        className="flex items-center gap-2"
                      >
                        <Link
                          to={`/blog?category=${ancestor.id}`}
                          className="hover:text-violet-300"
                        >
                          {ancestor.name}
                        </Link>
                        <span className="text-white/50 mx-2">{">"}</span>
                      </span>
                    )
                  )}
                  <span className="text-violet-300">
                    {currentCategory.name}
                  </span>
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-violet-100 font-vietnamese">
                {blog.title}
              </h1>
              {blog.published_at && (
                <p className="text-violet-100 mb-8 font-vietnamese">
                  {new Date(blog.published_at).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              <div
                className="prose prose-invert prose-white max-w-none font-vietnamese text-violet-100"
                dangerouslySetInnerHTML={{
                  __html: blog.body,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Comments Section */}
      <BlogComments slug={blog.slug} isLoggedIn={isLoggedIn} locale={locale} />

      {/* Fixed Copyright Bar */}
      <div className="fixed bottom-0 w-full bg-black backdrop-blur-sm py-3 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-violet-100 text-sm">{t.copyright}</p>
        </div>
      </div>
    </div>
  );
}
