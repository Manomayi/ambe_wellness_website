"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { httpsCallable } from 'firebase/functions';
import { db, functions } from "@/lib/firebase/config";
import { matchUserWithDoctor } from "@/lib/doctorMatching";
import { getConsultationStatusInfo } from "@/lib/consultationStatus";
import UserQuestionnaireModal from "@/components/user/UserQuestionnaireModal";
import ExtendedQuestionnaireModal from "@/components/user/ExtendedQuestionnaireModal";
import {
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  XCircleIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import WebLayoutWrapper from "@/components/common/WebLayoutWrapper";

// Health field mapping
const HEALTH_FIELD_LABELS = {
  general_health: "General Health",
  womens_health: "Women's Health",
  mens_health: "Men's Health",
  muscular_skeletal: "Muscular Skeletal",
  heart_health: "Heart Health",
  skin_hair_health: "Skin & Hair Health",
  mental_emotional_health: "Mental Emotional Health",
  digestive_metabolic: "Digestive & Metabolic",
  oncology: "Oncology",
  disabilities: "Disabilities",
  behavorial: "Behavorial",
  unknown: "General Health"
};

const CLINICAL_SPECIALTIES = [
  { value: 'general_health', label: 'General Health', icon: '🏥' },
  { value: 'womens_health', label: "Women's Health", icon: '👩‍⚕️' },
  { value: 'mens_health', label: "Men's Health", icon: '👨‍⚕️' },
  { value: 'muscular_skeletal', label: 'Muscular Skeletal', icon: '🦴' },
  { value: 'heart_health', label: 'Heart Health', icon: '❤️' },
  { value: 'skin_hair_health', label: 'Skin & Hair Health', icon: '✨' },
  { value: 'mental_emotional_health', label: 'Mental Emotional Health', icon: '🧠' },
  { value: 'digestive_metabolic', label: 'Digestive & Metabolic', icon: '🍎' },
  { value: 'oncology', label: 'Oncology', icon: '🎗️' },
  { value: 'disabilities', label: 'Disabilities', icon: '♿' },
  { value: 'behavorial', label: 'Behavioral', icon: '🧩' },
];

const getHealthFieldLabel = (key) => {
  return HEALTH_FIELD_LABELS[key] || key;
};

const getHealthFieldLabels = (keys) => {
  if (!keys || !Array.isArray(keys)) return [];
  return keys.map(key => getHealthFieldLabel(key));
};

export default function UserConsultPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [checkingInstant, setCheckingInstant] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [matchingSpecialty, setMatchingSpecialty] = useState(false);
  const [specialtyError, setSpecialtyError] = useState("");
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [showExtendedQuestionnaireModal, setShowExtendedQuestionnaireModal] = useState(false);
  const [showActiveAppointmentModal, setShowActiveAppointmentModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // Check if patient already has an active appointment
  const activeAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  const hasActiveAppointment = Boolean(activeAppointment || profile?.is_consultation_set === true);

  // Resolve doctor UID from profile
  const resolvedDoctorUid = 
    profile?.doctor?.uid || 
    (typeof profile?.doctor === 'string' ? profile.doctor : null) || 
    profile?.doctor_uid || 
    profile?.matched_doctor || 
    profile?.doctor_id || 
    null;

  const handleScheduleClick = () => {
    // If appointment is already booked, prevent 2nd booking and show Hold On dialog
    if (hasActiveAppointment) {
      setShowActiveAppointmentModal(true);
      return;
    }

    router.push('/user/consult/schedule');
  };

  const resolvingSetRef = useRef(new Set());

  const autoResolveExpiredConsultation = async (appt, docId) => {
    if (!user) return;
    const appointmentId = (appt.appointment_id || docId || '').toString();
    if (!appointmentId || resolvingSetRef.current.has(appointmentId)) return;
    resolvingSetRef.current.add(appointmentId);

    const doctorUid = appt.doctor_id || appt.doctor_uid || resolvedDoctorUid;
    const userJoined = appt.user_joined === true;
    const doctorJoined = appt.doctor_joined === true;

    let resolvedStatus = "no_show";
    let isNoShow = true;
    if (userJoined && doctorJoined) {
      resolvedStatus = "completed";
      isNoShow = false;
    } else if (userJoined && !doctorJoined) {
      resolvedStatus = "doctor_absent";
      isNoShow = false;
    } else {
      resolvedStatus = "no_show";
      isNoShow = true;
    }

    try {
      const batch = writeBatch(db);
      const historyData = {
        ...appt,
        status: resolvedStatus,
        is_no_show: isNoShow,
        auto_resolved: true,
        resolved_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const userUpcomingRef = doc(db, 'users', user.uid, 'appointments_upcoming', appointmentId);
      const userHistoryRef = doc(db, 'users', user.uid, 'appointments_history', appointmentId);
      batch.delete(userUpcomingRef);
      batch.set(userHistoryRef, historyData, { merge: true });
      batch.update(doc(db, 'users', user.uid), { is_consultation_set: false });

      if (doctorUid) {
        const docUpcomingRef = doc(db, 'doctors', doctorUid, 'appointments_upcoming', appointmentId);
        const docHistoryRef = doc(db, 'doctors', doctorUid, 'appointments_history', appointmentId);
        batch.delete(docUpcomingRef);
        batch.set(docHistoryRef, historyData, { merge: true });
      }

      const consultRef = doc(db, 'consultations', appointmentId);
      batch.set(consultRef, {
        status: resolvedStatus,
        is_no_show: isNoShow,
        auto_resolved: true,
        resolved_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await batch.commit();
      console.log(`Auto-resolved expired consultation ${appointmentId} to ${resolvedStatus}`);
    } catch (e) {
      console.warn("Error auto-resolving expired consultation:", e);
    }
  };

  const handleRescheduleClick = (appointment) => {
    if (appointment?.time) {
      const apptDate = appointment.time.toDate ? appointment.time.toDate() : new Date(appointment.time);
      const diffFromStart = (Date.now() - apptDate.getTime()) / (1000 * 60);
      if (diffFromStart > 60) {
        alert('This appointment time has already expired and cannot be rescheduled.');
        return;
      }
    }
    const apptId = appointment?.id || appointment?.appointment_id || '';
    router.push(`/user/consult/schedule?reschedule=true&appointmentId=${apptId}`);
  };

  const handleCheckInstantAvailability = async () => {
    if (!user) return;
    // If appointment is already booked, prevent instant booking
    if (hasActiveAppointment) {
      setShowActiveAppointmentModal(true);
      return;
    }

    setCheckingInstant(true);
    try {
      const prefHealth = profile?.preferred_health || 'general_health';
      const result = await matchUserWithDoctor(user.uid, prefHealth, true);
      if (result.matched && result.doctor) {
        router.push('/user/consult/schedule?instant=true');
      } else {
        await updateDoc(doc(db, 'users', user.uid), {
          needs_doctor_assignment: true,
          preferred_health: prefHealth,
        }).catch(() => {});
        alert('No doctor is currently available for instant consult right now. Our medical team will assign a specialist for you shortly.');
      }
    } catch (err) {
      console.error('Instant availability error:', err);
      await updateDoc(doc(db, 'users', user.uid), {
        needs_doctor_assignment: true,
        preferred_health: profile?.preferred_health || 'general_health',
      }).catch(() => {});
      alert('Could not check instant availability right now. Your request has been queued for doctor assignment.');
    } finally {
      setCheckingInstant(false);
    }
  };

  const handleConfirmSpecialty = async () => {
    if (!selectedSpecialty) {
      alert('Please select a clinical specialty.');
      return;
    }
    if (!user) return;

    setMatchingSpecialty(true);
    setSpecialtyError('');

    try {
      // 1. Direct match first to update doctor & preferred_health in one write
      let matchResult = await matchUserWithDoctor(user.uid, selectedSpecialty);

      // 2. Fallback to Cloud Function if direct match didn't find doctor
      if (!matchResult || !matchResult.matched) {
        try {
          const matchFn = httpsCallable(functions, 'matchWithDoctor');
          const res = await matchFn();
          if (res?.data?.success && res?.data?.matched !== false) {
            matchResult = res.data;
          }
        } catch (fnErr) {
          console.warn('matchWithDoctor function call failed:', fnErr);
        }
      }

      // 3. If still no doctor matched immediately, mark needs_doctor_assignment
      if (!matchResult || !matchResult.matched) {
        await updateDoc(doc(db, 'users', user.uid), {
          needs_doctor_assignment: true,
          preferred_health: selectedSpecialty,
        });
      }
    } catch (err) {
      console.error('Error confirming specialty:', err);
      setSpecialtyError('An error occurred while matching. Please try again.');
    } finally {
      setMatchingSpecialty(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Listen to upcoming appointments without restrictive where filter
    // (matching Flutter app so active & in-progress appointments show immediately)
    const upcomingQuery = collection(db, 'users', user.uid, 'appointments_upcoming');

    const unsubscribeUpcoming = onSnapshot(
      upcomingQuery,
      (snapshot) => {
        const now = new Date();
        const validUpcoming = [];

        snapshot.docs.forEach(docSnap => {
          const data = { id: docSnap.id, ...docSnap.data() };
          const apptDate = data.time?.toDate ? data.time.toDate() : (data.time ? new Date(data.time) : null);
          if (apptDate) {
            const diffMinutes = (apptDate.getTime() - now.getTime()) / (1000 * 60);
            if (diffMinutes < -60) {
              // Expired! Auto-resolve to appointments_history and omit from upcoming
              autoResolveExpiredConsultation(data, docSnap.id);
              return;
            }
          }
          validUpcoming.push(data);
        });

        validUpcoming.sort((a, b) => {
          const timeA = a.time?.toDate ? a.time.toDate().getTime() : (a.time ? new Date(a.time).getTime() : 0);
          const timeB = b.time?.toDate ? b.time.toDate().getTime() : (b.time ? new Date(b.time).getTime() : 0);
          return timeA - timeB;
        });
        setUpcomingAppointments(validUpcoming);
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to upcoming appointments:', err);
      }
    );

    // Listen to past appointments
    const pastQuery = collection(db, 'users', user.uid, 'appointments_history');

    const unsubscribePast = onSnapshot(
      pastQuery,
      (snapshot) => {
        const rawAppointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        rawAppointments.sort((a, b) => {
          const timeA = a.time?.toDate ? a.time.toDate().getTime() : (a.time ? new Date(a.time).getTime() : 0);
          const timeB = b.time?.toDate ? b.time.toDate().getTime() : (b.time ? new Date(b.time).getTime() : 0);
          return timeB - timeA;
        });

        // Deduplicate by canonical appointment ID
        const uniqueMap = {};
        rawAppointments.forEach((item) => {
          const canonicalId = item.appointment_id || item.consultation_id || item.id;
          if (!uniqueMap[canonicalId]) {
            uniqueMap[canonicalId] = item;
          }
        });

        setPastAppointments(Object.values(uniqueMap));
        setLoading(false);
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to past appointments:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUpcoming();
      unsubscribePast();
    };
  }, [user]);

  useEffect(() => {
    if (resolvedDoctorUid) {
      fetchDoctorInfo(resolvedDoctorUid);
    }
  }, [resolvedDoctorUid]);

  const fetchDoctorInfo = async (doctorUid) => {
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', doctorUid));
      if (doctorDoc.exists()) {
        setDoctorInfo(doctorDoc.data());
      }
    } catch (error) {
      console.error('Error fetching doctor info:', error);
    }
  };

  const formatAppointmentTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const isAppointmentNow = (appointment) => {
    if (!appointment?.time) return false;
    const appointmentTime = appointment.time.toDate ? appointment.time.toDate() : new Date(appointment.time);
    const now = new Date();
    const diffMinutes = (appointmentTime - now) / (1000 * 60);
    return diffMinutes >= -60 && diffMinutes <= 15; // 15 min before to 1 hr after
  };

  const isAppointmentPast = (appointment) => {
    if (!appointment?.time) return false;
    const appointmentTime = appointment.time.toDate ? appointment.time.toDate() : new Date(appointment.time);
    const now = new Date();
    return !isAppointmentNow(appointment) && now > appointmentTime;
  };

  const handleCancelAppointment = async (appointment) => {
    if (!appointment?.id || !user) return;

    if (appointment.time) {
      const apptDate = appointment.time.toDate ? appointment.time.toDate() : new Date(appointment.time);
      const diffFromStart = (Date.now() - apptDate.getTime()) / (1000 * 60);
      if (diffFromStart > 60) {
        alert('This appointment time has already expired and cannot be cancelled.');
        setAppointmentToCancel(null);
        return;
      }
      const diffHours = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffHours >= 0 && diffHours < 2) {
        alert('You cannot cancel within 2 hours of the scheduled appointment time.');
        setAppointmentToCancel(null);
        return;
      }
    }

    setCancellingId(appointment.id);
    try {
      // 1. Try Cloud Function first
      let fnSuccess = false;
      try {
        const cancelFn = httpsCallable(functions, 'cancelAppointmentByUser');
        const res = await cancelFn({ appointmentId: appointment.id });
        if (res?.data?.success) {
          fnSuccess = true;
        }
      } catch (fnErr) {
        console.warn('Cloud function cancel failed, using Firestore fallback:', fnErr);
        if (fnErr?.message && fnErr.message.includes('within 2 hours')) {
          alert('Cannot cancel within 2 hours of appointment.');
          setCancellingId(null);
          setAppointmentToCancel(null);
          return;
        }
      }

      // 2. Fallback: direct Firestore batch update
      if (!fnSuccess) {
        const batch = writeBatch(db);
        const userUpcomingRef = doc(db, 'users', user.uid, 'appointments_upcoming', appointment.id);
        const userHistoryRef = doc(db, 'users', user.uid, 'appointments_history', appointment.id);
        const userRef = doc(db, 'users', user.uid);

        batch.delete(userUpcomingRef);
        batch.set(userHistoryRef, {
          ...appointment,
          status: 'cancelled_by_user',
          cancelled_at: serverTimestamp()
        }, { merge: true });
        batch.update(userRef, { is_consultation_set: false });

        const docId = appointment.doctor_id || appointment.doctor_uid || resolvedDoctorUid;
        if (docId) {
          const doctorUpcomingRef = doc(db, 'doctors', docId, 'appointments_upcoming', appointment.id);
          batch.delete(doctorUpcomingRef);

          const doctorHistoryRef = doc(db, 'doctors', docId, 'appointments_history', appointment.id);
          batch.set(doctorHistoryRef, {
            ...appointment,
            status: 'cancelled_by_user',
            cancelled_by: 'user',
            cancelled_at: serverTimestamp()
          }, { merge: true });
        }
        await batch.commit();
      }

      // Direct sync to master consultations document
      try {
        await setDoc(doc(db, 'consultations', appointment.id), {
          status: 'cancelled_by_user',
          cancelled_at: serverTimestamp(),
          cancelled_by: 'user',
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (cErr) {
        console.warn('Error syncing cancel to consultations doc:', cErr);
      }

      setAppointmentToCancel(null);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const hasDoctor = Boolean(resolvedDoctorUid || profile?.doctor);
  const canMessage = profile?.is_first_consultation_completed || hasDoctor;

  const doctorDisplayName = 
    (doctorInfo?.first_name || doctorInfo?.last_name)
      ? `Dr. ${doctorInfo.first_name || ''} ${doctorInfo.last_name || ''}`.trim()
      : (doctorInfo?.name 
          ? (doctorInfo.name.startsWith('Dr.') ? doctorInfo.name : `Dr. ${doctorInfo.name}`)
          : (profile?.doctor_name 
              ? (profile.doctor_name.startsWith('Dr.') ? profile.doctor_name : `Dr. ${profile.doctor_name}`)
              : (profile?.doctor?.first_name 
                  ? `Dr. ${profile.doctor.first_name} ${profile.doctor.last_name || ''}`.trim() 
                  : 'Dr. Assigned Doctor')));

  return (
    <ProtectedRoute userType="user">
      <WebLayoutWrapper>
        <div className="space-y-6 pb-24">
          <div className="flex items-center justify-between pt-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Consultations
            </h1>
          </div>

          {/* Questionnaire Modal */}
          {showQuestionnaireModal && (
            <UserQuestionnaireModal
              onComplete={(redirectUrl) => {
                setShowQuestionnaireModal(false);
                if (redirectUrl) {
                  router.push(redirectUrl);
                }
              }}
            />
          )}

          {/* Extended Questionnaire Modal */}
          {showExtendedQuestionnaireModal && (
            <ExtendedQuestionnaireModal
              onComplete={() => {
                setShowExtendedQuestionnaireModal(false);
                router.push('/user/consult/schedule');
              }}
              onClose={() => setShowExtendedQuestionnaireModal(false)}
            />
          )}

          {/* Active Consultation Modal (Hold On) */}
          {showActiveAppointmentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
              <div className="bg-[#2D2D30]/95 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-center text-white backdrop-blur-md">
                <button
                  onClick={() => setShowActiveAppointmentModal(false)}
                  className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 bg-[#FFD3AC]/15 border border-[#FFD3AC]/40 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
                  ⏳
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">
                    Hold On
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    You already have an active consultation scheduled. You cannot book a second appointment until your current consultation is completed.
                  </p>
                </div>

                {activeAppointment && (
                  <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-left space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60 uppercase tracking-wider font-medium">Doctor</span>
                      <span className="font-semibold text-white">
                        {activeAppointment.doctor_name || doctorDisplayName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60 uppercase tracking-wider font-medium">Scheduled Time</span>
                      <span className="font-semibold text-[#FFD3AC]">
                        {formatAppointmentTime(activeAppointment.time)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowActiveAppointmentModal(false);
                      const el = document.getElementById('upcoming-appointments');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] py-3.5 px-6 rounded-full text-sm font-semibold transition cursor-pointer shadow-md"
                  >
                    View Existing Appointment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Appointment Confirmation Modal */}
          {appointmentToCancel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
              <div className="bg-[#2D2D30]/95 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-center text-white backdrop-blur-md">
                <button
                  onClick={() => setAppointmentToCancel(null)}
                  disabled={Boolean(cancellingId)}
                  className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer disabled:opacity-50"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-2xl text-red-400 shadow-sm">
                  <XCircleIcon className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">
                    Cancel Appointment?
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    Are you sure you want to cancel? You cannot cancel within 2 hours of the appointment.
                  </p>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-left space-y-2.5 text-xs text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider font-medium">Doctor</span>
                    <span className="font-semibold">
                      {appointmentToCancel.doctor_name?.startsWith('Dr.') 
                        ? appointmentToCancel.doctor_name 
                        : `Dr. ${appointmentToCancel.doctor_name || 'Assigned Doctor'}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider font-medium">Scheduled Time</span>
                    <span className="font-semibold text-[#FFD3AC]">
                      {formatAppointmentTime(appointmentToCancel.time)}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white/80 text-left leading-relaxed">
                  <strong className="text-[#FFD3AC]">Refund Policy:</strong> You can request a full refund for your $50 deposit by emailing{' '}
                  <a href="mailto:info@ambewellness.com" className="font-semibold text-[#FFD3AC] underline hover:text-white">
                    info@ambewellness.com
                  </a>{' '}
                  within 30 days of the appointment. If missed without joining, only 50% ($25) of the deposit is refunded.
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setAppointmentToCancel(null)}
                    disabled={Boolean(cancellingId)}
                    className="w-full py-3 px-4 border border-white/15 text-white rounded-full font-medium text-sm hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
                  >
                    No, Keep It
                  </button>
                  <button
                    onClick={() => handleCancelAppointment(appointmentToCancel)}
                    disabled={Boolean(cancellingId)}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold text-sm transition cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                  >
                    {cancellingId === appointmentToCancel.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. Direct Specialty Selection if Doctor Not Assigned AND Specialty is Pending */}
          {!hasDoctor && !profile?.preferred_health && (
            <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl backdrop-blur-md space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🩺
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Select Your Specialty
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60">
                    Choose an area of care for your consult
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CLINICAL_SPECIALTIES.map((spec) => {
                  const isSelected = selectedSpecialty === spec.value;
                  return (
                    <button
                      key={spec.value}
                      type="button"
                      onClick={() => setSelectedSpecialty(spec.value)}
                      disabled={matchingSpecialty}
                      className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#FFD3AC]/15 border-[#FFD3AC] text-[#FFD3AC] font-semibold"
                          : "bg-white/5 border-white/10 text-white hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{spec.icon}</span>
                      <span className="text-sm sm:text-base flex-1">{spec.label}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "border-[#FFD3AC] bg-[#FFD3AC] text-[#1E1E1E]"
                            : "border-white/30 bg-transparent"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#1E1E1E]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {specialtyError && (
                <p className="text-xs sm:text-sm text-red-300 bg-red-500/20 p-3 rounded-xl border border-red-500/30">
                  {specialtyError}
                </p>
              )}

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSpecialty}
                  disabled={matchingSpecialty}
                  className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] py-3.5 px-6 rounded-full text-sm sm:text-base font-bold transition cursor-pointer shadow-md disabled:opacity-50 tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  {matchingSpecialty ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
                      Matching Specialist...
                    </>
                  ) : selectedSpecialty ? (
                    "Confirm & Match Specialist"
                  ) : (
                    "Select a Specialty Above"
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuestionnaireModal(true)}
                    disabled={matchingSpecialty}
                    className="text-xs sm:text-sm text-[#FFD3AC] hover:text-white underline transition cursor-pointer font-medium"
                  >
                    Or complete the full health questionnaire (48 questions)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. If Doctor Not Yet Assigned but specialty chosen */}
          {!hasDoctor && Boolean(profile?.preferred_health) && (
            <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-8 mb-8 shadow-xl backdrop-blur-md max-w-md mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-sm">
                ⏳
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Finding your perfect match</h3>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  We are currently looking for the best doctor specializing in your selected topic for you.
                </p>
                <p className="text-xs text-white/50 pt-1">
                  You will be notified as soon as a doctor is assigned.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <button 
                  onClick={handleCheckInstantAvailability}
                  disabled={checkingInstant}
                  className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] py-3.5 px-6 rounded-full text-sm font-semibold transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {checkingInstant ? "Checking..." : "Check for Instant Availability"}
                </button>
                <button 
                  onClick={() => router.push('/user/get-matched')}
                  className="text-xs text-white/60 hover:text-white underline transition block mx-auto"
                >
                  Select different health areas
                </button>
              </div>
            </div>
          )}

          {/* Doctor Info Card */}
          {hasDoctor && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                My Doctor
              </h2>
              <div className="bg-[#1B1A18]/65 border border-white/20 rounded-[22px] shadow-lg p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-full border-2 border-[#FFD3AC] bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {doctorInfo?.profile_picture ? (
                        <img 
                          src={doctorInfo.profile_picture} 
                          alt={doctorDisplayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[#FFD3AC] font-bold text-xl">
                          {doctorDisplayName.replace('Dr. ', '').charAt(0) || '👨‍⚕️'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-white leading-tight truncate">
                        {doctorDisplayName}
                      </h3>
                      {doctorInfo?.title && (
                        <p className="text-xs text-[#FFD3AC] font-semibold mt-0.5">{doctorInfo.title}</p>
                      )}
                      {doctorInfo?.field && doctorInfo.field.length > 0 && (
                        <p className="text-xs text-white/60 mt-0.5 line-clamp-1">
                          {getHealthFieldLabels(doctorInfo.field).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2.5 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => router.push('/user/consult/message_doctor')}
                      disabled={!canMessage}
                      className={`flex-1 sm:flex-initial flex items-center justify-center px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                        canMessage 
                          ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' 
                          : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1.5 text-[#FFD3AC]" />
                      Message
                    </button>
                    <button
                      onClick={handleScheduleClick}
                      className="flex-1 sm:flex-initial flex items-center justify-center bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
                    >
                      <CalendarIcon className="h-4 w-4 mr-1.5" />
                      Schedule
                    </button>
                  </div>
                </div>
                {!canMessage && (
                  <p className="text-[11px] text-white/50 mt-2.5 pt-2 border-t border-white/10">
                    Complete your first consultation to enable direct messaging
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming / Current Appointments */}
          {upcomingAppointments.length > 0 && (
            <div id="upcoming-appointments" className="space-y-3 pt-2">
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                {upcomingAppointments.some(a => isAppointmentNow(a)) 
                  ? 'Happening Now' 
                  : 'Upcoming Appointment'}
              </h2>
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => {
                  const isNow = isAppointmentNow(appointment);
                  const apptDocName = appointment.doctor_name 
                    ? (appointment.doctor_name.startsWith('Dr.') ? appointment.doctor_name : `Dr. ${appointment.doctor_name}`)
                    : doctorDisplayName;

                  return (
                    <div key={appointment.id}>
                      <div className={`rounded-[22px] p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isNow ? 'bg-[#FFD3AC] text-[#1E1E1E]' : 'bg-[#1B1A18]/65 border border-white/20 text-white'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isNow && (
                              <span className="bg-[#2E7D32] text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                Live
                              </span>
                            )}
                            <h3 className={`font-bold text-lg ${isNow ? 'text-[#1E1E1E]' : 'text-white'}`}>
                              {apptDocName}
                            </h3>
                          </div>
                          <p className={`text-xs flex items-center mt-1 font-medium ${
                            isNow ? 'text-[#1E1E1E]/75' : 'text-white/60'
                          }`}>
                            <ClockIcon className="h-4 w-4 mr-1.5" />
                            {formatAppointmentTime(appointment.time)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {isNow ? (
                            <button
                              onClick={() => router.push(`/user/consult/appointment/${appointment.id}`)}
                              className="flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md bg-black text-white hover:bg-neutral-800"
                            >
                              <VideoCameraIcon className="h-4 w-4 mr-1.5" />
                              Join
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRescheduleClick(appointment)}
                              className="px-6 py-2.5 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>

                      {!isNow && (
                        <div className="text-right pt-2 pr-2">
                          <button
                            onClick={() => setAppointmentToCancel(appointment)}
                            disabled={cancellingId === appointment.id}
                            className="text-xs text-white/70 hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <XCircleIcon className="h-3.5 w-3.5" />
                            Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Upcoming Appointments */}
          {hasDoctor && upcomingAppointments.length === 0 && !loading && (
            <div className="bg-[#1B1A18]/65 border border-white/15 rounded-[22px] p-8 text-center">
              <CalendarIcon className="h-10 w-10 text-[#FFD3AC] mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">
                No appointment set
              </h3>
              <p className="text-xs text-white/60 mb-4">
                Schedule a consultation with your healthcare provider
              </p>
              <button
                onClick={handleScheduleClick}
                className="bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer"
              >
                Schedule Consultation
              </button>
            </div>
          )}

          {/* Past Appointments / History */}
          {pastAppointments.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                  History
                </h2>
                <button
                  onClick={() => router.push('/user/consult/history')}
                  className="text-xs font-semibold text-[#FFD3AC] hover:underline cursor-pointer"
                >
                  See All
                </button>
              </div>
              <div className="space-y-2.5">
                {pastAppointments.slice(0, 5).map((appointment) => {
                  const statusInfo = getConsultationStatusInfo(appointment);
                  return (
                    <div 
                      key={appointment.id}
                      className="bg-[#1B1A18]/65 border border-white/15 rounded-[20px] p-4 sm:p-5 hover:border-[#FFD3AC]/50 transition cursor-pointer flex items-center justify-between"
                      onClick={() => router.push(`/user/consult/report/${appointment.id}`)}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white truncate">
                            {appointment.doctor_name?.startsWith('Dr.') ? appointment.doctor_name : `Dr. ${appointment.doctor_name || 'Assigned Doctor'}`}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1 ${statusInfo.dotClass}`} />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-white/55 mt-1">
                          {formatAppointmentTime(appointment.time)}
                        </p>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-white/40 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#FFD3AC] border-t-transparent"></div>
            </div>
          )}
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}