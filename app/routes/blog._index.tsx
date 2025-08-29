import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import Menu from "~/components/Menu";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  children: Category[];
  blogs: Blog[];
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

type Blog = {
  id: number;
  title: string;
  slug: string;
  featured_image: string | null;
  published_at: string | null;
  excerpt?: string;
  post_type: string;
};

type Page = {
  id: number;
  title: string;
  slug: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("category");

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.client.auth.getSession();

  // Fetch category structure
  const { data: categories, error: categoriesError } = await supabase.client
    .from("tara_categories")
    .select("*")
    .gt("id", 3)
    .order("name");

  if (categories && categoriesError) {
    throw new Error("Failed to fetch categories");
  }

  // Build category tree
  const buildCategoryTree = (parentId: number | null = null): Category[] => {
    return categories
      .filter((c) => c.parent_id === parentId)
      .map((category) => ({
        ...category,
        children: buildCategoryTree(category.id),
        blogs: [],
      }));
  };

  let currentCategory: Category | undefined;
  let categoryTree: Category[] = [];
  let blogs: Blog[] = [];

  if (categoryId) {
    // Get current category details
    currentCategory = categories.find((c) => c.id === Number(categoryId));

    // Get blogs for current category
    const { data: categoryBlogs, error } = await supabase.client
      .from("tara_posts")
      .select("*")
      .eq("category_id", categoryId)
      .order("published_at", { ascending: false });

    if (!error) {
      blogs = categoryBlogs;
    }

    // Get child categories
    categoryTree = buildCategoryTree(Number(categoryId));
  } else {
    // Get root categories (no parent)
    categoryTree = buildCategoryTree(null);
  }

  // Fetch pages for menu
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
    blogs,
    pages,
    locale,
    t: translations[locale].landing,
    isLoggedIn: !!session,
    currentCategory,
    categoryTree,
    categories,
  });
};

export default function BlogList() {
  const {
    blogs,
    pages,
    locale,
    t,
    isLoggedIn,
    currentCategory,
    categoryTree,
    categories,
  } = useLoaderData<typeof loader>();

  useEffect(() => {
    // Set black background for blog page
    document.documentElement.classList.add("bg-dark");
    document.body.classList.add("bg-dark");

    // Cleanup function to remove black background when leaving the page
    return () => {
      document.documentElement.classList.remove("bg-black");
      document.body.classList.remove("bg-black");
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark">
      <Menu pages={pages} t={t} isLoggedIn={isLoggedIn} />

      {/* Blog List Content */}
      <section className="relative min-h-screen w-full bg-dark pt-24 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-white text-center">
            {currentCategory ? currentCategory.name : "Blog"}
          </h1>

          {/* Breadcrumbs */}
          {currentCategory && (
            <div className="mb-8 text-gray-400 flex gap-2 justify-center items-center flex-wrap">
              <Link to="/blog" className="hover:text-white">
                Blog
              </Link>
              <span className="text-white/50 mx-2">{">"}</span>
              {getBreadcrumbAncestors(currentCategory, categories).map(
                (ancestor) => (
                  <span key={ancestor.id} className="flex items-center gap-2">
                    <Link
                      to={`/blog?category=${ancestor.id}`}
                      className="hover:text-white"
                    >
                      {ancestor.name}
                    </Link>
                    <span className="text-white/50 mx-2">{">"}</span>
                  </span>
                )
              )}
              <span className="text-white">{currentCategory.name}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Category Cards */}
            {categoryTree.map((category: Category) => (
              <div
                key={category.id}
                className="bg-black/50 p-6 rounded-xl hover:bg-black/70 transition-colors"
              >
                <Link
                  to={`/blog?category=${category.id}`}
                  className="block space-y-4"
                >
                  <h2 className="text-xl font-bold text-white">
                    {category.name}
                  </h2>

                  {/* Subcategories */}
                  {category.children.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {category.children.map((child: Category) => (
                          <span
                            key={child.id}
                            className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm"
                          >
                            {child.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            ))}

            {/* Blog List */}
            {blogs.length > 0 && (
              <div className="md:col-span-2 lg:col-span-3 space-y-4">
                {blogs.map((blog) => (
                  <Link
                    key={blog.id}
                    to={`/blog/${blog.slug}`}
                    className="group flex items-center gap-4 bg-black/50 p-3 rounded-lg hover:bg-black/70 transition-all duration-200"
                  >
                    <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
                      <img
                        src={blog.featured_image || "/galaxy.jpg"}
                        alt={blog.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />
                    </div>

                    <div>
                      <div className="flex items-baseline gap-3">
                        <h2 className="text-base font-medium text-white group-hover:text-gray-300 line-clamp-1">
                          {blog.title}
                        </h2>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full capitalize">
                          {blog.post_type}
                        </span>
                      </div>
                      {blog.published_at && (
                        <div className="text-xs text-gray-500">
                          {new Date(blog.published_at).toLocaleDateString(
                            locale,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
