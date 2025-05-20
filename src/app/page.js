"use client";
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import TextField from '@/components/TextField';
import Button from '@/components/Button';


export default function Home() {
  const router = useRouter();

  // Sign‐in form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener("click", () => {
        mobileMenu.classList.toggle("hidden");
      });
      mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          mobileMenu.classList.add("hidden");
        });
      });
    }

    // Navbar scroll behavior
    const navbar = document.getElementById("navbar");
    const logo = navbar.querySelector(".logo");
    const navLinks = navbar.querySelectorAll(".nav-link");
    const onScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add("bg-white", "shadow-md");
        navbar.classList.remove("bg-transparent");
        if (logo) {
          logo.classList.remove("text-white");
          logo.classList.add("text-gray-800");
        }
        navLinks.forEach((link) => {
          link.classList.remove("text-white");
          link.classList.add("text-gray-800");
        });
      } else {
        navbar.classList.remove("bg-white", "shadow-md");
        navbar.classList.add("bg-transparent");
        if (logo) {
          logo.classList.add("text-white");
          logo.classList.remove("text-gray-800");
        }
        navLinks.forEach((link) => {
          link.classList.add("text-white");
          link.classList.remove("text-gray-800");
        });
      }
    };
    window.addEventListener("scroll", onScroll);

    // Fade-in animations
    const handleFadeIn = () => {
      document.querySelectorAll(".fade-in").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
          el.classList.add("visible");
        }
      });
    };
    window.addEventListener("scroll", handleFadeIn);
    handleFadeIn();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", handleFadeIn);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1) Auth
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // 2) Fetch role doc
      const [docSnapDoctor, docSnapPatient] = await Promise.all([
        getDoc(doc(db, 'doctors', user.uid)),
        getDoc(doc(db, 'patients', user.uid)),
      ]);
      const roleDoc = docSnapDoctor.exists()
        ? docSnapDoctor
        : docSnapPatient.exists()
        ? docSnapPatient
        : null;
      if (!roleDoc) throw new Error('No user record found');
      const userData = roleDoc.data();
      const role = userData.role;

      // 3) Persist basic info
      localStorage.setItem('firstName', userData.firstName);
      localStorage.setItem('lastName', userData.lastName);
      localStorage.setItem('role', role);

      // 4) Redirect
      router.push(role === 'Patient' ? '/member' : '/expert');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Ambe Wellness</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Script
        src="https://kit.fontawesome.com/cb7d5cdf70.js"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* Navbar */}
      <header
  id="navbar"
  className="fixed top-0 left-0 w-full z-20 bg-transparent transition"
>
  <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
    {/* Logo */}
    <a href="#" className="logo text-2xl font-bold text-white">
      Ambe Wellness
    </a>

    {/* Desktop nav */}
    <nav className="hidden md:flex items-center space-x-4">
      <a href="#about" className="nav-link text-white hover:text-green-600">
        About Us
      </a>
      <a href="#how-it-works" className="nav-link text-white hover:text-green-600">
        How It Works
      </a>
      <a href="#services" className="nav-link text-white hover:text-green-600">
        Services
      </a>
      <a href="#contact" className="nav-link text-white hover:text-green-600">
        Contact Us
      </a>
      <a
        href="/signup"
        className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition"
      >
        Sign Up
      </a>
    </nav>

    {/* Mobile menu button */}
    <div className="md:hidden">
      <button
        id="mobile-menu-button"
        className="inline-flex items-center justify-center p-2 text-white hover:text-green-600 focus:outline-none"
      >
        {/* simple hamburger icon */}
        <svg
          className="h-6 w-6"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  </div>

  {/* Mobile menu drawer */}
  <div id="mobile-menu" className="md:hidden hidden bg-white">
    <div className="px-2 pt-2 pb-3 space-y-1">
      <a
        href="#about"
        className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
      >
        About Us
      </a>
      <a
        href="#how-it-works"
        className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
      >
        How It Works
      </a>
      <a
        href="#services"
        className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
      >
        Services
      </a>
      <a
        href="#contact"
        className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100"
      >
        Contact Us
      </a>
      <a
        href="/signup"
        className="block px-3 py-2 rounded-md font-bold bg-green-600 text-white hover:bg-green-700 transition"
      >
        Sign Up
      </a>
    </div>
  </div>
