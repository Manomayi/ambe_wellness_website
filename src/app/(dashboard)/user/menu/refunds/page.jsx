'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase/config';
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
  };

  // Build merged consultation deposit payment items & stats
  const { depositItems, stats } = useMemo(() => {
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
          cancelledBy: c.cancelled_by || (isCancelledByUser ? 'user' : (isCancelledByDoctor ? 'doctor' : null)),
          cancelledAt: parseDate(c.cancelled_at || c.cancelledAt),
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
  }, [consultations, refundRequests]);

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
                hour: 'numeric',
                minute: '2-digit',
              })
            : String(selectedItem.consultationDate))
        : 'N/A';

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
        consultationStatus: selectedItem.consultationStatus || (selectedItem.isCancelled ? 'cancelled_by_user' : null),
        isCancelled: selectedItem.isCancelled || false,
        cancelledBy: selectedItem.cancelledBy || (selectedItem.consultationStatus === 'cancelled_by_user' ? 'user' : (selectedItem.consultationStatus === 'cancelled_by_doctor' ? 'doctor' : null)),
        cancelledAt: selectedItem.cancelledAt || null,
        cancelledInAdvance: selectedItem.isCancelled || false,
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
        ...(selectedItem.consultationStatus ? { status: selectedItem.consultationStatus } : {}),
        ...(selectedItem.cancelledBy ? { cancelled_by: selectedItem.cancelledBy } : {}),
        ...(selectedItem.cancelledAt ? { cancelled_at: selectedItem.cancelledAt } : {}),
        refundable_amount: selectedItem.calculatedRefund,
        patient_message: patientMessage.trim(),
        ...(receiptUrl ? { receipt_url: receiptUrl } : {}),
        ...(receiptStoragePath ? { receipt_storage_path: receiptStoragePath } : {}),
        refund_submitted_at: serverTimestamp(),
        is_no_show: selectedItem.isNoShow,
      }, { merge: true });

      await setDoc(doc(db, 'refundRequests', reqId), refPayload, { merge: true });

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
                  {item.isCancelled ? (
                    <p className="text-orange-700 font-medium sm:col-span-2">
                      <span className="text-[#8C827A] font-medium">Consultation Status:</span>{' '}
                      Cancelled by {item.cancelledBy === 'doctor' ? 'Doctor' : 'You'}
                      {item.cancelledAt && (
                        <span className="text-[#8C827A] font-normal ml-1">
                          (on {formatConsultationDate(item.cancelledAt)})
                        </span>
                      )}
                    </p>
                  ) : item.userJoined && item.doctorJoined && item.callDuration ? (
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
              {selectedItem.isCancelled && (
                <p className="text-orange-700 font-medium">
                  <span className="font-semibold text-gray-700">Status:</span>{' '}
                  Cancelled by {selectedItem.cancelledBy === 'doctor' ? 'Doctor' : 'You'}
                  {selectedItem.cancelledAt && (
                    <span className="text-gray-500 font-normal ml-1">
                      (on {formatConsultationDate(selectedItem.cancelledAt)})
                    </span>
                  )}
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
