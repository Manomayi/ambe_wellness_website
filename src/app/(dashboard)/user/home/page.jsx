"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  BellIcon,
  ChevronRightIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

export default function UserHomePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [thingsToDoTasks, setThingsToDoTasks] = useState([]);

  useEffect(() => {
    if (user && profile) {
      loadThingsToDo();
    } else if (user && !profile) {
      setLoading(false);
    }
  }, [user, profile]);

  const loadThingsToDo = async () => {
    try {
      const tasks = [];
      
      // Become a user
      if (!profile?.subscription?.active) {
        tasks.push({
          id: 'become-user',
          title: 'Become a user',
          subtitle: 'Become a user to save on products recommended by our doctors and enjoy exclusive benefits.',
          onSelect: () => router.push('/user/payment')
        });
      }

      // VIEW PERSONALIZED PRODUCTS
      if (profile?.is_first_consultation_completed) {
        tasks.push({
          id: 'view-products',
          title: 'Checkout your personalized products',
          subtitle: 'Checkout the personalized products recommended for you by our doctor.',
          onSelect: () => router.push('/user/cart')
        });
      }

      // VIEW LATEST CONSULT RESULTS
      if (profile?.is_first_consultation_completed) {
        tasks.push({
          id: 'view-consult',
          title: 'View latest consultation results',
          subtitle: 'View your personalized report on your latest consultation from your doctor.',
          onSelect: () => navigateToLatestConsultationResults()
        });
      }

      // VIEW QUESTIONNAIRE RESULTS
      if (profile?.is_free_questionnaire_completed) {
        tasks.push({
          id: 'view-questionnaire',
          title: 'Review questionnaire results',
          subtitle: 'Review your personalized report on your unique constitution.',
          onSelect: () => router.push('/user/menu/questionnaire/results')
        });
      } else {
        // COMPLETE QUESTIONNAIRE
        tasks.push({
          id: 'complete-questionnaire',
          title: 'Complete the questionnaire',
          subtitle: 'Complete the questionnaire to receive a personalized report on your unique constitution from a doctor.',
          onSelect: () => router.push('/user/menu/questionnaire')
        });
      }

      // SCHEDULE CONSULTATION
      if (!profile?.is_consultation_set && profile?.is_free_questionnaire_completed) {
        tasks.push({
          id: 'schedule-consultation',
          title: 'Schedule your consultation',
          subtitle: 'Schedule your consultation with a doctor.',
          onSelect: async () => {
            // Check if user has active subscription
            if (profile?.subscription?.active) {
              router.push('/user/consult/schedule');
            } else {
              router.push('/user/payment');
            }
          }
        });
      }

      setThingsToDoTasks(tasks);
      setLoading(false);
    } catch (error) {
      console.error('Error loading things to do:', error);
      setLoading(false);
    }
  };

  const navigateToLatestConsultationResults = async () => {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'users', user.uid, 'appointments_history'),
          orderBy('time', 'desc'),
          limit(1)
        )
      );

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const appointmentId = doc.data().appointment_id || doc.id;
        router.push(`/user/consult/report/${appointmentId}`);
      } else {
        alert('No consultation history found.');
      }
    } catch (error) {
      console.error('Error fetching latest consultation:', error);
      alert('Failed to load consultation report.');
    }
  };

  const firstName = user?.displayName?.split(' ')[0] || profile?.first_name || 'there';

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Ambe</h1>
            <h2 className="text-3xl font-normal text-[#1A1A1A]">
              Hello {firstName},
            </h2>
          </div>
        </div>

        {/* Things To Do Section */}
        {thingsToDoTasks.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">THINGS TO DO</h3>
            <div className="space-y-3">
              {thingsToDoTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={task.onSelect}
                  className="w-full bg-white border border-[#E7E2D9] hover:border-[#C8996A] rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-base text-[#1A1A1A] mb-1">{task.title}</h4>
                      <p className="text-sm text-[#6B6862]">{task.subtitle}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center flex-shrink-0 ml-4">
                      <ChevronRightIcon className="h-4 w-4 text-[#1A1A1A]" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">QUICK ACTIONS</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/user/consult')}
              className="bg-white border border-[#E7E2D9] hover:border-[#C8996A] rounded-xl p-6 transition-all duration-200 shadow-sm text-center flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center mb-3">
                <CalendarIcon className="h-6 w-6 text-[#1A1A1A]" />
              </div>
              <h4 className="font-semibold text-base text-[#1A1A1A]">Consultations</h4>
              <p className="text-sm text-[#6B6862] mt-1">
                Book or view
              </p>
            </button>

            <button
              onClick={() => router.push('/user/consult/message_doctor')}
              className="bg-white border border-[#E7E2D9] hover:border-[#C8996A] rounded-xl p-6 transition-all duration-200 shadow-sm text-center flex flex-col items-center justify-center"
              disabled={!profile?.doctor}
            >
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center mb-3">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#1A1A1A]" />
              </div>
              <h4 className="font-semibold text-base text-[#1A1A1A]">Messages</h4>
              <p className="text-sm text-[#6B6862] mt-1">
                Chat with doctor
              </p>
            </button>

            <button
              onClick={() => router.push('/user/store')}
              className="bg-white border border-[#E7E2D9] hover:border-[#C8996A] rounded-xl p-6 transition-all duration-200 shadow-sm text-center flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center mb-3">
                <ShoppingBagIcon className="h-6 w-6 text-[#1A1A1A]" />
              </div>
              <h4 className="font-semibold text-base text-[#1A1A1A]">Store</h4>
              <p className="text-sm text-[#6B6862] mt-1">
                Browse products
              </p>
            </button>

            <button
              onClick={() => router.push('/user/cart')}
              className="bg-white border border-[#E7E2D9] hover:border-[#C8996A] rounded-xl p-6 transition-all duration-200 shadow-sm text-center flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center mb-3">
                <ShoppingCartIcon className="h-6 w-6 text-[#1A1A1A]" />
              </div>
              <h4 className="font-semibold text-base text-[#1A1A1A]">Cart</h4>
              <p className="text-sm text-[#6B6862] mt-1">
                View your cart
              </p>
            </button>
          </div>
        </div>

        {/* What's New Section */}
        <div>
          <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">COMING SOON</h3>
          <div className="bg-white border border-[#E7E2D9] rounded-xl p-6 shadow-sm">
            <h4 className="font-bold text-lg text-[#1A1A1A] mb-2">Courses section opening soon</h4>
            <p className="text-sm text-[#6B6862] leading-relaxed">
              We are proud to announce our new courses section. Stay tuned for more updates.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}