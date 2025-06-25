'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter }            from 'next/navigation';
import Link                     from 'next/link';
import { auth, db }             from '../../../lib/firebase';
import { onAuthStateChanged }   from 'firebase/auth';
import { doc, getDoc }          from 'firebase/firestore';
import {
  BellIcon,
  ClipboardIcon,
  ChartBarIcon,
  CalendarIcon,
  CreditCardIcon,
  VideoCameraIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function MemberHomePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [patient,   setPatient]   = useState(null);
  const [loading,   setLoading]   = useState(true);

  // always declare your tasks hook before any early return:
  const doneQ = patient?.is_free_questionnaire_completed;
  const setC  = patient?.is_consultation_set;
  const sub   = patient?.subscription?.active;
  const tasks = useMemo(() => {
    const arr = [];
    if (!doneQ) {
      console.log('!doneQ');
      arr.push({
        href:  '/member/menu/questionnaire',
        Icon:  ClipboardIcon,
        title: 'Complete Questionnaire',
        desc:  'Receive your personalized report.',
        color: 'green',
      });
    } else {
      arr.push({
        href:  '/member/menu/questionnaire/results',
        Icon:  ChartBarIcon,
        title: 'View Results',
        desc:  'See your constitution report.',
        color: 'indigo',
      });
    }
    if (doneQ && !setC) {
      console.log('doneQ && !setC');
      if (sub) {
        arr.push({
          href:  '/member/consult/schedule',
          Icon:  CalendarIcon,
          title: 'Schedule Consultation',
          desc:  'Book time with your expert.',
          color: 'blue',
        });
      } else {
        arr.push({
          href:  '/member/payment',
          Icon:  CreditCardIcon,
          title: 'Subscribe To Consult',
          desc:  'Activate a plan to schedule.',
          color: 'yellow',
        });
      }
    }
    return arr;
  }, [doneQ, setC, sub]);

  // pull in all color classes so Tailwind JIT doesn't purge them:
  const _tailwindGuarantee = (
    <div className="
      hidden
      border-green-600 border-indigo-600 border-blue-600 border-yellow-600
      bg-green-600 bg-indigo-600 bg-blue-600 bg-yellow-600
      text-green-600 text-indigo-600 text-blue-600 text-yellow-600
    "/>
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) return router.push('/login');
      setFirstName(user.displayName?.split(' ')[0] || '');
      getDoc(doc(db, 'patients', user.uid))
        .then(snap => setPatient(snap.exists() ? snap.data() : {}))
        .catch(console.error)
        .finally(() => setLoading(false));
    });
    return () => unsub();
  }, [router]);

  // now it’s safe to early‐return your spinner
  if (loading) {
    return (
      <>
        {_tailwindGuarantee}
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-12 w-12 rounded-full border-4 border-t-4 border-green-600 border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-12">
      {_tailwindGuarantee}

      {/* Greeting & Notifications */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Hello {firstName},</h1>
      
      </div>

      {/* THINGS TO DO */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-4">
          Things to Do
        </h2>
        <div className="flex flex-col space-y-4">
          {tasks.map(({ href, Icon, title, desc, color }) => (
            <Link
              key={href}
              href={href}
              className={`
                block bg-white shadow-md rounded-xl p-6 flex items-center justify-between
                border-l-4 hover:shadow-lg transition
                border-${color}-600
              `}
            >
              <div className="flex items-center space-x-4">
                <div className={`rounded-full p-3 bg-${color}-600 flex-shrink-0`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">{title}</h3>
                  <p className="text-gray-600">{desc}</p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-green-600 rounded-full p-2 shadow">
                  <ArrowRightIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* COMING SOON */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-4">
          Coming Soon
        </h2>
        <Link
          href="/member/courses"
          className="block bg-white shadow-md rounded-xl p-6 flex items-center justify-between border-l-4 border-purple-600 hover:shadow-lg transition"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-600 rounded-full p-3 flex-shrink-0">
              <VideoCameraIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Courses Section</h3>
              <p className="text-gray-600">Stay tuned for upcoming courses.</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-green-600 rounded-full p-2 shadow">
              <ArrowRightIcon className="h-4 w-4 text-white" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}