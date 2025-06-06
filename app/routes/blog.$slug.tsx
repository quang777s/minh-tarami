import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";

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

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);

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

  // Get current locale
  const locale = await getLocale(request);

  return json({ blog, blogs, pages, locale, t: translations[locale].landing });
};

export default function BlogPost() {
  const { blog, blogs, pages, locale, t } = useLoaderData<typeof loader>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      {/* Navigation */}
      <nav className="fixed w-full bg-black/50 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex-shrink-0">
              <Link to="/">
                <img
                  src="/logo/taramind-logo.jpg"
                  alt={t.logo.alt}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-gray-300 focus:outline-none"
                aria-label={isMenuOpen ? t.menu.close : t.menu.open}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                {pages?.map((page) => (
                  <Link
                    key={page.id}
                    to={`/landing#${page.slug}`}
                    className={`text-white hover:text-gray-300 px-2 py-1 text-sm}`}
                  >
                    {page.title}
                  </Link>
                ))}
                <Link
                  to={`/blog/nh-n-v-t`}
                  className={`text-white hover:text-gray-300 px-2 py-1 text-sm ${
                    blog.slug === blog.slug ? "font-bold" : ""
                  }`}
                >
                  Nhân Vật
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black backdrop-blur-sm">
              {pages?.map((page) => (
                <Link
                  key={page.id}
                  to={`/landing#${page.slug}`}
                  className={`block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm`}
                >
                  {page.title}
                </Link>
              ))}
              <Link
                to={`/blog/nh-n-v-t`}
                className={`block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm ${
                  blog.slug === "nh-n-v-t" ? "font-bold" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Nhân Vật
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
