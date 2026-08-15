'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';

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
          const date = ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
          const rawAmount = data.amount ?? 0;
          const amountNum = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 0;
          // If stored in cents (e.g. 5000), format to 50.00
          const displayAmount = amountNum >= 100 && Number.isInteger(amountNum) && !data.amount_is_dollars
            ? (amountNum / 100).toFixed(2)
            : amountNum.toFixed(2);

          return {
            id: doc.id,
            amount: displayAmount,
            currency: (data.currency || 'USD').toUpperCase(),
            status: data.status || 'succeeded',
            type: data.type || 'store',
            description: data.description || '',
            items: Array.isArray(data.items) ? data.items : [],
            time: date
          };
        });
        // Sort newest first
        items.sort((a, b) => b.time - a.time);
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
        <div className="animate-spin h-10 w-10 border-2 border-[#C8996A] border-t-transparent rounded-full" />
      </div>
    );
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'subscription':
        return 'Subscription Deposit';
      case 'consultation':
        return 'Consultation Appointment';
      case 'store':
      default:
        return 'Product Order';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton />
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Purchase History</h1>

      {purchases.length === 0 ? (
        <div className="bg-white border border-[#E7E2D9] rounded-xl p-8 text-center shadow-sm">
          <p className="text-sm text-[#6B6862]">No purchases found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map(({ id, amount, currency, status, type, description, items, time }) => (
            <div
              key={id}
              className="bg-white border border-[#E7E2D9] rounded-xl shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E7E2D9] gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C8996A] bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E7E2D9]">
                    {getTypeLabel(type)}
                  </span>
                  <p className="text-xs text-[#8C827A] mt-2">
                    {time.toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xl font-bold text-[#1A1A1A]">
                    ${amount} <span className="text-xs font-semibold text-[#8C827A]">{currency}</span>
                  </p>
                  <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {status}
                  </span>
                </div>
              </div>

              {description && (
                <p className="text-sm text-[#353535] mt-3">{description}</p>
              )}

              {items && items.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#E7E2D9]/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8C827A] mb-2">
                    Items ({items.length}):
                  </p>
                  <div className="space-y-1.5">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-[#1A1A1A]">
                        <span>
                          {item.name || item.productName || 'Product'}
                          {item.size ? ` (${item.size})` : ''} × {item.quantity || 1}
                        </span>
                        <span className="font-medium text-[#6B6862]">
                          ${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
