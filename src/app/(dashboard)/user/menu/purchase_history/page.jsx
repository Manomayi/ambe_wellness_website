'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query } from 'firebase/firestore';

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const uid = user.uid;
        const q = query(collection(db, 'users', uid, 'purchases'));
        const snap = await getDocs(q);
        const items = snap.docs.map(doc => {
          const data = doc.data();
          const ts = data.created;
          const date = ts && ts.toDate ? ts.toDate() : new Date();
          return {
            id: doc.id,
            amount: data.amount ?? 0,
            currency: data.currency ?? 'USD',
            status: data.status ?? 'Unknown',
            time: date
          };
        });
        setPurchases(items);
      } catch (e) {
        console.error('Failed to load purchases:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-t-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-semibold text-gray-800">Purchase History</h1>

      {purchases.length === 0 ? (
        <p className="text-gray-600">No purchases found.</p>
      ) : (
        <div className="space-y-4">
          {purchases.map(({ id, amount, currency, status, time }) => (
            <div
              key={id}
              className="bg-white border-l-4 border-green-600 rounded-lg shadow-sm p-4"
            >
              <p className="font-medium text-gray-800">Amount: {amount} {currency}</p>
              <p className="text-gray-600">Status: {status}</p>
              <p className="text-gray-600 text-sm">{time.toLocaleString(undefined, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
