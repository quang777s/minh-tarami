import { Link, useLocation } from "@remix-run/react";
import { useState } from "react";

type Page = {
  id: number;
  title: string;
  slug: string;
};

type MenuProps = {
  pages: Page[];
  t: {
    logo?: {
      alt: string;
    };
    menu?: {
      open: string;
      close: string;
    };
    auth?: {
      login: {
        title: string;
        description: string;
        form: {
          email: string;
          emailPlaceholder: string;
          password: string;
          passwordPlaceholder: string;
          submit: string;
          submitting: string;
          noAccount: string;
          register: string;
          forgotPassword: string;
        };
      };
      register: {
        title: string;
        description: string;
        form: {
          name: string;
          namePlaceholder: string;
          email: string;
          emailPlaceholder: string;
          password: string;
          passwordPlaceholder: string;
          confirmPassword: string;
          confirmPasswordPlaceholder: string;
          submit: string;
          submitting: string;
          hasAccount: string;
          login: string;
        };
      };
    };
  };
  onMenuClick?: (slug: string) => void;
  isLoggedIn?: boolean;
};

export default function Menu({ pages, t, onMenuClick, isLoggedIn }: MenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed w-full bg-black/50 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <div className="flex-shrink-0">
            <Link to="/">
              <img
                src="/logo/taramind-logo.jpg"
                alt={t.logo?.alt || "Taramind Logo"}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-gray-300 focus:outline-none"
              aria-label={
                isMenuOpen
                  ? t.menu?.close || "Close menu"
                  : t.menu?.open || "Open menu"
              }
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
              <Link
                to={`/`}
                className={`text-white hover:text-gray-300 px-2 py-1 text-sm`}
              >
                Trang Chủ
              </Link>
              <Link
                to={`/blog/he-thong-tri-tue`}
                className={`text-white hover:text-gray-300 px-2 py-1 text-sm`}
              >
                Hệ Thống Trí Tuệ
              </Link>
              {pages?.map((page) =>
                onMenuClick ? (
                  <button
                    key={page.id}
                    onClick={() => onMenuClick(page.slug)}
                    className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                  >
                    {page.title}
                  </button>
                ) : (
                  <Link
                    key={page.id}
                    to={`/landing#${page.slug}`}
                    className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                  >
                    {page.title}
                  </Link>
                )
              )}
              {isLoggedIn && (
                <Link
                  to={`/user/profile`}
                  className={`text-white hover:text-gray-300 px-2 py-1 text-sm`}
                >
                  Blogger
                </Link>
              )}
              <Link
                to={`/blog/tuyen-nhan-vat`}
                className={`text-white hover:text-gray-300 px-2 py-1 text-sm`}
              >
                Tuyển Nhân Vật
              </Link>
              <Link
                to={`/blog/nh-n-v-t`}
                className={`text-white hover:text-gray-300 px-2 py-1 text-sm`}
              >
                Nhân Vật
              </Link>
              {!isLoggedIn && (
                <>
                  <Link
                    to={`/register`}
                    className={`text-white hover:text-gray-300 px-2 py-1 text-sm`}
                  >
                    Đăng Ký
                  </Link>
                  <Link
                    to={`/login`}
                    className={`text-white hover:text-gray-300 px-2 py-1 text-sm`}
                  >
                    Đăng Nhập
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-black backdrop-blur-sm">
            <Link
              to={`/`}
              className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              Trang Chủ
            </Link>
            <Link
              to={`/blog/he-thong-tri-tue`}
              className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              Hệ Thống Trí Tuệ
            </Link>
            {pages?.map((page) =>
              onMenuClick ? (
                <button
                  key={page.id}
                  onClick={() => {
                    onMenuClick(page.slug);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
                >
                  {page.title}
                </button>
              ) : (
                <Link
                  key={page.id}
                  to={`/landing#${page.slug}`}
                  className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
                >
                  {page.title}
                </Link>
              )
            )}
            {isLoggedIn && (
              <Link
                to={`/user/profile`}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Blogger
              </Link>
            )}
            <Link
              to={`/blog/tuyen-nhan-vat`}
              className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              Tuyển Nhân Vật
            </Link>
            <Link
              to={`/blog/nh-n-v-t`}
              className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              Nhân Vật
            </Link>
            {!isLoggedIn && (
              <>
                <Link
                  to={`/register`}
                  className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng Ký
                </Link>
                <Link
                  to={`/login`}
                  className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng Nhập
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
