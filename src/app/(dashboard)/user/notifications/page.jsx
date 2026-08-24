"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  BellIcon, 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  UserPlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/common/BackButton';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen to notifications matching Flutter app schema (created_at desc)
    let notificationsQuery;
    try {
      notificationsQuery = query(
        collection(db, 'users', user.uid, 'notifications'),
        orderBy('created_at', 'desc')
      );
    } catch (e) {
      notificationsQuery = collection(db, 'users', user.uid, 'notifications');
    }

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Sort defensively by created_at or createdAt if not already sorted
        notifs.sort((a, b) => {
          const timeA = a.created_at?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const timeB = b.created_at?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setNotifications(notifs);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        // Fallback listener without orderBy in case index or field missing
        const fallbackUnsub = onSnapshot(
          collection(db, 'users', user.uid, 'notifications'),
          (fallbackSnapshot) => {
            const notifs = fallbackSnapshot.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            notifs.sort((a, b) => {
              const timeA = a.created_at?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
              const timeB = b.created_at?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
              return timeB - timeA;
            });
            setNotifications(notifs);
            setLoading(false);
          }
        );
        return () => fallbackUnsub();
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleMarkAllAsRead = async () => {
    if (!user || markingAll) return;
    const unreadDocs = notifications.filter((n) => !n.is_read);
    if (unreadDocs.length === 0) return;

    setMarkingAll(true);
    try {
      const batch = writeBatch(db);
      unreadDocs.forEach((n) => {
        const ref = doc(db, 'users', user.uid, 'notifications', n.id);
        batch.update(ref, { is_read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read in Firestore
    if (user && !notification.is_read) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'notifications', notification.id), {
          is_read: true,
        });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    // Handle navigation matching Flutter app behavior
    const type = notification.type;
    if (type === 'new_message' || type === 'consultation_scheduled' || type === 'consultation_reminder') {
      router.push('/user/consult');
    } else if (type === 'doctor_referral') {
      router.push('/user/referral');
    }
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message':
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#C8996A]" />;
      case 'consultation_scheduled':
        return <CalendarDaysIcon className="w-5 h-5 text-[#2E7D32]" />;
      case 'consultation_reminder':
        return <ClockIcon className="w-5 h-5 text-[#C8996A]" />;
      case 'doctor_referral':
        return <UserPlusIcon className="w-5 h-5 text-[#C8996A]" />;
      default:
        return <BellIcon className="w-5 h-5 text-[#8C827A]" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Notifications</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1A1A1A] text-white shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#FFD3AC]" />
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1A1A1A] bg-white border border-[#E7E2D9] hover:border-[#C8996A] hover:bg-[#FAF8F5] transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckIcon className="w-3.5 h-3.5 text-[#C8996A]" />
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E7E2D9] p-8 shadow-sm">
            <BellIcon className="h-16 w-16 text-[#8C827A]/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">No notifications yet</h3>
            <p className="text-sm text-[#6B6862]">
              You'll see notifications about your consultations, messages, and wellness updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isRead = notification.is_read === true;
              const title = notification.title || 'Notification';
              const body = notification.body || notification.message || '';
              const time = notification.created_at || notification.createdAt;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition cursor-pointer ${
                    isRead
                      ? 'bg-white border-[#E7E2D9] hover:bg-[#FAF8F5]'
                      : 'bg-[#FAF8F5] border-[#C8996A]/40 shadow-sm hover:border-[#C8996A]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm ${
                          isRead ? 'font-medium text-[#1A1A1A]' : 'font-bold text-[#1A1A1A]'
                        }`}
                      >
                        {title}
                      </h3>
                      {!isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C8996A] flex-shrink-0" />
                      )}
                    </div>

                    {body && (
                      <p className="text-xs text-[#6B6862] mt-1 line-clamp-2 leading-relaxed">
                        {body}
                      </p>
                    )}

                    <p className="text-[11px] text-[#8C827A] mt-2 font-medium">
                      {formatNotificationTime(time)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}