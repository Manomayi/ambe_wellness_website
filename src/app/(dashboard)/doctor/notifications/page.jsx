"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  BellIcon, 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  UserPlusIcon,
  CheckIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/common/BackButton';

export default function DoctorNotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user) return;

    let notificationsQuery;
    try {
      notificationsQuery = query(
        collection(db, 'doctors', user.uid, 'notifications'),
        orderBy('created_at', 'desc')
      );
    } catch (e) {
      notificationsQuery = collection(db, 'doctors', user.uid, 'notifications');
    }

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({
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
      },
      (error) => {
        if (error?.code === 'permission-denied') return;
        console.error('Error fetching doctor notifications:', error);
        const fallbackUnsub = onSnapshot(
          collection(db, 'doctors', user.uid, 'notifications'),
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
          },
          (fallbackErr) => {
            if (fallbackErr?.code === 'permission-denied') return;
            console.error('Fallback doctor notifications error:', fallbackErr);
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
        const ref = doc(db, 'doctors', user.uid, 'notifications', n.id);
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
    if (user && !notification.is_read) {
      try {
        await updateDoc(doc(db, 'doctors', user.uid, 'notifications', notification.id), {
          is_read: true,
        });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    const type = notification.type;
    if (type === 'new_message') {
      router.push('/doctor/messages');
    } else if (
      type === 'consultation_scheduled' || 
      type === 'consultation_cancelled' || 
      type === 'consultation_reminder' || 
      type === 'report_reminder'
    ) {
      router.push('/doctor/consultations');
    } else if (type === 'new_patient') {
      router.push('/doctor/users');
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
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#FFD3AC]" />;
      case 'consultation_scheduled':
        return <CalendarDaysIcon className="w-5 h-5 text-[#2E7D32]" />;
      case 'consultation_cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'consultation_reminder':
        return <ClockIcon className="w-5 h-5 text-[#FFD3AC]" />;
      case 'report_reminder':
        return <ClipboardDocumentCheckIcon className="w-5 h-5 text-[#FFD3AC]" />;
      case 'new_patient':
        return <UserPlusIcon className="w-5 h-5 text-[#FFD3AC]" />;
      default:
        return <BellIcon className="w-5 h-5 text-white/50" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <ProtectedRoute userType="doctor">
      <WebLayoutWrapper>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <BackButton />

          {/* Header row matching Flutter DoctorNotificationsPage AppBar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[#FFD3AC]" />
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 border border-white/10 hover:border-[#FFD3AC]/40 hover:bg-white/15 transition cursor-pointer disabled:opacity-50"
                >
                  <CheckIcon className="w-3.5 h-3.5 text-[#FFD3AC]" />
                  {markingAll ? 'Marking...' : 'Mark all as read'}
                </button>
              )}
              <button
                onClick={() => router.push('/doctor/notifications-settings')}
                className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 transition cursor-pointer"
                aria-label="Notification settings"
                title="Notification Settings"
              >
                <Cog6ToothIcon className="w-5 h-5 text-[#FFD3AC]" />
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur-md">
              <BellIcon className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-1">No notifications yet</h3>
              <p className="text-sm text-white/50">
                You&apos;ll see notifications about new consultations, messages, and patient updates here.
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
                    className={`flex items-start gap-3 sm:gap-4 p-4 rounded-2xl border transition cursor-pointer backdrop-blur-md ${
                      isRead
                        ? 'bg-[#2D2D30] border-white/10 hover:bg-[#38383c]'
                        : 'bg-[#2D2D30] border-[#FFD3AC]/30 hover:border-[#FFD3AC]/50 shadow-sm'
                    }`}
                  >
                    {/* Icon container */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      notification.type === 'consultation_scheduled'
                        ? 'bg-[#2E7D32]/15'
                        : notification.type === 'consultation_cancelled'
                        ? 'bg-red-500/15'
                        : 'bg-[#FFD3AC]/15'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`text-sm sm:text-base ${
                            isRead ? 'font-medium text-white' : 'font-bold text-white'
                          }`}
                        >
                          {title}
                        </h3>
                        {!isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FFD3AC] flex-shrink-0 shadow-[0_0_4px_rgba(255,211,172,0.5)]" />
                        )}
                      </div>

                      {body && (
                        <p className="text-xs sm:text-sm text-white/60 mt-1 line-clamp-2 leading-relaxed">
                          {body}
                        </p>
                      )}

                      <p className="text-[11px] text-white/40 mt-2 font-medium">
                        {formatNotificationTime(time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}
