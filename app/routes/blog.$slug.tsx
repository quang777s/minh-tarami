import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { json } from "@remix-run/node";
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
    locale, 
    t: translations[locale].landing,
    isLoggedIn: !!session 
  });
};

export default function BlogPost() {
  const { blog, blogs, pages, locale, t, isLoggedIn } = useLoaderData<typeof loader>();

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
      <section className="relative min-h-screen w-full bg-black pt-10">
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
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 text-white text-center">
                {blog.title}
              </h1>
              {blog.published_at && (
                <p className="text-white/80 mb-8">
                  {new Date(blog.published_at).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              <div
                className="text-lg md:text-xl lg:text-xl mb-6 md:mb-8 text-white px-4 max-w-3xl mx-auto prose prose-invert pb-24"
                dangerouslySetInnerHTML={{
                  __html: blog.body,
                }}
              />
            </div>
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
