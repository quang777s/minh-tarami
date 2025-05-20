import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useState, useEffect } from "react";

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

const slides = [
  {
    id: "home",
    image: "/after-the-rain.jpg",
    title: "THE ESSENCE OF HOSPITALITY",
    subtitle: "Luxury dining, beverage, and nightlife entertainment venues",
  },
  {
    id: "contact",
    image: "/shooting-star.png",
    title: "CONTACT US",
    subtitle: "Get in touch with our team",
  },
  {
    id: "gift-card",
    image: "/milky-way.jpg",
    title: "GIFT CARDS",
    subtitle: "Share the experience with your loved ones",
  },
  {
    id: "membership",
    image: "/after-the-rain.jpg",
    title: "MEMBERSHIP",
    subtitle: "Join our exclusive community",
  },
  {
    id: "careers",
    image: "/shooting-star.png",
    title: "CAREERS",
    subtitle: "Join our growing team",
  },
  {
    id: "consulting",
    image: "/milky-way.jpg",
    title: "CONSULTING",
    subtitle: "Expert hospitality solutions",
  },
  {
    id: "partners",
    image: "/after-the-rain.jpg",
    title: "OUR PARTNERS",
    subtitle: "Building lasting relationships",
  },
  {
    id: "events",
    image: "/shooting-star.png",
    title: "YOUR EVENTS",
    subtitle: "Create unforgettable moments",
  },
  {
    id: "team",
    image: "/milky-way.jpg",
    title: "OUR TEAM",
    subtitle: "Meet the people behind the experience",
  },
  {
    id: "about",
    image: "/after-the-rain.jpg",
    title: "ABOUT US",
    subtitle: "Our story and vision",
  },
];

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleMenuClick = (id: string) => {
    const slideIndex = slides.findIndex((slide) => slide.id === id);
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
                <button 
                  onClick={() => handleMenuClick("contact")}
                  className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                >
                  Contact
                </button>
                <button 
                  onClick={() => handleMenuClick("gift-card")}
                  className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                >
                  Gift Card
                </button>
                <button 
                  onClick={() => handleMenuClick("membership")}
                  className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                >
                  Membership
                </button>
                <button 
                  onClick={() => handleMenuClick("careers")}
                  className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                >
                  Careers
                </button>
                <button 
                  onClick={() => handleMenuClick("consulting")}
                  className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                >
                  Consulting
                </button>
                <button 
                  onClick={() => handleMenuClick("partners")}
                  className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                >
                  Our Partners
                </button>
                <button 
                  onClick={() => handleMenuClick("events")}
                  className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                >
                  Your Events
                </button>
                <button 
                  onClick={() => handleMenuClick("team")}
                  className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                >
                  Our Team
                </button>
                <button 
                  onClick={() => handleMenuClick("about")}
                  className="text-white hover:text-gray-300 px-2 py-1 text-sm"
                >
                  About Us
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black/90 backdrop-blur-sm">
              <button 
                onClick={() => handleMenuClick("contact")}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              >
                Contact
              </button>
              <button 
                onClick={() => handleMenuClick("gift-card")}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              >
                Gift Card
              </button>
              <button 
                onClick={() => handleMenuClick("membership")}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              >
                Membership
              </button>
              <button 
                onClick={() => handleMenuClick("careers")}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              >
                Careers
              </button>
              <button 
                onClick={() => handleMenuClick("consulting")}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              >
                Consulting
              </button>
              <button 
                onClick={() => handleMenuClick("partners")}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              >
                Our Partners
              </button>
              <button 
                onClick={() => handleMenuClick("events")}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              >
                Your Events
              </button>
              <button 
                onClick={() => handleMenuClick("team")}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              >
                Our Team
              </button>
              <button 
                onClick={() => handleMenuClick("about")}
                className="block w-full text-left text-white hover:text-gray-300 px-3 py-2 text-sm"
              >
                About Us
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Slides */}
      <section className="relative h-screen w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-black/50"></div>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            ></div>
            <div className="relative z-10 h-full w-full flex items-center justify-center text-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 text-white">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-white px-4">
                  {slide.subtitle}
                </p>
                <Link
                  to="#outlets"
                  className="bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded-full hover:bg-gray-100 transition text-sm md:text-base"
                >
                  Discover Our Venues
                </Link>
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