import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Rockwell Collection - The Essence of Hospitality" },
    { name: "description", content: "Rockwell Collection - A Vietnamese-based lifestyle group that develops, owns, and operates a diversified portfolio of luxury dining, beverage, and nightlife entertainment venues." },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold">ROCKWELL COLLECTION</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="#about" className="hover:text-gray-600 px-3 py-2">About</Link>
                <Link to="#outlets" className="hover:text-gray-600 px-3 py-2">Outlets</Link>
                <Link to="#events" className="hover:text-gray-600 px-3 py-2">Events</Link>
                <Link to="#contact" className="hover:text-gray-600 px-3 py-2">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-black text-white">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-50"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">THE ESSENCE OF HOSPITALITY</h1>
          <p className="text-xl md:text-2xl mb-8">Luxury dining, beverage, and nightlife entertainment venues</p>
          <Link to="#outlets" className="bg-white text-black px-8 py-3 rounded-full hover:bg-gray-100 transition">
            Discover Our Venues
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">ABOUT US</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Founded in 2022, Rockwell Collection is a Vietnamese-based lifestyle group that develops, owns, and operates a diversified portfolio of luxury dining, beverage, and nightlife entertainment venues.
            </p>
          </div>
        </div>
      </section>

      {/* Outlets Section */}
      <section id="outlets" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">OUR VENUES</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['ROS Dining & River Lounge', 'Towa Japanese Cuisine', 'Lai Cantonese Restaurant'].map((venue) => (
              <div key={venue} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{venue}</h3>
                  <p className="text-gray-600">Experience luxury dining at its finest</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-8">CONTACT US</h2>
            <p className="text-gray-600 mb-4">65 Le Loi, Ben Nghe Ward, District 1, HCMC</p>
            <Link to="/contact" className="inline-block bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2024 ROCKWELL COLLECTION. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