</header>

      <main className="bg-white text-gray-800">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay muted loop
          >
            <source src="/videos/hero_background.mp4" type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(255,255,255,1),rgba(255,255,255,0))' }}
          />

          <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            {/* Left: marketing text */}
            <div className="flex flex-col justify-center text-center md:text-left fade-in">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-shadow">
                Start Your Journey to Wellness
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8 text-shadow">
                Personalized remedies from licensed experts to enhance your lifestyle.
              </p>
              
            </div>

            {/* Right: sign-in form */}
            <div className="flex items-center justify-center">
              <form
                onSubmit={handleLogin}
                className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg"
              >
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                  Sign In
                </h2>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={null}
                />
                {error && <p className="text-red-600 text-center mb-4">{error}</p>}
                <Button disabled={loading}>
                  {loading ? 'Loading…' : 'Login'}
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 bg-white fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-12 text-green-600 text-center">
              How It Works
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-6">
              <div className="text-center border-2 border-green-600 p-8 md:p-6 rounded-full w-56 h-56 flex flex-col justify-center items-center transition-transform transform hover:scale-105">
                <i className="fas fa-search fa-3x text-green-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 text-green-600">
                  Discover
                </h3>
                <p className="text-gray-700 text-sm text-center">
                  Explore our range of wellness services tailored to your needs.
                </p>
              </div>
              <div className="text-center">
                <i className="fas fa-arrow-down fa-2x text-green-600 md:hidden"></i>
                <i className="fas fa-arrow-right fa-2x text-green-600 hidden md:inline"></i>
              </div>
              <div className="text-center border-2 border-green-600 p-8 md:p-6 rounded-full w-56 h-56 flex flex-col justify-center items-center transition-transform transform hover:scale-105">
                <i className="fas fa-user-friends fa-3x text-green-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 text-green-600">
                  Connect
                </h3>
                <p className="text-gray-700 text-sm text-center">
                  Get matched with licensed experts for personalized
                  consultations.
                </p>
              </div>
              <div className="text-center">
                <i className="fas fa-arrow-down fa-2x text-green-600 md:hidden"></i>
                <i className="fas fa-arrow-right fa-2x text-green-600 hidden md:inline"></i>
              </div>
              <div className="text-center border-2 border-green-600 p-8 md:p-6 rounded-full w-56 h-56 flex flex-col justify-center items-center transition-transform transform hover:scale-105">
                <i className="fas fa-seedling fa-3x text-green-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 text-green-600">
                  Grow
                </h3>
                <p className="text-gray-700 text-sm text-center">
                  Embark on your wellness journey and achieve your best self.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section
          id="about"
          className="relative py-16 parallax"
          style={{
            backgroundImage: "url('/images/about_us.webp')",
            backgroundSize: "cover",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-8 text-green-600">
              About Ambe Wellness
            </h2>
            <p className="text-lg text-gray-100 max-w-2xl mx-auto">
              Ambe Wellness connects you with a diverse team of licensed experts
              who offer personalized remedies tailored to enhance your
              lifestyle, guiding you on the path to becoming your best self.
            </p>
            <p className="text-lg text-gray-100 mt-4 max-w-2xl mx-auto">
              Our mission is to empower individuals by providing access to
              holistic wellness solutions that are both effective and
              personalized.
            </p>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-green-600">
              Our Services
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="service-card bg-white p-4 rounded-full flex flex-col items-center justify-center">
                <i className="fas fa-leaf service-icon text-green-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 text-center text-green-600">
                  Custom Remedies
                </h3>
                <p className="text-gray-700 text-center">
                  Tailored solutions to address your unique wellness needs.
                </p>
              </div>
              <div className="service-card bg-white p-4 rounded-full flex flex-col items-center justify-center">
                <i className="fas fa-heartbeat service-icon text-green-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 text-center text-green-600">
                  Lifestyle Programs
                </h3>
                <p className="text-gray-700 text-center">
                  Structured programs to enhance your daily life and habits.
                </p>
              </div>
              <div className="service-card bg-white p-4 rounded-full flex flex-col items-center justify-center">
                <i className="fas fa-user-md service-icon text-green-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 text-center text-green-600">
                  Expert Consultations
                </h3>
                <p className="text-gray-700 text-center">
                  One-on-one sessions with licensed wellness professionals.
                </p>
              </div>
              <div className="service-card bg-white p-4 rounded-full flex flex-col items-center justify-center">
                <i className="fas fa-spa service-icon text-green-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 text-center text-green-600">
                  Wellness Workshops
                </h3>
                <p className="text-gray-700 text-center">
                  Interactive sessions to learn and grow in a supportive
                  environment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section id="contact" className="bg-gray-50 py-16 fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-green-600">
              Contact Us
            </h2>
            <div className="md:flex md:justify-center">
              <form className="w-full md:w-1/2 bg-white p-8 rounded-lg shadow-md">
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Your Name"
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Your Email"
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="message"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows="5"
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Your Message"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-md"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
              <h4 className="text-xl font-semibold mb-4 text-green-600">
                Quick Links
              </h4>
              <ul>
                <li>
                  <a
                    href="#about"
                    className="text-gray-700 hover:text-green-600"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-gray-700 hover:text-green-600"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#services"
                    className="text-gray-700 hover:text-green-600"
                  >
                    Services
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-gray-700 hover:text-green-600"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4 text-green-600">
                Contact Us
              </h4>
              <p className="text-gray-700">Email: info@ambewellness.com</p>
              <p className="text-gray-700">Phone: (123) 456-7890</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-700 hover:text-green-600">
                  <i className="fab fa-facebook-f fa-lg"></i>
                </a>
                <a href="#" className="text-gray-700 hover:text-green-600">
                  <i className="fab fa-twitter fa-lg"></i>
                </a>
                <a href="#" className="text-gray-700 hover:text-green-600">
                  <i className="fab fa-instagram fa-lg"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-600">
            <p>&copy; 2023 Ambe Wellness. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
