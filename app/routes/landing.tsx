import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import type { OutputData } from "@editorjs/editorjs";
import EditorJSParser from "editorjs-parser";

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

type Page = {
  id: number;
  title: string;
  slug: string;
  featured_image: string | null;
  body: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);

  // Fetch pages (posts with category_id = 1)
  const { data: pages, error } = await supabase.client
    .from("tara_posts")
    .select("*")
    .eq("category_id", 1)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch pages");
  }

  return json({ pages });
};

// Initialize EditorJS parser
const parser = new EditorJSParser();

export default function Landing() {
  const { pages } = useLoaderData<typeof loader>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed w-full bg-black/50 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex-shrink-0">
              <img
                src="/logo/taramind-logo.jpg"
                alt="Taramind"
                className="h-8 w-auto"
              />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-gray-300 focus:outline-none"
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
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => handleMenuClick(page.slug)}
                    className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black/90 backdrop-blur-sm">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleMenuClick(page.slug)}
                  className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
                >
                  {page.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Slides */}
      <section className="relative h-screen w-full">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="absolute inset-0 bg-black/50"></div>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${page.featured_image || '/default-slide.jpg'})` }}
            ></div>
            <div className="relative z-10 h-full w-full flex items-center justify-center text-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 text-white">
                  {page.title}
                </h1>
                <div
                  className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-white px-4 max-w-3xl mx-auto prose prose-invert"
                  dangerouslySetInnerHTML={{ __html: parser.parse(JSON.parse(page.body)) }}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Fixed Copyright Bar */}
      <div className="fixed bottom-0 w-full bg-black/50 backdrop-blur-sm py-3 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white text-sm">© 2024 TARAMIND. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
} 