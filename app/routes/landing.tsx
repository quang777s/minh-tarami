import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
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

export const meta: MetaFunction = () => {
  return [
    { title: "Taramind - The Essence of Hospitality" },
    {
      name: "description",
      content:
        "Taramind - A Vietnamese-based lifestyle group that develops, owns, and operates a diversified portfolio of luxury dining, beverage, and nightlife entertainment venues.",
    },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);

  // Check if user is logged in
  const { data: { session } } = await supabase.client.auth.getSession();

  // Fetch pages (posts with category_id = 1)
  const { data: pages, error } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("category_id", 1)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch pages");
  }

  // Get current locale
  const locale = await getLocale(request);

  return json({ 
    pages, 
    locale, 
    t: translations[locale].landing,
    isLoggedIn: !!session 
  });
};

export default function Landing() {
  const { pages, locale, t, isLoggedIn } = useLoaderData<typeof loader>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Handle hash-based navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove the # symbol
    if (hash) {
      const slideIndex = pages.findIndex((page) => page.slug === hash);
      if (slideIndex !== -1) {
        setCurrentSlide(slideIndex);
      }
    }
  }, [pages]);

  useEffect(() => {
    // Set black background for landing page
    document.documentElement.classList.add("bg-black");
    document.body.classList.add("bg-black");

    // Cleanup function to remove black background when leaving the page
    return () => {
      document.documentElement.classList.remove("bg-black");
      document.body.classList.remove("bg-black");
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % pages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [pages.length]);

  const handleMenuClick = (slug: string) => {
    const slideIndex = pages.findIndex((page) => page.slug === slug);
    if (slideIndex !== -1) {
      setCurrentSlide(slideIndex);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Menu pages={pages} t={t} onMenuClick={handleMenuClick} isLoggedIn={isLoggedIn} />

      {/* Hero Section with Slides */}
      <section className="relative h-screen w-full bg-black">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-black/50"></div>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${
                  page.featured_image || "/default-slide.jpg"
                })`,
              }}
            ></div>
            <div className="relative z-10 h-full w-full flex items-center justify-center text-center pt-20 pb-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 text-white">
                  {page.title}
                </h1>
                <div
                  className="text-lg md:text-xl lg:text-xl mb-6 md:mb-8 text-white px-4 max-w-3xl mx-auto prose prose-invert pb-24"
                  dangerouslySetInnerHTML={{
                    __html: page.body,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
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
