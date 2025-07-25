"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
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
      
      // Navigate based on user type
      router.push(userType === 'doctor' ? '/doctor/home' : '/user/home');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-gray-800">
            AMBE®
          </Link>
          <p className="text-gray-600 mt-2">Welcome back</p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign In</h2>
          <form onSubmit={handleLogin}>
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
            <Button 
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition"
            >
              {loading ? 'Loading…' : 'Login'}
            </Button>
            <p className="mt-6 text-center text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-orange-500 hover:text-orange-600 font-semibold">
                Sign up
              </Link>
            </p>
          </form>
        </div>

        {/* Back to home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-gray-600 hover:text-gray-800 transition">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}