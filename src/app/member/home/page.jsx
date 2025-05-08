'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  BellIcon,
  ClipboardListIcon,
  ChartBarIcon,
  CalendarIcon,
  CreditCardIcon,
  VideoCameraIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function MemberHomePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setFirstName(user.displayName?.split(' ')[0] || '');
      getDoc(doc(db, 'patients', user.uid))
        .then((snapshot) => {
          setPatient(snapshot.exists() ? snapshot.data() : {});
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  const tasks = [];
  const doneQ = patient?.is_free_questionnaire_completed;
  const setC  = patient?.is_consultation_set;
  const sub   = patient?.subscription?.active;

  if (!doneQ) {
    tasks.push({
      href: '/member/menu/questionnaire',
      Icon: ClipboardListIcon,
      title: 'COMPLETE QUESTIONNAIRE',
      desc: 'Receive your personalized report.',
      color: 'green'
    });
  } else {
    tasks.push({
      href: '/member/menu/questionnaire/results',
      Icon: ChartBarIcon,
      title: 'View Results',
      desc: 'See your constitution report.',
      color: 'indigo'
    });
  }

  if (doneQ && !setC) {
    if (sub) {
      tasks.push({
        href: '/member/consult/schedule',
        Icon: CalendarIcon,
        title: 'Schedule Consultation',
        desc: 'Book time with your expert.',
        color: 'blue'
      });
    } else {
      tasks.push({
        href: '/member/menu/payment',
        Icon: CreditCardIcon,
        title: 'SUBSCRIBE TO CONSULT',
        desc: 'Activate a plan to schedule.',
        color: 'yellow'
      });
    }
  }

  return (
    <div className="w-full space-y-12">
      {/* Greeting & Notifications */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Hello {firstName}</h1>
        <button
          onClick={() => router.push('/member/notifications')}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* THINGS TO DO */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-4">Things to Do</h2>
        <div className="flex flex-col space-y-4">
          {tasks.map(({ href, Icon, title, desc, color }) => (
            <Link
              key={href}
              href={href}
              className={`block bg-white shadow-md rounded-xl p-6 flex items-center justify-between border-l-4 border-${color}-600 hover:shadow-lg transition`}
            >
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 bg-${color}-600 rounded-full p-3`}>
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
        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-4">Coming Soon</h2>
        <Link
          href="/member/courses"
          className="block bg-white shadow-md rounded-xl p-6 flex items-center justify-between border-l-4 border-purple-600 hover:shadow-lg transition"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 bg-purple-600 rounded-full p-3">
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
