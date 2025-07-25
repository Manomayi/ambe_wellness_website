'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';

export default function ConsultationReportPage() {
  const router = useRouter();
  const { documentID } = useParams();
  const doctorName    = useSearchParams().get('doctorName') || '';
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) return router.push('/login');
      const snap = await getDoc(
        doc(db, 'users', user.uid, 'profile', documentID)
      );
      if (snap.exists()) setData(snap.data());
      setLoading(false);
    });
    return unsub;
  }, [documentID, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-t-4 border-green-600 border-t-transparent rounded-full"/>
      </div>
    );
  }

  if (!data) {
    return <p className="text-center py-12">No report found.</p>;
  }

  const { recommendations, store_recommendations, notes, time } = data;
  const formattedDate = time
    ? format(time.toDate(), 'MMMM d, h:mm a')
    : null;

  const Card = ({ children }) => (
    <div className="bg-white border-l-4 border-green-600 shadow rounded-lg p-4 mb-4">
      {children}
    </div>
  );

  return (
    <div className="space-y-12">

      {/* Doctor */}
      <p className="text-sm uppercase font-semibold text-gray-600 mb-4">Doctor</p>
      <Card>
        <p className="font-semibold text-gray-800">Dr. {doctorName}</p>
      </Card>

      {/* Date */}
      {formattedDate && (
        <>
          <p className="text-sm uppercase font-semibold text-gray-600 mb-4">Date</p>
          <Card>
            <p className="text-gray-800">{formattedDate}</p>
          </Card>
        </>
      )}

      {/* Recommendations */}
      {recommendations && (
        <>
          <p className="text-sm uppercase font-semibold text-gray-600 mb-4">Recommendations</p>
          {['lifestyle','meditation','exercise','diet'].map(key =>
            recommendations[key] ? (
              <Card key={key}>
                <p className="font-medium text-gray-800 mb-2 capitalize">{key}</p>
                {recommendations[key].notes && (
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-600">Notes</p>
                    <p className="text-gray-700">{recommendations[key].notes}</p>
                  </div>
                )}
                {recommendations[key].selectedOption && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Selected Option</p>
                    <p className="text-gray-700">{recommendations[key].selectedOption}</p>
                  </div>
                )}
              </Card>
            ) : null
          )}
        </>
      )}

      {/* Products */}
      {store_recommendations?.length > 0 && (
        <>
          <p className="text-sm uppercase font-semibold text-gray-600 mb-4">Products</p>
          {store_recommendations.map((item, i) => (
            <Card key={i}>
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-800">{item.productName}</p>
                  {item.size && <p className="text-gray-700">Size: {item.size}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Qty</p>
                  <p className="font-semibold text-gray-800">{item.quantity}</p>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {/* Notes */}
      {notes && (
        <>
          <p className="text-sm uppercase font-semibold text-gray-600 mb-4">Notes</p>
          <Card>
            <p className="text-gray-800">{notes}</p>
          </Card>
        </>
      )}
    </div>
  );
}