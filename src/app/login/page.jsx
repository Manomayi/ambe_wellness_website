'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc, getDoc, updateDoc
} from 'firebase/firestore';
import { getToken } from 'firebase/messaging';

import { auth, db, messaging } from '../../lib/firebase';
import TextField from '../../components/TextField';
import Button    from '../../components/Button';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);

    try {
      // 1) Auth
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // 2) Fetch both docs in parallel
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
      const role     = userData.role; // e.g. "doctor" or "patient"

      // 3) Save to localStorage (or cookies)
      localStorage.setItem('firstName', userData.firstName);
      localStorage.setItem('lastName',  userData.lastName);
      localStorage.setItem('role',      role);

      // 4) Get FCM token & update Firestore
      try {
        const fcmToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY
        });
        if (fcmToken) {
          await updateDoc(doc(db, role === 'doctor' ? 'doctors' : 'patients', user.uid), {
            fcm_token: fcmToken
          });
        }
      } catch (fmErr) {
        console.warn('FCM token error:', fmErr);
      }

      // 5) Redirect
      router.push(role === 'patient' ? '/member' : '/expert');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="max-w-md w-full bg-white p-8 rounded shadow"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-500">Sign In</h2>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          icon={null}
          error={error}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          icon={null}
          error={null}
        />
        {error && (
          <p className="text-red-600 text-center mb-4">{error}</p>
        )}
        <Button disabled={loading}>
          {loading ? 'Loading…' : 'Login'}
        </Button>
      </form>
    </div>
  );
}