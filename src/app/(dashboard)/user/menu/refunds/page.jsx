'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage, functions } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  getDocs,
  onSnapshot,
  where,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import BackButton from '@/components/common/BackButton';
import {
  ReceiptRefundIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperClipIcon,
  InformationCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

function formatConsultationDate(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  if (typeof dateVal === 'string') {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return dateVal;
  }
  return String(dateVal);
}

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  if (typeof val === 'number') {
    return new Date(val > 100000000000 ? val : val * 1000);
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export default function UserRefundsPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [historyAppts, setHistoryAppts] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [patientMessage, setPatientMessage] = useState('Refund Deposit Request');
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setCurrentUser(user);
        initListeners(user.uid);
      }
    });

    return () => unsubAuth();
  }, [router]);

  const initListeners = (uid) => {
    setLoading(true);

    // 1. Listen for purchases
    const purchasesQ = query(collection(db, 'users', uid, 'purchases'));
    const unsubPurchases = onSnapshot(purchasesQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPurchases(list);
    });

    // 2. Listen for upcoming appointments
    const upcomingQ = query(collection(db, 'users', uid, 'appointments_upcoming'));
    const unsubUpcoming = onSnapshot(upcomingQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUpcomingAppts(list);
    });

    // 3. Listen for past appointments
    const historyQ = query(collection(db, 'users', uid, 'appointments_history'));
    const unsubHistory = onSnapshot(historyQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setHistoryAppts(list);
    });

    // 4. Listen for refund requests
    const refundQ = query(
      collection(db, 'refundRequests'),
      where('userId', '==', uid)
    );
    const unsubRefunds = onSnapshot(refundQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRefundRequests(list);
      setLoading(false);
    });

    return () => {
      unsubPurchases();
      unsubUpcoming();
      unsubHistory();
      unsubRefunds();
    };
  };

  // Build merged consultation deposit payment items & stats
  const { depositItems, stats } = useMemo(() => {
    const refundsByPaymentId = {};
    const refundsByConsultationId = {};

    refundRequests.forEach((r) => {
      if (r.paymentId) refundsByPaymentId[r.paymentId] = r;
      if (r.consultationId && r.consultationId !== 'N/A') {
        refundsByConsultationId[r.consultationId] = r;
      }
    });

    const claimedAppointmentIds = new Set();

    const now = new Date();
    let totalCount = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let completedCount = historyAppts.length;
    let upcomingCount = upcomingAppts.length;
    let noShowCount = 0;

    const parseDate = (val) => {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      if (val.toDate) return val.toDate();
      if (typeof val === 'number') return new Date(val > 100000000000 ? val : val * 1000);
      if (val.seconds) return new Date(val.seconds * 1000);
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const items = [];

    purchases.forEach((p) => {
      const type = (p.type || '').toLowerCase();
      if (
        type === 'consultation' ||
        type === 'consultation_deposit' ||
        type === 'deposit'
      ) {
        totalCount++;
        const paymentId = p.id;
        const status = (p.status || 'succeeded').toLowerCase();
        if (status === 'succeeded' || status === 'paid') {
          paidCount++;
        } else {
          unpaidCount++;
        }

        // Payment date
        let paymentDate = parseDate(p.created) || now;

        const rawAmount = p.amount ?? 50.0;
        let depositAmount = Number(rawAmount) || 50.0;
        if (depositAmount > 500) depositAmount = depositAmount / 100.0;

        // 1. Try matching with upcoming appointments by ID
        let matchedAppt = null;
        let consultationStatus = 'upcoming';

        for (const a of upcomingAppts) {
          const apptId = a.id || a.appointment_id || '';
          if (apptId && claimedAppointmentIds.has(apptId)) continue;
          if (
            a.payment_id === paymentId ||
            (p.consultation_id && (a.id === p.consultation_id || a.appointment_id === p.consultation_id)) ||
            a.appointment_id === paymentId
          ) {
            matchedAppt = a;
            consultationStatus = 'upcoming';
            if (apptId) claimedAppointmentIds.add(apptId);
            break;
          }
        }

        // Try matching with history appointments by ID
        if (!matchedAppt) {
          for (const a of historyAppts) {
            const apptId = a.id || a.appointment_id || a.document_id || '';
            if (apptId && claimedAppointmentIds.has(apptId)) continue;
            if (
              a.payment_id === paymentId ||
              (p.consultation_id && (a.id === p.consultation_id || a.document_id === p.consultation_id || a.appointment_id === p.consultation_id)) ||
              a.appointment_id === paymentId
            ) {
              matchedAppt = a;
              const rawSt = (a.status || '').toString().toLowerCase();
              consultationStatus = rawSt || 'completed';
              if (apptId) claimedAppointmentIds.add(apptId);
              break;
            }
          }
        }

        // 2. Direct appointment time from purchase
        let apptTime = parseDate(p.appointment_time || p.appointmentTime || p.consultation_time);

        // Proximity matching for unlinked appointments (check upcoming, then history)
        if (!matchedAppt && apptTime) {
          for (const a of upcomingAppts) {
            const apptId = a.id || a.appointment_id || '';
            if (apptId && claimedAppointmentIds.has(apptId)) continue;
            const t = parseDate(a.time || a.appointment_time || a.appointmentTime);
            if (t && Math.abs(t.getTime() - apptTime.getTime()) < 15 * 60 * 1000) {
              matchedAppt = a;
              consultationStatus = 'upcoming';
              if (apptId) claimedAppointmentIds.add(apptId);
              break;
            }
          }

          if (!matchedAppt) {
            for (const a of historyAppts) {
              const apptId = a.id || a.appointment_id || a.document_id || '';
              if (apptId && claimedAppointmentIds.has(apptId)) continue;
              const t = parseDate(a.time || a.appointment_time || a.appointmentTime);
              if (t && Math.abs(t.getTime() - apptTime.getTime()) < 30 * 60 * 1000) {
                matchedAppt = a;
                const rawSt = (a.status || '').toString().toLowerCase();
                consultationStatus = rawSt || 'completed';
                if (apptId) claimedAppointmentIds.add(apptId);
                break;
              }
            }
          }
        }

        // Fallback: If still unmatched, and user has 0 upcoming appointments, match with any unclaimed appointment in history on same day
        if (!matchedAppt && upcomingAppts.length === 0 && apptTime) {
          for (const a of historyAppts) {
            const apptId = a.id || a.appointment_id || a.document_id || '';
            if (apptId && claimedAppointmentIds.has(apptId)) continue;
            const t = parseDate(a.time || a.appointment_time || a.appointmentTime);
            if (
              t &&
              t.getFullYear() === apptTime.getFullYear() &&
              t.getMonth() === apptTime.getMonth() &&
              t.getDate() === apptTime.getDate()
            ) {
              matchedAppt = a;
              const rawSt = (a.status || '').toString().toLowerCase();
              consultationStatus = rawSt || 'completed';
              if (apptId) claimedAppointmentIds.add(apptId);
              break;
            }
          }
        }

        const consultationId =
          p.consultation_id ||
          p.appointment_id ||
          matchedAppt?.id ||
          matchedAppt?.appointment_id ||
          matchedAppt?.document_id ||
          'N/A';

        const activeRefund =
          refundsByPaymentId[paymentId] || refundsByConsultationId[consultationId];

        if (matchedAppt) {
          const parsed = parseDate(matchedAppt.time || matchedAppt.appointment_time || matchedAppt.appointmentTime);
          if (parsed) apptTime = parsed;
        }

        // If apptTime is still null, attempt to parse from activeRefund.consultationDate
        if (!apptTime && activeRefund?.consultationDate) {
          const parsed = parseDate(activeRefund.consultationDate);
          if (parsed) apptTime = parsed;
        }

        let doctorName = 'Assigned Doctor';
        if (matchedAppt?.doctor_name) {
          doctorName = matchedAppt.doctor_name.trim();
        } else if (activeRefund?.doctorName) {
          doctorName = activeRefund.doctorName.trim();
        } else if (p.doctor_name) {
          doctorName = p.doctor_name.trim();
        } else if (p.description && p.description.includes('Consultation Deposit - ')) {
          doctorName = p.description.replace('Consultation Deposit - ', '').trim();
        }
        if (doctorName && !doctorName.toLowerCase().startsWith('dr.') && !doctorName.toLowerCase().startsWith('dr ')) {
          doctorName = `Dr. ${doctorName}`;
        }

        // Attendance & call details
        const userJoined = matchedAppt?.user_joined === true || activeRefund?.userJoined === true;
        const userJoinedAt = parseDate(matchedAppt?.user_joined_at || activeRefund?.userJoinedAt);
        const doctorJoined = matchedAppt?.doctor_joined === true || activeRefund?.doctorJoined === true;
        const doctorJoinedAt = parseDate(matchedAppt?.doctor_joined_at || activeRefund?.doctorJoinedAt);
        const callEndedAt = parseDate(matchedAppt?.call_ended_at || activeRefund?.callEndedAt);
        const callEndedBy = matchedAppt?.call_ended_by || activeRefund?.callEndedBy || null;

        let callDuration = activeRefund?.callDuration || null;
        if (!callDuration && userJoined && doctorJoined && userJoinedAt && doctorJoinedAt) {
          const uMs = userJoinedAt.getTime();
          const dMs = doctorJoinedAt.getTime();
          const startMs = Math.max(uMs, dMs);
          let endMs = Date.now();
          if (callEndedAt) {
            endMs = callEndedAt.getTime();
          }
          const diffSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
          if (diffSec < 60) {
            callDuration = `${diffSec} sec`;
          } else {
            const mins = Math.floor(diffSec / 60);
            const remSec = diffSec % 60;
            callDuration = remSec === 0 ? `${mins} min` : `${mins} min ${remSec} sec`;
          }
        }

        // Cancellation and refund advance checks
        const refundSubmittedAt = parseDate(activeRefund?.submittedAt);
        const refundRequestedInAdvance =
          refundSubmittedAt && apptTime && refundSubmittedAt.getTime() < apptTime.getTime();

        const apptStatus = (matchedAppt?.status || '').toString().toLowerCase();
        const wasCancelledByDoctor =
          apptStatus === 'cancelled_by_doctor' ||
          apptStatus === 'cancelled_doctor_deleted' ||
          apptStatus === 'cancelled_by_admin';
        const wasCancelledByUser =
          apptStatus === 'cancelled_by_user' ||
          apptStatus === 'cancelled';
        const wasCancelled = wasCancelledByDoctor || wasCancelledByUser;

        const cancelledAt = parseDate(
          matchedAppt?.cancelled_at ||
          matchedAppt?.cancelledAt ||
          matchedAppt?.canceled_at ||
          matchedAppt?.canceledAt
        );

        // Check if appointment was cancelled in advance:
        // - Scenario 2 & 3: Cancelled by doctor/admin -> 100% full refund
        // - Scenario 1: Cancelled by user before scheduled appointment start time -> 100% full refund
        // - Cancelled after start time: NOT cancelled in advance -> 50% refund for missed consultation
        let isCancelledInAdvance = false;
        if (wasCancelledByDoctor) {
          isCancelledInAdvance = true;
        } else if (wasCancelledByUser) {
          if (cancelledAt && apptTime) {
            isCancelledInAdvance = cancelledAt.getTime() < apptTime.getTime();
          } else if (!cancelledAt && apptTime) {
            isCancelledInAdvance = now.getTime() < apptTime.getTime();
          }
        }

        // Consultation window passed (15 mins after scheduled start time)
        const consultationWindowPassed =
          apptTime && (apptTime.getTime() + 15 * 60 * 1000) <= now.getTime();

        let isNoShow = false;
        if (
          consultationWindowPassed &&
          !userJoined &&
          !isCancelledInAdvance &&
          !refundRequestedInAdvance
        ) {
          isNoShow = true;
          consultationStatus = 'no_show';
        }

        // If a refund request has already been created, its stored values are authoritative!
        if (activeRefund) {
          if (typeof activeRefund.isNoShow === 'boolean') {
            isNoShow = activeRefund.isNoShow;
          }
          if (isNoShow) {
            consultationStatus = 'no_show';
          }
        }

        if (isNoShow) {
          noShowCount++;
        }

        // 30-day calculation
        const diffMs = now.getTime() - paymentDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const isWithin30Days = diffDays <= 30;
        const daysRemaining = Math.max(0, 30 - diffDays);
        const deadline = new Date(
          paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        let calculatedRefund = 50.0;
        let policyText = isCancelledInAdvance
          ? (wasCancelledByDoctor
              ? 'Full deposit refund eligible (Appointment was cancelled by doctor).'
              : 'Full deposit refund eligible (Appointment was cancelled).')
          : (refundRequestedInAdvance
              ? 'Full deposit refund eligible (Refund requested in advance).'
              : 'Full deposit refund eligible.');

        if (activeRefund) {
          if (typeof activeRefund.refundableAmount === 'number') {
            calculatedRefund = activeRefund.refundableAmount;
          }
          if (activeRefund.refundPolicy) {
            policyText = activeRefund.refundPolicy.replace(
              'because the consultation was not joined.',
              'because the consultation was missed.'
            );
          }
        } else if (isNoShow) {
          calculatedRefund = 25.0;
          policyText = '50% refund because the consultation was missed.';
        }

        items.push({
          paymentId,
          consultationId,
          doctorName,
          consultationDate: apptTime,
          paymentDate,
          depositAmount,
          paymentStatus: status,
          consultationStatus,
          isNoShow,
          isCancelled: isCancelledInAdvance,
          isWithin30Days,
          daysRemaining,
          deadline,
          calculatedRefund,
          policyText,
          refundRequest: activeRefund || null,
          userJoined,
          doctorJoined,
          callDuration,
          callEndedAt,
          callEndedBy,
        });
      }
    });

    items.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

    const aggregatedStats = {
      total: totalCount > 0 ? totalCount : completedCount + upcomingCount,
      paid: paidCount,
      unpaid: unpaidCount,
      completed: completedCount,
      upcoming: upcomingCount,
      noShow: noShowCount,
    };

    return { depositItems: items, stats: aggregatedStats };
  }, [purchases, upcomingAppts, historyAppts, refundRequests]);

  const handleOpenRefundModal = (item) => {
    setSelectedItem(item);
    setPatientMessage('Refund Deposit Request');
    setReceiptFile(null);
    setUploadProgress(0);
    setSubmitError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('File exceeds 10MB limit. Please choose a smaller file.');
      return;
    }
    setReceiptFile(file);
    setSubmitError('');
  };

  const handleSubmitRefund = async () => {
    if (!currentUser || !selectedItem) return;
    if (!patientMessage.trim()) {
      setSubmitError('Please enter a message or reason for the refund.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    let receiptUrl = null;
    let receiptStoragePath = null;

    try {
      // 1. Upload receipt if selected
      if (receiptFile) {
        const cleanName = receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        receiptStoragePath = `refund_receipts/${currentUser.uid}/${Date.now()}_${cleanName}`;
        const fileRef = storageRef(storage, receiptStoragePath);

        const uploadTask = uploadBytesResumable(fileRef, receiptFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => reject(error),
            async () => {
              receiptUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      // 2. Submit via Cloud Function
      const consultationDateStr = selectedItem.consultationDate
        ? (selectedItem.consultationDate instanceof Date
            ? selectedItem.consultationDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : String(selectedItem.consultationDate))
        : 'N/A';

      try {
        const submitFn = httpsCallable(functions, 'submitRefundRequest');
        await submitFn({
          paymentId: selectedItem.paymentId,
          consultationId: selectedItem.consultationId,
          doctorName: selectedItem.doctorName,
          consultationDate: consultationDateStr,
          patientMessage: patientMessage.trim(),
          receiptUrl,
          receiptStoragePath,
        });
      } catch (fnErr) {
        console.warn('Cloud Function error, falling back to direct Firestore write:', fnErr);
        // Direct write fallback
        const newReqId = doc(collection(db, 'refundRequests')).id;
        await setDoc(doc(db, 'refundRequests', newReqId), {
          id: newReqId,
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Patient',
          userEmail: currentUser.email || '',
          paymentId: selectedItem.paymentId,
          consultationId: selectedItem.consultationId || 'N/A',
          doctorName: selectedItem.doctorName || 'Assigned Doctor',
          consultationDate: consultationDateStr,
          depositAmount: selectedItem.depositAmount,
          refundableAmount: selectedItem.calculatedRefund,
          isNoShow: selectedItem.isNoShow,
          refundPolicy: selectedItem.policyText,
          status: 'waiting_for_approval',
          patientMessage: patientMessage.trim(),
          receiptUrl,
          receiptStoragePath,
          declineReason: null,
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          auditTrail: [
            {
              status: 'waiting_for_approval',
              changedBy: currentUser.uid,
              role: 'patient',
              timestamp: new Date().toISOString(),
              note: 'Refund request submitted from Web portal',
            },
          ],
        });
      }

      setSelectedItem(null);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to submit refund request:', err);
      setSubmitError(err.message || 'Failed to submit refund request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting_for_approval':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <ClockIcon className="w-3.5 h-3.5 mr-1" /> Waiting for Approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircleIcon className="w-3.5 h-3.5 mr-1" /> Approved
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircleIcon className="w-3.5 h-3.5 mr-1" /> Declined
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircleIcon className="w-3.5 h-3.5 mr-1" /> Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-[#C8996A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Refund Management</h1>
          <p className="text-sm text-[#6B6862]">
            View consultation deposit payment history, check refund eligibility, and track refund requests.
          </p>
        </div>
      </div>

      {/* Consultation Tracking Summary KPI Card */}
      <div className="bg-white border border-[#E7E2D9] rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C827A] mb-3">
          Consultation & Payment Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E2D9]">
            <p className="text-xl font-bold text-[#1A1A1A]">{stats.total}</p>
            <p className="text-[11px] font-medium text-[#6B6862]">Total</p>
          </div>
          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E2D9]">
            <p className="text-xl font-bold text-emerald-600">{stats.paid}</p>
            <p className="text-[11px] font-medium text-[#6B6862]">Paid</p>
          </div>
          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E2D9]">
            <p className="text-xl font-bold text-blue-600">{stats.completed}</p>
            <p className="text-[11px] font-medium text-[#6B6862]">Completed</p>
          </div>
          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E2D9]">
            <p className="text-xl font-bold text-[#C8996A]">{stats.upcoming}</p>
            <p className="text-[11px] font-medium text-[#6B6862]">Upcoming</p>
          </div>
          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E2D9]">
            <p className="text-xl font-bold text-amber-600">{stats.noShow}</p>
            <p className="text-[11px] font-medium text-[#6B6862]">Missed</p>
          </div>
        </div>
      </div>

      {/* Consultation Deposits List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#1A1A1A]">Consultation Deposits</h2>

        {depositItems.length === 0 ? (
          <div className="bg-white border border-[#E7E2D9] rounded-2xl p-10 text-center shadow-xs">
            <ReceiptRefundIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-[#1A1A1A]">
              No consultation payments found
            </p>
            <p className="text-xs text-[#6B6862] mt-1">
              When you pay a deposit to schedule a consultation, your records and refund options will appear here.
            </p>
          </div>
        ) : (
          depositItems.map((item) => {
            const req = item.refundRequest;
            const currentStatus = req ? req.status : 'pending';
            const canRequest =
              item.isWithin30Days &&
              (!req || req.status === 'pending');

            return (
              <div
                key={item.paymentId}
                className="bg-white border border-[#E7E2D9] rounded-2xl p-6 shadow-xs hover:shadow-md transition space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E7E2D9] gap-2">
                  <div>
                    <span className="text-xs font-mono text-gray-500">
                      ID: #{item.consultationId}
                    </span>
                    <h3 className="text-base font-bold text-[#1A1A1A] mt-0.5">
                      {item.doctorName}
                    </h3>
                  </div>
                  <div>{getStatusBadge(currentStatus)}</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#353535]">
                  {item.consultationDate && (
                    <p>
                      <span className="text-[#8C827A] font-medium">Consultation Date:</span>{' '}
                      {formatConsultationDate(item.consultationDate)}
                    </p>
                  )}
                  <p>
                    <span className="text-[#8C827A] font-medium">Payment Date:</span>{' '}
                    {item.paymentDate.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p>
                    <span className="text-[#8C827A] font-medium">Deposit Paid:</span>{' '}
                    <span className="font-bold text-[#1A1A1A]">
                      ${item.depositAmount.toFixed(2)} USD
                    </span>
                  </p>
                  <p>
                    <span className="text-[#8C827A] font-medium">Calculated Refund:</span>{' '}
                    <span className="font-bold text-[#C8996A]">
                      ${item.calculatedRefund.toFixed(2)} USD
                    </span>
                  </p>
                  {item.userJoined && item.doctorJoined && item.callDuration ? (
                    <p className="text-emerald-700 font-semibold sm:col-span-2">
                      <span className="text-[#8C827A] font-medium">Video Call Duration:</span>{' '}
                      Both Attended ({item.callDuration})
                    </p>
                  ) : item.isNoShow ? (
                    <p className="text-amber-700 font-medium sm:col-span-2">
                      <span className="text-[#8C827A] font-medium">Video Call Attendance:</span>{' '}
                      Missed
                    </p>
                  ) : null}
                </div>

                {/* No-show warning */}
                {item.isNoShow && (
                  <div className="flex items-center space-x-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <InformationCircleIcon className="w-4 h-4 shrink-0" />
                    <span>{item.policyText}</span>
                  </div>
                )}

                {/* 30-Day deadline status */}
                <div className="text-xs flex items-center justify-between text-[#8C827A] pt-1">
                  {item.isWithin30Days ? (
                    <p>
                      Refund available until:{' '}
                      <span className="font-semibold text-gray-700">
                        {item.deadline.toLocaleDateString()}
                      </span>{' '}
                      ({item.daysRemaining} days left)
                    </p>
                  ) : (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Refund Period Expired (30 days exceeded)
                    </span>
                  )}
                </div>

                {/* Decline Box */}
                {currentStatus === 'declined' && req && req.declineReason && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs">
                    <p className="font-bold text-red-800 flex items-center space-x-1 mb-1">
                      <XCircleIcon className="w-4 h-4 text-red-600" />
                      <span>Decline Reason</span>
                    </p>
                    <p className="text-red-700">{req.declineReason}</p>
                  </div>
                )}

                {/* Refunded Box */}
                {currentStatus === 'refunded' && req && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <p className="font-bold text-emerald-800 flex items-center space-x-1 mb-0.5">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                      <span>Refund Completed</span>
                    </p>
                    <p className="text-emerald-700">
                      Amount: ${(Number(req.refundableAmount) || 50.0).toFixed(2)} was refunded.
                    </p>
                  </div>
                )}

                {/* Action button */}
                {canRequest && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenRefundModal(item)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                    >
                      Request Refund
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================================= */}
      {/* SUBMIT REFUND REQUEST MODAL */}
      {/* ======================================================================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E7E2D9] space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-[#E7E2D9] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">
                  Request Consultation Refund
                </h3>
                <p className="text-xs text-[#8C827A] mt-0.5">
                  Consultation #{selectedItem.consultationId}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Refund Amount Card */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E7E2D9] space-y-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8C827A]">
                  Refundable Amount
                </span>
              </div>
              <p className="text-3xl font-extrabold text-[#C8996A]">
                ${selectedItem.calculatedRefund.toFixed(2)} USD
              </p>
              <p className="text-xs text-[#6B6862] flex items-center space-x-1">
                <InformationCircleIcon className="w-4 h-4 text-[#C8996A] shrink-0" />
                <span>{selectedItem.policyText}</span>
              </p>
            </div>

            {/* Consultation Details */}
            <div className="text-xs text-[#353535] space-y-1 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <p>
                <span className="font-semibold text-gray-700">Doctor:</span>{' '}
                {selectedItem.doctorName}
              </p>
              {selectedItem.consultationDate && (
                <p>
                  <span className="font-semibold text-gray-700">Consultation Date:</span>{' '}
                  {formatConsultationDate(selectedItem.consultationDate)}
                </p>
              )}
              <p>
                <span className="font-semibold text-gray-700">Deposit Paid:</span> $
                {selectedItem.depositAmount.toFixed(2)}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Payment Date:</span>{' '}
                {selectedItem.paymentDate.toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Deadline:</span>{' '}
                {selectedItem.deadline.toLocaleDateString()} (
                {selectedItem.daysRemaining} days remaining)
              </p>
            </div>

            {/* Patient Message */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6862]">
                Message / Reason *
              </label>
              <textarea
                rows={3}
                value={patientMessage}
                onChange={(e) => setPatientMessage(e.target.value)}
                placeholder="Explain the reason for your refund request..."
                className="w-full p-3 text-xs border border-[#E7E2D9] rounded-xl focus:border-[#C8996A] focus:ring-1 focus:ring-[#C8996A] focus:outline-hidden"
              />
            </div>

            {/* Receipt / Proof Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6862]">
                Deposit Receipt / Payment Proof
              </label>
              <p className="text-[11px] text-[#8C827A]">
                Attach receipt screenshot or statement proof (JPG, PNG, PDF up to 10MB)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {!receiptFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border border-dashed border-[#C8996A] rounded-xl text-xs font-semibold text-[#C8996A] hover:bg-[#FAF8F5] transition flex items-center justify-center space-x-2"
                >
                  <PaperClipIcon className="w-4 h-4" />
                  <span>Choose Receipt File</span>
                </button>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <PaperClipIcon className="w-4 h-4 text-[#C8996A] shrink-0" />
                    <span className="font-medium text-gray-800 truncate">
                      {receiptFile.name}
                    </span>
                    <span className="text-gray-500 shrink-0">
                      ({(receiptFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptFile(null)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold ml-2 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-2">
                  <div
                    className="bg-[#C8996A] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:bg-gray-100 rounded-full transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRefund}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* SUCCESS CONFIRMATION MODAL */}
      {/* ======================================================================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-[#E7E2D9] space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">
              Refund Request Submitted
            </h3>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Your refund request was submitted successfully and is waiting for admin approval. Our team will review your payment and process the refund.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
