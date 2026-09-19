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
  XCircleIcon
} from "@heroicons/react/24/outline";

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

    const unsubscribeUpcoming = onSnapshot(upcomingQuery, (snapshot) => {
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
    });

    // Listen to past appointments
    const pastQuery = collection(db, 'users', user.uid, 'appointments_history');

    const unsubscribePast = onSnapshot(pastQuery, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      appointments.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate().getTime() : (a.time ? new Date(a.time).getTime() : 0);
        const timeB = b.time?.toDate ? b.time.toDate().getTime() : (b.time ? new Date(b.time).getTime() : 0);
        return timeB - timeA;
      });
      setPastAppointments(appointments);
      setLoading(false);
    });

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
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-8">Consultations</h1>

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-[#E7E2D9] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-center">
              <button
                onClick={() => setShowActiveAppointmentModal(false)}
                className="absolute top-4 right-4 p-2 text-[#8C827A] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] rounded-full transition cursor-pointer"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-[#FFF3E8] border border-[#FFD3AC] rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
                ⏳
              </div>

              <div className="space-y-2">
                <h3 
                  className="text-2xl font-bold text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
                >
                  Hold On
                </h3>
                <p className="text-sm text-[#6B6862] leading-relaxed">
                  You already have an active consultation scheduled. You cannot book a second appointment until your current consultation is completed.
                </p>
              </div>

              {activeAppointment && (
                <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl p-4 text-left space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C827A] uppercase tracking-wider font-medium">Doctor</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {activeAppointment.doctor_name || doctorDisplayName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C827A] uppercase tracking-wider font-medium">Scheduled Time</span>
                    <span className="font-semibold text-[#C2691C]">
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
                  className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 px-6 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm"
                >
                  View Existing Appointment
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Cancel Appointment Confirmation Modal */}
        {appointmentToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-[#E7E2D9] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-center">
              <button
                onClick={() => setAppointmentToCancel(null)}
                disabled={Boolean(cancellingId)}
                className="absolute top-4 right-4 p-2 text-[#8C827A] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] rounded-full transition cursor-pointer disabled:opacity-50"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto text-2xl text-red-600 shadow-sm">
                <XCircleIcon className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 
                  className="text-2xl font-bold text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
                >
                  Cancel Appointment?
                </h3>
                <p className="text-sm text-[#6B6862] leading-relaxed">
                  Are you sure you want to cancel? You cannot cancel within 2 hours of the appointment.
                </p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl p-4 text-left space-y-2.5 text-xs text-[#1A1A1A]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8C827A] uppercase tracking-wider font-medium">Doctor</span>
                  <span className="font-semibold">
                    {appointmentToCancel.doctor_name?.startsWith('Dr.') 
                      ? appointmentToCancel.doctor_name 
                      : `Dr. ${appointmentToCancel.doctor_name || 'Assigned Doctor'}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8C827A] uppercase tracking-wider font-medium">Scheduled Time</span>
                  <span className="font-semibold text-[#C2691C]">
                    {formatAppointmentTime(appointmentToCancel.time)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#FFF9F2] border border-[#FFD3AC] rounded-xl text-xs text-[#1A1A1A] text-left leading-relaxed">
                <strong>Refund Policy:</strong> You can request a full refund for your $50 deposit by emailing{' '}
                <a href="mailto:info@ambewellness.com" className="font-semibold text-[#C2691C] underline hover:text-[#1A1A1A]">
                  info@ambewellness.com
                </a>{' '}
                within 30 days of the appointment. If missed without joining, only 50% ($25) of the deposit is refunded.
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setAppointmentToCancel(null)}
                  disabled={Boolean(cancellingId)}
                  className="w-full py-3.5 px-4 border border-[#E7E2D9] text-[#1A1A1A] rounded-xl font-medium text-sm hover:bg-[#FAF8F5] transition cursor-pointer disabled:opacity-50"
                >
                  No, Keep It
                </button>
                <button
                  onClick={() => handleCancelAppointment(appointmentToCancel)}
                  disabled={Boolean(cancellingId)}
                  className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
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
          <div className="bg-white border border-[#E7E2D9] rounded-2xl p-6 sm:p-8 mb-8 shadow-sm max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-[#FFF3E8] border border-[#FFD3AC] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                🩺
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">
                  Select Your Specialty
                </h3>
                <p className="text-sm text-[#6B6862]">
                  Choose an area of care for your consult
                </p>
              </div>
            </div>

            <div className="h-px bg-[#E7E2D9]" />

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
                        ? "bg-[#FFF3E8] border-[#C2691C] text-[#9E4E0A] font-semibold ring-1 ring-[#C2691C]"
                        : "bg-[#FAF8F5] border-[#E7E2D9] text-[#1A1A1A] hover:border-[#C2691C]/50 hover:bg-white"
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{spec.icon}</span>
                    <span className="text-sm sm:text-base flex-1">{spec.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "border-[#C2691C] bg-[#C2691C] text-white"
                          : "border-[#D1C9BF] bg-white"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {specialtyError && (
              <p className="text-xs sm:text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {specialtyError}
              </p>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmSpecialty}
                disabled={matchingSpecialty}
                className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 px-6 rounded-xl text-sm sm:text-base font-bold transition cursor-pointer shadow-sm disabled:opacity-50 tracking-wider uppercase flex items-center justify-center gap-2"
              >
                {matchingSpecialty ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
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
                  className="text-xs sm:text-sm text-[#9E4E0A] hover:text-[#1A1A1A] underline transition cursor-pointer font-medium"
                >
                  Or complete the full health questionnaire (48 questions)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. If Doctor Not Yet Assigned but specialty chosen */}
        {!hasDoctor && Boolean(profile?.preferred_health) && (
          <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 mb-8 shadow-sm max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-[#FFF3E8] border border-[#FFD3AC] rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-sm">
              ⏳
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-[#1A1A1A]">Finding your perfect match</h3>
              <p className="text-sm text-[#6B6862] leading-relaxed">
                We are currently looking for the best doctor specializing in your selected topic for you.
              </p>
              <p className="text-xs text-[#8C827A] pt-1">
                You will be notified as soon as a doctor is assigned.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button 
                onClick={handleCheckInstantAvailability}
                disabled={checkingInstant}
                className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 px-6 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                {checkingInstant ? "Checking..." : "Check for Instant Availability"}
              </button>
              <button 
                onClick={() => router.push('/user/get-matched')}
                className="text-xs text-[#8C827A] hover:text-[#1A1A1A] underline transition"
              >
                Select different health areas
              </button>
            </div>
          </div>
        )}

        {/* Doctor Info Card */}
        {hasDoctor && (
          <>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">MY DOCTOR</h2>
            <div className="bg-white border border-[#E7E2D9] rounded-xl shadow-sm p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-[#FAF8F5] border border-[#E7E2D9] rounded-full overflow-hidden flex-shrink-0">
                    {doctorInfo?.profile_picture ? (
                      <img 
                        src={doctorInfo.profile_picture} 
                        alt={doctorDisplayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#1A1A1A] font-bold text-xl bg-[#FFD3AC]/40">
                        {doctorDisplayName.replace('Dr. ', '').charAt(0) || '👨‍⚕️'}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg text-[#1A1A1A]">
                      {doctorDisplayName}
                    </h3>
                    {doctorInfo?.title && (
                      <p className="text-sm text-[#C8996A] font-medium">{doctorInfo.title}</p>
                    )}
                    {doctorInfo?.field && doctorInfo.field.length > 0 && (
                      <p className="text-sm text-[#6B6862] mt-1 line-clamp-2">
                        {getHealthFieldLabels(doctorInfo.field).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => router.push('/user/consult/message_doctor')}
                    disabled={!canMessage}
                    className={`flex-1 sm:flex-initial flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                      canMessage 
                        ? 'bg-[#1A1A1A] text-white hover:bg-[#353535]' 
                        : 'bg-[#FAF8F5] text-[#8C827A] cursor-not-allowed border border-[#E7E2D9]'
                    }`}
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    Message
                  </button>
                  <button
                    onClick={handleScheduleClick}
                    className="flex-1 sm:flex-initial flex items-center justify-center bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer shadow-sm"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Schedule
                  </button>
                </div>
              </div>
              {!canMessage && (
                <p className="text-xs text-[#8C827A] mt-3">
                  Complete your first consultation to enable direct messaging
                </p>
              )}
            </div>
          </>
        )}

        {/* Upcoming / Current Appointments */}
        {upcomingAppointments.length > 0 && (
          <div id="upcoming-appointments" className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
              {upcomingAppointments.some(a => isAppointmentNow(a)) 
                ? 'HAPPENING NOW' 
                : 'UPCOMING APPOINTMENTS'}
            </h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => {
                const isNow = isAppointmentNow(appointment);
                const apptDocName = appointment.doctor_name 
                  ? (appointment.doctor_name.startsWith('Dr.') ? appointment.doctor_name : `Dr. ${appointment.doctor_name}`)
                  : doctorDisplayName;

                return (
                  <div key={appointment.id}>
                    <div className={`bg-white border rounded-xl shadow-sm p-6 ${
                      isNow ? 'border-[#C8996A] ring-2 ring-[#FFD3AC]' : 'border-[#E7E2D9]'
                    }`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isNow && (
                              <span className="bg-[#2E7D32] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                                Live
                              </span>
                            )}
                            <h3 className="font-semibold text-lg text-[#1A1A1A]">
                              {apptDocName}
                            </h3>
                          </div>
                          <p className="text-sm text-[#6B6862] flex items-center mt-1">
                            <ClockIcon className="h-4 w-4 mr-1.5 text-[#C8996A]" />
                            {formatAppointmentTime(appointment.time)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {isNow && (
                            <button
                              onClick={() => router.push(`/user/consult/appointment/${appointment.id}`)}
                              className="flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm bg-[#1A1A1A] hover:bg-[#353535] text-[#FFD3AC]"
                            >
                              <VideoCameraIcon className="h-5 w-5 mr-2" />
                              Join Call
                            </button>
                          )}
                          
                          {!isNow && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                              <button
                                onClick={() => handleRescheduleClick(appointment)}
                                className="px-4 py-2 border border-[#E7E2D9] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#FAF8F5] transition cursor-pointer shadow-sm text-center"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => setAppointmentToCancel(appointment)}
                                disabled={cancellingId === appointment.id}
                                className="px-3.5 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <XCircleIcon className="h-4 w-4" />
                                Cancel Appointment
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Upcoming Appointments */}
        {hasDoctor && upcomingAppointments.length === 0 && !loading && (
          <div className="bg-white border border-[#E7E2D9] rounded-xl p-8 text-center mb-8 shadow-sm">
            <CalendarIcon className="h-12 w-12 text-[#C8996A] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">
              No Upcoming Appointments
            </h3>
            <p className="text-sm text-[#6B6862] mb-4">
              Schedule a consultation with your healthcare provider
            </p>
            <button
              onClick={handleScheduleClick}
              className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer"
            >
              Schedule Consultation
            </button>
          </div>
        )}

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Consultation History</h2>
            <div className="space-y-3">
              {pastAppointments.map((appointment) => {
                const statusInfo = getConsultationStatusInfo(appointment);
                return (
                  <div 
                    key={appointment.id}
                    className="bg-white border border-[#E7E2D9] rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => router.push(`/user/consult/report/${appointment.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-medium text-base text-[#1A1A1A]">
                            {appointment.doctor_name?.startsWith('Dr.') ? appointment.doctor_name : `Dr. ${appointment.doctor_name || 'Assigned Doctor'}`}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotClass}`} />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-[#6B6862] mt-1">
                          {formatAppointmentTime(appointment.time)}
                        </p>
                      </div>
                      <div className="flex items-center text-[#C8996A] font-medium text-sm ml-4 shrink-0">
                        <DocumentTextIcon className="h-5 w-5 mr-1" />
                        <span>{statusInfo.actionText}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}