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
          collection(db, 'users', user.uid, 'appointments_completed'),
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
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Ambé</h1>
            <h2 className="text-3xl font-normal text-gray-800">
              Hello {firstName},
            </h2>
          </div>
        </div>

        {/* Things To Do Section */}
        {thingsToDoTasks.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">THINGS TO DO</h3>
            <div className="space-y-3">
              {thingsToDoTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={task.onSelect}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 border border-green-400 rounded-lg p-4 hover:from-green-600 hover:to-green-700 transition-all shadow-lg text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-2">{task.title}</h4>
                      <p className="text-sm text-white opacity-90">{task.subtitle}</p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-white ml-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions - Keep as requested */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">QUICK ACTIONS</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/user/consult')}
              className="bg-white border border-gray-300 rounded-lg p-6 hover:border-green-500 transition-colors"
            >
              <CalendarIcon className="h-8 w-8 text-green-600 mb-3 mx-auto" />
              <h4 className="font-semibold text-gray-800">Consultations</h4>
              <p className="text-sm text-gray-600 mt-1">
                Book or view
              </p>
            </button>

            <button
              onClick={() => router.push('/user/consult/message_doctor')}
              className="bg-white border border-gray-300 rounded-lg p-6 hover:border-green-500 transition-colors"
              disabled={!profile?.doctor}
            >
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 mb-3 mx-auto" />
              <h4 className="font-semibold text-gray-800">Messages</h4>
              <p className="text-sm text-gray-600 mt-1">
                Chat with doctor
              </p>
            </button>

            <button
              onClick={() => router.push('/user/store')}
              className="bg-white border border-gray-300 rounded-lg p-6 hover:border-green-500 transition-colors"
            >
              <ShoppingBagIcon className="h-8 w-8 text-purple-600 mb-3 mx-auto" />
              <h4 className="font-semibold text-gray-800">Store</h4>
              <p className="text-sm text-gray-600 mt-1">
                Browse products
              </p>
            </button>

            <button
              onClick={() => router.push('/user/cart')}
              className="bg-white border border-gray-300 rounded-lg p-6 hover:border-green-500 transition-colors"
            >
              <ShoppingCartIcon className="h-8 w-8 text-yellow-600 mb-3 mx-auto" />
              <h4 className="font-semibold text-gray-800">Cart</h4>
              <p className="text-sm text-gray-600 mt-1">
                View your cart
              </p>
            </button>
          </div>
        </div>

        {/* What's New Section */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">COMING SOON</h3>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 border border-purple-400 rounded-lg p-4 shadow-lg">
            <h4 className="font-bold text-white mb-2">Courses section opening soon</h4>
            <p className="text-sm text-white opacity-90">
              We are proud to announce our new courses section. Stay tuned for more updates
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}