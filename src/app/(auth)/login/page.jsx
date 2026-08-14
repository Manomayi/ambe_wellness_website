"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userType = await signIn(email, password);
      console.log("userType", userType);
      router.push(userType === 'doctor' ? '/doctor/home' : '/user/home');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-3xl sm:text-4xl font-normal tracking-wide transition-opacity hover:opacity-80 select-none"
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
          >
            AMBÉ
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] mt-1.5 font-medium" style={{ color: "#C2691C" }}>
            Integrative Ayurveda
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white p-7 sm:p-10 rounded-3xl shadow-xl border border-[#E7E2D9]">
          <h2
            className="text-2xl sm:text-3xl font-medium mb-2 text-center select-none"
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
          >
            Welcome Back
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: "#6B6862" }}>
            Sign in to access your consultations and care plan.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                Password
              </label>
              <input
                type="password"
                name="current-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
              />
            </div>

            {error && (
              <p className="text-xs text-center py-2 px-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <p className="mt-6 text-center text-sm" style={{ color: "#6B6862" }}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold hover:underline" style={{ color: "#C2691C" }}>
                Sign up
              </Link>
            </p>
          </form>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs uppercase tracking-widest font-semibold text-[#6B6862] hover:text-[#1A1A1A] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}