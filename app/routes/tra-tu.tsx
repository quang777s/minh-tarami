import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
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

const RATE_LIMIT = {
  maxRequests: 20,
  timeWindow: 5 * 60 * 1000, // 5 minutes in milliseconds
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);

  // Check if user is logged in
  const { data: { session } } = await supabase.client.auth.getSession();

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
    pages, 
    locale, 
    t: translations[locale].landing,
    isLoggedIn: !!session
  });
};

export default function TraTu() {
  const { pages, locale, t, isLoggedIn } = useLoaderData<typeof loader>();
  const [searchWord, setSearchWord] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  useEffect(() => {
    // Set black background for dictionary page
    document.documentElement.classList.add("bg-black");
    document.body.classList.add("bg-black");

    // Cleanup function to remove black background when leaving the page
    return () => {
      document.documentElement.classList.remove("bg-black");
      document.body.classList.remove("bg-black");
    };
  }, []);

  const checkRateLimit = () => {
    const now = Date.now();
    const storedData = localStorage.getItem('dictionaryRateLimit');
    let rateLimitData = storedData ? JSON.parse(storedData) : { count: 0, timestamp: now };

    // Reset count if time window has passed
    if (now - rateLimitData.timestamp > RATE_LIMIT.timeWindow) {
      rateLimitData = { count: 0, timestamp: now };
    }

    // Check if rate limit is exceeded
    if (rateLimitData.count >= RATE_LIMIT.maxRequests) {
      const timeLeft = Math.ceil((RATE_LIMIT.timeWindow - (now - rateLimitData.timestamp)) / 1000);
      setRateLimitError(`Bạn đã vượt quá giới hạn tìm kiếm. Vui lòng đợi ${timeLeft} giây.`);
      return false;
    }

    // Update rate limit data
    rateLimitData.count += 1;
    localStorage.setItem('dictionaryRateLimit', JSON.stringify(rateLimitData));
    setRateLimitError(null);
    return true;
  };

  const handleSearch = async (word: string) => {
    if (!word.trim()) return;
    
    if (!checkRateLimit()) {
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const response = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dictionary result");
      }
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const headlines = doc.querySelectorAll(".mw-headline");
      const result = Array.from(headlines).map(h => h.textContent || "").join("\n");
      setResult(result);
    } catch (error) {
      console.error("Error fetching dictionary result:", error);
      setError("Không thể tìm kết quả. Vui lòng thử lại sau.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchWord);
  };

  return (
    <div className="min-h-screen bg-black">
      <Menu pages={pages} t={t} isLoggedIn={isLoggedIn} />

      {/* Dictionary Content */}
      <section className="relative min-h-screen w-full">
        <div className="relative">
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10 w-full flex justify-center pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:w-2/3">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white font-vietnamese">
                Tra từ điển
              </h1>

              {/* Search Form */}
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={searchWord}
                    onChange={(e) => setSearchWord(e.target.value)}
                    className="flex-1 px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                    placeholder="Nhập từ cần tra..."
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors duration-300 disabled:opacity-50"
                  >
                    {isSearching ? "Đang tìm..." : "Tìm kiếm"}
                  </button>
                </div>
              </form>

              {/* Rate Limit Error */}
              {rateLimitError && (
                <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
                  <p className="text-yellow-400">{rateLimitError}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="prose prose-invert prose-white max-w-none font-vietnamese text-white bg-black/50 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4">Kết quả cho từ "{searchWord}"</h2>
                  <div className="whitespace-pre-line">{result}</div>
                </div>
              )}
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