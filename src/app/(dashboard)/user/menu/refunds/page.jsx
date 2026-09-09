'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage, functions } from '@/lib/firebase/config';
import {
  decideRefund,
  formatSeconds,
  formatCallDuration,
  OUTCOME,
} from '@/lib/refundPolicy';
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
  const [consultations, setConsultations] = useState([]);

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

    const useNewRefundFlow = process.env.NEXT_PUBLIC_USE_NEW_REFUND_FLOW !== 'false';
    if (useNewRefundFlow) {
      const consultQ = query(
        collection(db, 'consultations'),
        where('user_id', '==', uid)
      );
      const unsubConsult = onSnapshot(consultQ, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setConsultations(list);
      });

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
        unsubConsult();
        unsubRefunds();
      };
    }

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
    const useNewRefundFlow = process.env.NEXT_PUBLIC_USE_NEW_REFUND_FLOW !== 'false';
    if (useNewRefundFlow) {
      const refundsMap = {};
      refundRequests.forEach((r) => {
        if (r.id) refundsMap[r.id] = r;
        if (r.consultationId && r.consultationId !== 'N/A') {
          refundsMap[r.consultationId] = r;
        }
      });

      const now = new Date();
      let paidCount = 0;
      let unpaidCount = 0;
      let completedCount = 0;
      let upcomingCount = 0;
      let cancelledCount = 0;
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

      const items = consultations.map((c) => {
        const consultationId = c.id;
        const doctorName = c.doctor_name || 'Assigned Doctor';
        const formattedDoctor = (doctorName && !doctorName.toLowerCase().startsWith('dr.') && !doctorName.toLowerCase().startsWith('dr '))
          ? `Dr. ${doctorName}`
          : doctorName;

        const rawAmount = c.deposit_amount ?? 50.0;
        const depositAmount = Number(rawAmount) || 50.0;
        const paymentId = c.payment_id || c.payment_intent_id || consultationId;
        const paymentStatus = (c.payment_status || 'succeeded').toLowerCase();

        const consultationDate = parseDate(c.time || c.scheduled_at);
        const paymentDate = parseDate(c.created_at || c.created) || consultationDate || now;

        const userJoined = c.user_joined === true;
        const userJoinedAt = parseDate(c.user_joined_at);
        const doctorJoined = c.doctor_joined === true;
        const doctorJoinedAt = parseDate(c.doctor_joined_at);
        const callEndedAt = parseDate(c.call_ended_at);
        const callEndedBy = c.call_ended_by;

        const rawStatus = (c.status || 'scheduled').toLowerCase();
        const isCancelledByUser = rawStatus === 'cancelled_by_user' || rawStatus === 'cancelled';
        const isCancelledByDoctor = rawStatus.includes('cancelled_by_doctor') || rawStatus.includes('cancelled_doctor');
        const isCancelled = isCancelledByUser || isCancelledByDoctor;

        const refundReq = refundsMap[consultationId] || null;

        const diffDays = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        const isWithin30Days = diffDays <= 30;
        const daysRemaining = Math.max(0, 30 - diffDays);
        const deadline = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        let isNoShow = false;
        let isUpcoming = false;
        let calculatedRefund = 50.0;
        let policyText = 'Full deposit refund eligible.';

        if (refundReq) {
          calculatedRefund = refundReq.refundableAmount ?? 50.0;
          policyText = refundReq.refundPolicy || 'Full deposit refund eligible.';
          isNoShow = refundReq.isNoShow === true;
        } else if (!isWithin30Days) {
          calculatedRefund = 0.0;
          policyText = 'Refund period expired (exceeded 30 days).';
        } else if (isCancelled) {
          calculatedRefund = 50.0;
          policyText = isCancelledByDoctor
            ? 'Full deposit refund eligible (Appointment was cancelled by doctor).'
            : 'Full deposit refund eligible (Appointment was cancelled).';
        } else if (userJoined && doctorJoined) {
          calculatedRefund = 50.0;
          policyText = 'Full deposit refund eligible (Consultation completed).';
        } else if (userJoined && !doctorJoined) {
          calculatedRefund = 50.0;
          policyText = 'Full deposit refund eligible (Doctor was absent).';
        } else {
          const sessionEnded = Boolean(callEndedAt || rawStatus === 'completed');
          const windowPassed = sessionEnded || (consultationDate && now.getTime() >= (consultationDate.getTime() + 60 * 60 * 1000));
          if (!windowPassed && consultationDate) {
            isUpcoming = true;
            calculatedRefund = 0.0;
            policyText = 'Refund locked until the consultation ends or is cancelled.';
          } else {
            isNoShow = true;
            calculatedRefund = 25.0;
            policyText = '50% refund because the consultation was missed.';
          }
        }

        let consultationStatus = rawStatus;
        if (isNoShow) {
          consultationStatus = 'no_show';
          noShowCount++;
        } else if (userJoined && !doctorJoined && !isCancelled) {
          consultationStatus = 'doctor_absent';
        } else if (userJoined && doctorJoined) {
          consultationStatus = 'completed';
          completedCount++;
        } else if (isCancelled) {
          cancelledCount++;
        }

        if (isUpcoming) upcomingCount++;

        if (paymentStatus === 'succeeded' || paymentStatus === 'paid') {
          paidCount++;
        } else {
          unpaidCount++;
        }

        const callDuration = (userJoined && doctorJoined) ? (c.call_duration || null) : null;
        const canRequestRefund = isWithin30Days && !refundReq && !isUpcoming;

        return {
          paymentId,
          consultationId,
          doctorName: formattedDoctor,
          consultationDate,
          paymentDate,
          depositAmount,
          paymentStatus,
          consultationStatus,
          isNoShow,
          isWithin30Days,
          daysRemaining,
          deadline,
          calculatedRefund,
          policyText,
          refundRequest: refundReq,
          isCancelled,
          isUpcoming,
          canRequestRefund,
          userJoined,
          userJoinedAt,
          doctorJoined,
          doctorJoinedAt,
          callEndedAt,
          callEndedBy,
          callDuration,
        };
      });

      items.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

      return {
        depositItems: items,
        stats: {
          total: items.length,
          paid: paidCount,
          unpaid: unpaidCount,
          completed: completedCount,
          upcoming: upcomingCount,
          noShow: noShowCount,
        },
      };
    }

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

    const candidates = [];

    purchases.forEach((p) => {
      const type = (p.type || '').toLowerCase();
      if (
        type === 'consultation' ||
        type === 'consultation_deposit' ||
        type === 'deposit'
      ) {
        const paymentId = p.id;
        const status = (p.status || 'succeeded').toLowerCase();

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
            a.payment_intent_id === paymentId ||
            (p.consultation_id && (a.id === p.consultation_id || a.appointment_id === p.consultation_id || a.original_appointment_id === p.consultation_id)) ||
            a.appointment_id === paymentId ||
            a.id === paymentId
          ) {
            matchedAppt = a;
            const rawSt = (a.status || '').toString().toLowerCase();
            consultationStatus = rawSt || 'upcoming';
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
              a.payment_intent_id === paymentId ||
              (p.consultation_id && (a.id === p.consultation_id || a.document_id === p.consultation_id || a.appointment_id === p.consultation_id || a.original_appointment_id === p.consultation_id)) ||
              a.appointment_id === paymentId ||
              a.id === paymentId
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
              const rawSt = (a.status || '').toString().toLowerCase();
              consultationStatus = rawSt || 'upcoming';
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
          matchedAppt?.original_appointment_id ||
          p.consultation_id ||
          p.appointment_id ||
          matchedAppt?.id ||
          matchedAppt?.appointment_id ||
          matchedAppt?.document_id ||
          'N/A';

        const candidateConsultationIds = [
          consultationId,
          paymentId,
          p.payment_intent_id,
          p.consultation_id,
          p.appointment_id,
          matchedAppt?.id,
          matchedAppt?.appointment_id,
          matchedAppt?.original_appointment_id,
          matchedAppt?.document_id,
        ].filter((id) => Boolean(id) && id !== 'N/A');

        let activeRefund = null;
        for (const cid of candidateConsultationIds) {
          if (refundsByConsultationId[cid]) {
            activeRefund = refundsByConsultationId[cid];
            break;
          }
        }

        if (!activeRefund && refundsByPaymentId[paymentId]) {
          const cand = refundsByPaymentId[paymentId];
          if (
            !cand.consultationId ||
            cand.consultationId === 'N/A' ||
            cand.consultationId === paymentId ||
            (p.payment_intent_id && cand.consultationId === p.payment_intent_id) ||
            candidateConsultationIds.includes(cand.consultationId)
          ) {
            activeRefund = cand;
          }
        }

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
        if (matchedAppt?.doctor_name && !matchedAppt.doctor_name.includes('Pending Assignment')) {
          doctorName = matchedAppt.doctor_name.trim();
        } else if (p.doctor_name && !p.doctor_name.includes('Pending Assignment')) {
          doctorName = p.doctor_name.trim();
        } else if (activeRefund?.doctorName && !activeRefund.doctorName.includes('Assigned Doctor')) {
          doctorName = activeRefund.doctorName.trim();
        } else if (p.description && p.description.includes('Consultation Deposit - ')) {
          const extracted = p.description.replace('Consultation Deposit - ', '').trim();
          if (!extracted.includes('Pending Assignment') && extracted !== 'Doctor' && extracted) {
            doctorName = extracted;
          }
        }
        if (doctorName && !doctorName.toLowerCase().startsWith('dr.') && !doctorName.toLowerCase().startsWith('dr ') && doctorName !== 'Assigned Doctor') {
          doctorName = `Dr. ${doctorName}`;
        }

        candidates.push({
          paymentId,
          p,
          paymentDate,
          depositAmount,
          status,
          matchedAppt,
          apptTime,
          doctorName,
          consultationId,
          consultationStatus,
          activeRefund,
          linkedStripePaymentIntentId: null,
        });
      }
    });

    // Deduplicate candidates representing the same consultation booking
    const duplicateIndices = new Set();
    for (let i = 0; i < candidates.length; i++) {
      if (duplicateIndices.has(i)) continue;
      const c1 = candidates[i];
      const c1HasAppt = Boolean(c1.matchedAppt || c1.apptTime);

      for (let j = i + 1; j < candidates.length; j++) {
        if (duplicateIndices.has(j)) continue;
        const c2 = candidates[j];
        const c2HasAppt = Boolean(c2.matchedAppt || c2.apptTime);

        let isDuplicate = false;
        let keepIdx = i;
        let dropIdx = j;

        if (c1HasAppt !== c2HasAppt) {
          const linked = c1HasAppt ? c1 : c2;
          const orphan = c1HasAppt ? c2 : c1;
          const linkedIdx = c1HasAppt ? i : j;
          const orphanIdx = c1HasAppt ? j : i;

          const linkedIntentId = linked.p?.payment_intent_id ? String(linked.p.payment_intent_id) : '';
          const orphanIntentId = orphan.p?.payment_intent_id ? String(orphan.p.payment_intent_id) : '';

          const intentMatches = (linkedIntentId && linkedIntentId === orphan.paymentId) ||
            (orphanIntentId && orphanIntentId === linked.paymentId);

          const timeDiffMinutes = Math.abs(linked.paymentDate.getTime() - orphan.paymentDate.getTime()) / (1000 * 60);
          const isCloseTime = timeDiffMinutes <= 5;
          const sameAmount = Math.abs(orphan.depositAmount - linked.depositAmount) < 0.01;
          const isStripePair = orphan.paymentId.startsWith('pi_') && linked.paymentId.startsWith('deposit_');

          if (intentMatches || (isStripePair && isCloseTime && sameAmount)) {
            isDuplicate = true;
            keepIdx = linkedIdx;
            dropIdx = orphanIdx;

            if (orphan.paymentId.startsWith('pi_')) {
              candidates[linkedIdx].linkedStripePaymentIntentId = orphan.paymentId;
            }
          }
        } else if (c1HasAppt && c2HasAppt) {
          if (
            (c1.consultationId && c1.consultationId !== 'N/A' && c1.consultationId === c2.consultationId) ||
            (c1.matchedAppt && c2.matchedAppt && (c1.matchedAppt.id || c1.matchedAppt.appointment_id) === (c2.matchedAppt.id || c2.matchedAppt.appointment_id))
          ) {
            isDuplicate = true;
            if (c2.paymentId.startsWith('pi_') && !c1.paymentId.startsWith('pi_')) {
              keepIdx = j;
              dropIdx = i;
            } else {
              keepIdx = i;
              dropIdx = j;
              if (c2.paymentId.startsWith('pi_')) {
                candidates[i].linkedStripePaymentIntentId = c2.paymentId;
              }
            }
          }
        }

        if (isDuplicate) {
          duplicateIndices.add(dropIdx);
        }
      }
    }

    const items = [];
    const claimedRefundRequestIds = new Set();

    // Upcoming appointments that no purchase managed to claim.
    //
    // A deposit that could not be matched to an appointment is not
    // automatically refundable: the patient may simply have a booked
    // consultation whose link to the payment was never written. Treating
    // "no appointment found" as "nothing was booked" offered a full refund on
    // a deposit paying for a consultation that has not happened yet, which is
    // scenario 8 and must be locked.
    let unclaimedUpcomingRemaining = upcomingAppts.filter((a) => {
      const apptId = String(a.id || a.appointment_id || '');
      if (apptId && claimedAppointmentIds.has(apptId)) return false;
      const st = String(a.status || '').toLowerCase();
      return !st.includes('cancel');
    }).length;

    for (let i = 0; i < candidates.length; i++) {
      if (duplicateIndices.has(i)) continue;
      const c = candidates[i];

      totalCount++;
      const paymentId = c.linkedStripePaymentIntentId || c.paymentId;
      const status = c.status;
      if (status === 'succeeded' || status === 'paid') {
        paidCount++;
      } else {
        unpaidCount++;
      }

      const paymentDate = c.paymentDate;
      const depositAmount = c.depositAmount;
      const matchedAppt = c.matchedAppt;
      let apptTime = c.apptTime;
      const doctorName = c.doctorName;
      const consultationId = c.consultationId;
      let consultationStatus = c.consultationStatus;

      const candidatePaymentIds = [
        paymentId,
        c.paymentId,
        c.linkedStripePaymentIntentId,
        c.p?.payment_intent_id,
        c.p?.id,
      ].filter(Boolean);

      const candidateConsultationIds = [
        consultationId,
        c.p?.consultation_id,
        c.p?.appointment_id,
        matchedAppt?.id,
        matchedAppt?.appointment_id,
        matchedAppt?.original_appointment_id,
        matchedAppt?.document_id,
      ].filter((id) => Boolean(id) && id !== 'N/A');

      let activeRefund = null;

      // 1. Priority A: Match by unique payment ID among unclaimed refund requests
      for (const r of refundRequests) {
        if (claimedRefundRequestIds.has(r.id)) continue;
        const rPayId = r.paymentId || r.payment_id;
        if (rPayId && candidatePaymentIds.includes(rPayId)) {
          activeRefund = r;
          claimedRefundRequestIds.add(r.id);
          break;
        }
      }

      // 2. Priority B: Match by consultation ID among unclaimed refund requests
      if (!activeRefund) {
        for (const r of refundRequests) {
          if (claimedRefundRequestIds.has(r.id)) continue;
          const rConsId = r.consultationId || r.consultation_id;
          if (rConsId && rConsId !== 'N/A' && candidateConsultationIds.includes(rConsId)) {
            activeRefund = r;
            claimedRefundRequestIds.add(r.id);
            break;
          }
        }
      }

      // Attendance & call details
      const userJoined = matchedAppt?.user_joined === true || activeRefund?.userJoined === true;
      const userJoinedAt = parseDate(matchedAppt?.user_joined_at || activeRefund?.userJoinedAt);
      const doctorJoined = matchedAppt?.doctor_joined === true || activeRefund?.doctorJoined === true;
      const doctorJoinedAt = parseDate(matchedAppt?.doctor_joined_at || activeRefund?.doctorJoinedAt);
      const callEndedAt = parseDate(matchedAppt?.call_ended_at || activeRefund?.callEndedAt);
      const callEndedBy = matchedAppt?.call_ended_by || activeRefund?.callEndedBy || null;

      // Only a JOINT call has a duration to show. The old fallback to
      // `doctor_work_duration_seconds` was the doctor's own time in the room,
      // which is non-zero even when they sat there alone — so a consultation
      // the patient missed displayed a call length as if it had happened.
      let callDuration = null;
      if (userJoined && doctorJoined) {
        callDuration =
          (activeRefund?.callDuration && activeRefund.callDuration !== '0 sec')
            ? activeRefund.callDuration
            : (matchedAppt?.call_duration && matchedAppt.call_duration !== '0 sec'
                ? matchedAppt.call_duration
                : null);

        if (!callDuration) {
          callDuration = formatSeconds(Number(matchedAppt?.call_duration_seconds));
        }
        if (!callDuration) {
          callDuration = formatCallDuration({
            userJoined,
            doctorJoined,
            userJoinedAt,
            doctorJoinedAt,
            callEndedAt,
            nowMs: now.getTime(),
          });
        }
      }

      // Cancellation checks. Note there is deliberately no
      // "refund requested in advance" special case any more: requesting a
      // refund early does not change whether the patient turned up, and using
      // it as a full-refund shortcut let a no-show claim the whole deposit.
      const apptStatus = (matchedAppt?.status || '').toString().toLowerCase();
      const wasCancelledByDoctor =
        apptStatus === 'cancelled_by_doctor' ||
        apptStatus === 'cancelled_doctor_deleted' ||
        apptStatus === 'cancelled_by_admin';
      const wasCancelledByUser =
        apptStatus === 'cancelled_by_user' ||
        apptStatus === 'cancelled';

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

      // 30-day calculation
      const diffMs = now.getTime() - paymentDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const isWithin30Days = diffDays <= 30;
      const daysRemaining = Math.max(0, 30 - diffDays);
      const deadline = new Date(
        paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      // One decision, shared with the Cloud Functions that store the amount and
      // with the Flutter app, so the figure the patient is shown here is the
      // figure the admin panel approves. The previous branch treated ANY ended
      // call as a completed consultation worth a full refund, which is why a
      // doctor who joined alone and hung up left this page showing "Completed"
      // and $50.00 instead of a missed consultation and $25.00.
      const recordedOutcome = (
        matchedAppt?.consultation_outcome || matchedAppt?.status || null
      );
      // This deposit has no appointment of its own, but the patient has a
      // booked consultation that no other deposit is paying for. Assume this
      // is the one funding it and lock the refund until that call is over.
      let fundsPendingAppointment = false;
      if (!apptTime && !activeRefund && unclaimedUpcomingRemaining > 0) {
        fundsPendingAppointment = true;
        unclaimedUpcomingRemaining -= 1;
      }

      const decision = decideRefund({
        nowMs: now.getTime(),
        appointmentTimeMs: apptTime ? apptTime.getTime() : null,
        cancelledAtMs: cancelledAt ? cancelledAt.getTime() : null,
        userJoined,
        doctorJoined,
        status: wasCancelledByDoctor
          ? 'cancelled_by_doctor'
          : wasCancelledByUser
            ? 'cancelled_by_user'
            : (recordedOutcome ? String(recordedOutcome).toLowerCase() : null),
        paymentDateMs: paymentDate ? paymentDate.getTime() : null,
        depositAmount,
        hasPendingAppointment: fundsPendingAppointment,
      });

      let calculatedRefund = decision.refundableAmount;
      let policyText = decision.policyText;

      // Attendance-derived flags now come from the same decision as the
      // amount, so the badge, the policy sentence and the figure can never
      // describe three different scenarios.
      let isNoShow = decision.isNoShow;
      const isUpcomingConsultation = decision.isUpcoming;
      if (isNoShow) {
        consultationStatus = 'no_show';
      } else if (decision.outcome === OUTCOME.MISSED_BY_DOCTOR) {
        consultationStatus = 'doctor_absent';
      } else if (decision.outcome === OUTCOME.COMPLETED) {
        consultationStatus = 'completed';
      }

      // A stored refund request is authoritative for the AMOUNT: it is what the
      // admin panel approves and pays out, so the page must never display a
      // different number from the one on record.
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
        if (typeof activeRefund.isNoShow === 'boolean') {
          isNoShow = activeRefund.isNoShow;
          if (isNoShow) consultationStatus = 'no_show';
        }
      }

      if (isNoShow) {
        noShowCount++;
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
        isUpcoming: isUpcomingConsultation,
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

      if (process.env.NEXT_PUBLIC_USE_NEW_REFUND_FLOW !== 'false') {
        const reqId = selectedItem.consultationId;
        const refPayload = {
          id: reqId,
          userId: currentUser.uid,
          user_id: currentUser.uid,
          userName: currentUser.displayName || 'Patient',
          userEmail: currentUser.email || '',
          paymentId: selectedItem.paymentId,
          payment_id: selectedItem.paymentId,
          consultationId: reqId,
          consultation_id: reqId,
          doctorName: selectedItem.doctorName || 'Assigned Doctor',
          doctor_name: selectedItem.doctorName || 'Assigned Doctor',
          consultationDate: consultationDateStr,
          depositAmount: selectedItem.depositAmount,
          refundableAmount: selectedItem.calculatedRefund,
          isNoShow: selectedItem.isNoShow,
          refundPolicy: selectedItem.policyText,
          userJoined: selectedItem.userJoined === true,
          userJoinedAt: selectedItem.userJoinedAt || null,
          doctorJoined: selectedItem.doctorJoined === true,
          doctorJoinedAt: selectedItem.doctorJoinedAt || null,
          callDuration: selectedItem.callDuration || null,
          callEndedAt: selectedItem.callEndedAt || null,
          callEndedBy: selectedItem.callEndedBy || null,
          status: 'waiting_for_approval',
          patientMessage: patientMessage.trim(),
          receiptUrl: receiptUrl || null,
          receiptStoragePath: receiptStoragePath || null,
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
              note: 'Refund request submitted by patient',
            },
          ],
        };

        await setDoc(doc(db, 'consultations', reqId), {
          refund_status: 'waiting_for_approval',
          refundable_amount: selectedItem.calculatedRefund,
          patient_message: patientMessage.trim(),
          ...(receiptUrl ? { receipt_url: receiptUrl } : {}),
          ...(receiptStoragePath ? { receipt_storage_path: receiptStoragePath } : {}),
          refund_submitted_at: serverTimestamp(),
          is_no_show: selectedItem.isNoShow,
        }, { merge: true });

        await setDoc(doc(db, 'refundRequests', reqId), refPayload, { merge: true });

        setSelectedItem(null);
        setIsSubmitting(false);
        setShowSuccessModal(true);
        return;
      }

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
          user_id: currentUser.uid,
          userName: currentUser.displayName || 'Patient',
          userEmail: currentUser.email || '',
          paymentId: selectedItem.paymentId,
          payment_id: selectedItem.paymentId,
          consultationId: selectedItem.consultationId || 'N/A',
          consultation_id: selectedItem.consultationId || 'N/A',
          doctorName: selectedItem.doctorName || 'Assigned Doctor',
          doctor_name: selectedItem.doctorName || 'Assigned Doctor',
          consultationDate: consultationDateStr,
          depositAmount: selectedItem.depositAmount,
          refundableAmount: selectedItem.calculatedRefund,
          isNoShow: selectedItem.isNoShow,
          refundPolicy: selectedItem.policyText,
          userJoined: selectedItem.userJoined === true,
          userJoinedAt: selectedItem.userJoinedAt || null,
          doctorJoined: selectedItem.doctorJoined === true,
          doctorJoinedAt: selectedItem.doctorJoinedAt || null,
          callDuration: selectedItem.callDuration || null,
          callEndedAt: selectedItem.callEndedAt || null,
          callEndedBy: selectedItem.callEndedBy || null,
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

  const getStatusBadge = (status, item = null) => {
    if (!item?.refundRequest) {
      if (item?.isUpcoming) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <ClockIcon className="w-3.5 h-3.5 mr-1" /> Upcoming
          </span>
        );
      }
      if (item && !item.isWithin30Days) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircleIcon className="w-3.5 h-3.5 mr-1" /> Expired
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFD3AC]/30 text-[#1A1A1A] border border-[#FFD3AC]">
          Eligible for Refund
        </span>
      );
    }

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E2D9]">
            <p className="text-xl font-bold text-[#1A1A1A]">{stats.total}</p>
            <p className="text-[11px] font-medium text-[#6B6862]">Total</p>
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
          depositItems.map((item, idx) => {
            const req = item.refundRequest;
            const currentStatus = req ? req.status : 'pending';
            const canRequest =
              item.isWithin30Days &&
              !item.isUpcoming &&
              !req;

            return (
              <div
                key={item.consultationId || `${item.paymentId}_${idx}`}
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
                  <div>{getStatusBadge(currentStatus, item)}</div>
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
                      {item.isUpcoming && !req
                        ? '$0.00 (Locked)'
                        : `$${item.calculatedRefund.toFixed(2)} USD`}
                    </span>
                  </p>
                  {item.userJoined && item.doctorJoined && item.callDuration ? (
                    <p className="text-emerald-700 font-semibold sm:col-span-2">
                      <span className="text-[#8C827A] font-medium">Video Call Duration:</span>{' '}
                      Both Attended ({item.callDuration})
                    </p>
                  ) : item.consultationStatus === 'completed' || item.callEndedAt ? (
                    <p className="text-emerald-700 font-semibold sm:col-span-2">
                      <span className="text-[#8C827A] font-medium">Video Call Attendance:</span>{' '}
                      {item.callDuration ? `Completed (${item.callDuration})` : 'Completed'}
                    </p>
                  ) : item.userJoined && !item.doctorJoined && !item.isUpcoming ? (
                    <p className="text-amber-700 font-medium sm:col-span-2">
                      <span className="text-[#8C827A] font-medium">Video Call Attendance:</span>{' '}
                      Doctor Absent
                    </p>
                  ) : item.isNoShow ? (
                    <p className="text-amber-700 font-medium sm:col-span-2">
                      <span className="text-[#8C827A] font-medium">Video Call Attendance:</span>{' '}
                      Missed
                    </p>
                  ) : item.isUpcoming ? (
                    <p className="text-[#8C827A] font-medium sm:col-span-2">
                      <span className="text-[#8C827A] font-medium">Video Call Attendance:</span>{' '}
                      Upcoming
                    </p>
                  ) : null}
                </div>

                {/* Upcoming or No-show notice */}
                {item.isUpcoming && !req ? (
                  <div className="flex items-center space-x-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <InformationCircleIcon className="w-4 h-4 shrink-0" />
                    <span>Consultation scheduled. You must complete or cancel your consultation before requesting a refund.</span>
                  </div>
                ) : item.isNoShow ? (
                  <div className="flex items-center space-x-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <InformationCircleIcon className="w-4 h-4 shrink-0" />
                    <span>{item.policyText}</span>
                  </div>
                ) : null}

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

                {/* Waiting for Approval Box */}
                {currentStatus === 'waiting_for_approval' && req && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                    <p className="font-bold text-amber-800 flex items-center space-x-1.5">
                      <ClockIcon className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Refund Request Submitted</span>
                    </p>
                    <p className="text-amber-700">
                      Your refund request was submitted and is waiting for admin approval.
                    </p>
                    {req.patientMessage && (
                      <p className="text-gray-600">Reason: {req.patientMessage}</p>
                    )}
                  </div>
                )}

                {/* Approved / Processing Box */}
                {currentStatus === 'approved' && req && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs space-y-1">
                    <p className="font-bold text-blue-800 flex items-center space-x-1.5">
                      <CheckCircleIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Refund Approved</span>
                    </p>
                    <p className="text-blue-700">
                      Your refund request has been approved by admin and is being processed.
                    </p>
                  </div>
                )}

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
              onClick={() => {
                setShowSuccessModal(false);
                setSelectedItem(null);
              }}
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
