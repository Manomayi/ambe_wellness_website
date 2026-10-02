"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  BellIcon, 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  UserPlusIcon,
  CheckIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  VideoCameraIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BackButton from '@/components/common/BackButton';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorTimeout, setErrorTimeout] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const showError = (msg) => {
    setErrorMessage(msg);
    if (errorTimeout) clearTimeout(errorTimeout);
    const t = setTimeout(() => setErrorMessage(null), 5000);
    setErrorTimeout(t);
  };

  useEffect(() => {
    if (!user) return;

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
        console.error('Error fetching notifications:', error);
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
          },
          (fallbackErr) => {
            if (fallbackErr?.code === 'permission-denied') return;
            console.error('Fallback notifications error:', fallbackErr);
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
    if (actionLoadingId) return;

    if (user && !notification.is_read) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'notifications', notification.id), {
          is_read: true,
        });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    const type = notification.type;
    const title = (notification.title || '').toLowerCase();
    const body = (notification.body || notification.message || '').toLowerCase();

    const isCallJoined =
      type === 'call_joined' ||
      type === 'consultation_joined' ||
      title.includes('has started') ||
      title.includes('has joined') ||
      title.includes('joined call') ||
      body.includes('joined the call') ||
      body.includes('joined call');

    if (isCallJoined) {
      const consultationId =
        notification.consultationId ||
        notification.consultation_id ||
        notification.appointmentId ||
        notification.appointment_id ||
        notification.data?.consultationId ||
        notification.data?.consultation_id ||
        notification.data?.appointmentId ||
        notification.data?.appointment_id ||
        notification.document_id;

      if (!consultationId) {
        router.push('/user/consult');
        return;
      }

      setActionLoadingId(notification.id);
      try {
        const consultSnap = await getDoc(doc(db, 'consultations', consultationId));

        if (!consultSnap.exists()) {
          // Check upcoming appointments
          const userUpcoming = await getDoc(
            doc(db, 'users', user.uid, 'appointments_upcoming', consultationId)
          ).catch(() => null);
          if (userUpcoming?.exists()) {
            router.push(`/user/consult/appointment/${consultationId}?autoJoin=true`);
            return;
          }

          // Check user or doctor history
          let historyDoc = null;
          const userHistory = await getDoc(
            doc(db, 'users', user.uid, 'appointments_history', consultationId)
          ).catch(() => null);
          if (userHistory?.exists()) {
            historyDoc = userHistory;
          } else {
            const docHistory = await getDoc(
              doc(db, 'doctors', user.uid, 'appointments_history', consultationId)
            ).catch(() => null);
            if (docHistory?.exists()) {
              historyDoc = docHistory;
            }
          }

          if (historyDoc && historyDoc.exists()) {
            const hData = historyDoc.data() || {};
            const hStatus = (hData.status || '').toLowerCase();
            if (hStatus === 'missed' || hStatus === 'expired') {
              showError('This consultation was missed and has ended.');
            } else if (hStatus.includes('cancel')) {
              showError('This consultation has been cancelled.');
            } else {
              showError('This consultation has already ended.');
            }
            return;
          }

          showError('Consultation not found.');
          return;
        }

        const cData = consultSnap.data() || {};
        const status = (cData.status || '').toLowerCase();
        const callStatus = (cData.call_status || '').toLowerCase();
        const isCompleted = status === 'completed' || status === 'finished' || cData.completed === true;
        const isMissed = status === 'missed' || status === 'expired' || status === 'no_show';
        const isCancelled = status.includes('cancel');
        const isEnded = callStatus === 'ended';

        if (isCompleted || (isEnded && !isMissed && !isCancelled)) {
          showError('This consultation has already ended.');
          return;
        }
        if (isMissed) {
          showError('This consultation was missed and has ended.');
          return;
        }
        if (isCancelled) {
          showError('This consultation has been cancelled.');
          return;
        }

        router.push(`/user/consult/appointment/${consultationId}?autoJoin=true`);
      } catch (err) {
        console.error('Error verifying consultation status:', err);
        showError('Could not verify consultation status. Please try again.');
      } finally {
        setActionLoadingId(null);
      }
      return;
    }

    if (type === 'doctor_recommendation' || type === 'consultation_report' || notification.report_id) {
      const reportId = notification.report_id || notification.document_id || notification.appointment_id;
      if (reportId) {
        if (user) {
          updateDoc(doc(db, 'users', user.uid), {
            'pending_recommendation.reviewed': true,
          }).catch(() => {});
          updateDoc(doc(db, 'users', user.uid, 'appointments_history', reportId), {
            reviewed_by_user: true,
          }).catch(() => {});
        }
        router.push(`/user/consult/report/${reportId}`);
        return;
      }
    }

    if (
      type === 'new_message' || 
      type === 'consultation_scheduled' || 
      type === 'consultation_reminder'
    ) {
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
      case 'call_joined':
      case 'consultation_joined':
        return <VideoCameraIcon className="w-5 h-5 text-[#FFD3AC]" />;
      case 'new_message':
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#FFD3AC]" />;
      case 'doctor_recommendation':
      case 'consultation_report':
        return <ClipboardDocumentListIcon className="w-5 h-5 text-[#FFD3AC]" />;
      case 'consultation_scheduled':
        return <CalendarDaysIcon className="w-5 h-5 text-[#2E7D32]" />;
      case 'consultation_reminder':
        return <ClockIcon className="w-5 h-5 text-[#FFD3AC]" />;
      case 'doctor_referral':
        return <UserPlusIcon className="w-5 h-5 text-[#FFD3AC]" />;
      default:
        return <BellIcon className="w-5 h-5 text-white/50" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <ProtectedRoute userType="user">
      <WebLayoutWrapper contentClassName="py-0 px-0 sm:px-0">
        <div className="w-full pb-12 relative">
          {/* Floating Error Toast */}
          {errorMessage && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-full px-4 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="bg-[#2D1B1B]/95 text-red-200 border border-red-500/40 px-4 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-white">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-white/60 hover:text-white transition p-1 cursor-pointer"
                  aria-label="Dismiss"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Sticky Top Header */}
          <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-3 sm:-mx-6 md:-mx-8 px-3 sm:px-6 md:px-8 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BackButton href="/user/home" fallbackRoute="/user/home" />
                <h1 className="text-2xl font-bold text-white font-serif">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/10">
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
                  onClick={() => router.push('/user/notifications-settings')}
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 transition cursor-pointer"
                  aria-label="Notification settings"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Notifications Content */}
          <div className="max-w-2xl mx-auto px-4 sm:px-0 pt-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur-md">
                <BellIcon className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-1">No notifications yet</h3>
                <p className="text-sm text-white/50">
                  You&apos;ll see notifications about your consultations, messages, and wellness updates here.
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
                        {actionLoadingId === notification.id ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[#FFD3AC] flex-shrink-0" />
                        ) : !isRead ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FFD3AC] flex-shrink-0 shadow-[0_0_4px_rgba(255,211,172,0.5)]" />
                        ) : null}
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
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}