"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { httpsCallable } from 'firebase/functions';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp, 
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { functions, db } from '@/lib/firebase/config';
import { matchUserWithDoctor } from '@/lib/doctorMatching';
import UserQuestionnaireModal from '@/components/user/UserQuestionnaireModal';
import ExtendedQuestionnaireModal from '@/components/user/ExtendedQuestionnaireModal';
import { CalendarIcon, ClockIcon, BoltIcon, ShieldCheckIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import moment from 'moment-timezone';
import BackButton from '@/components/common/BackButton';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import PaymentMethodSelector from '@/components/common/PaymentMethodSelector';
import { useRemotePaymentConfig } from '@/lib/remoteConfig';
import { startPayPalCheckout } from '@/lib/paypal';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';


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

/**
 * Stripe Payment Form Component for Consultation Deposit
 */
function ConsultationPaymentForm({ 
  user, 
  doctorInfo, 
  selectedSlot, 
  selectedDate, 
  paymentIntentId, 
  onSuccess 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setErrorMsg('');

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setErrorMsg(result.error.message || 'Payment confirmation failed.');
        setProcessing(false);
      } else if (
        result.paymentIntent && 
        (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')
      ) {
        const intentId = result.paymentIntent.id || paymentIntentId;
        await onSuccess(intentId);
      } else {
        setErrorMsg(result.paymentIntent?.status ? `Payment was not completed (status: ${result.paymentIntent.status}). Please try again.` : 'Payment was not completed. Please try again.');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment confirm error:', err);
      setErrorMsg('Payment could not be confirmed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] py-4 rounded-full font-bold text-sm transition disabled:opacity-50 shadow-md uppercase tracking-wider cursor-pointer"
      >
        {processing ? "Processing Payment..." : "Pay $50 Deposit & Confirm Appointment"}
      </button>
    </form>
  );
}

function ScheduleConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInstantParam = searchParams.get('instant') === 'true';
  const isRescheduleParam = searchParams.get('reschedule') === 'true';
  const rescheduleAppointmentId = searchParams.get('appointmentId');

  const { user, profile } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [hasScheduleError, setHasScheduleError] = useState(false);
  const [doctorTimezone, setDoctorTimezone] = useState(null);
  const [userTimezone, setUserTimezone] = useState(null);

  // Instant availability & matching states
  const [isInstantAvailable, setIsInstantAvailable] = useState(false);
  const [checkingInstant, setCheckingInstant] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [showExtendedQuestionnaireModal, setShowExtendedQuestionnaireModal] = useState(false);

  // Stripe & PayPal Payment states
  const { isTestMode, stripePromise, loading: configLoading } = useRemotePaymentConfig();
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);


  // Safe doctor UID resolution
  const resolvedDoctorUid = 
    profile?.doctor?.uid || 
    (typeof profile?.doctor === 'string' ? profile.doctor : null) || 
    profile?.doctor_uid || 
    profile?.matched_doctor || 
    profile?.doctor_id || 
    null;

  // Active appointment detection (strictly non-expired and not ended)
  const activeAppointment = upcomingAppointments.find((a) => {
    if (
      a.call_status === 'ended' ||
      a.call_ended_at ||
      a.status === 'completed' ||
      a.consultation_outcome === 'completed'
    ) {
      return false;
    }
    const d = a.time?.toDate ? a.time.toDate() : (a.time ? new Date(a.time) : null);
    if (!d) return true;
    const diffMinutes = (d.getTime() - Date.now()) / (1000 * 60);
    return diffMinutes >= -60;
  }) || null;
  const hasActiveAppointment = Boolean(activeAppointment);

  // Auto-heal is_consultation_set if user has no valid upcoming appointment
  useEffect(() => {
    if (user && profile?.is_consultation_set === true && !activeAppointment && !loading) {
      updateDoc(doc(db, 'users', user.uid), { is_consultation_set: false }).catch(() => {});
    }
  }, [user, profile?.is_consultation_set, activeAppointment, loading]);

  const resolvingSetRef = useRef(new Set());

  const autoResolveExpiredConsultation = async (appt, docId) => {
    if (!user) return;
    const appointmentId = (appt.appointment_id || docId || '').toString();
    if (!appointmentId || resolvingSetRef.current.has(appointmentId)) return;
    resolvingSetRef.current.add(appointmentId);

    const doctorUid = appt.doctor_id || appt.doctor_uid || resolvedDoctorUid;
    const userJoined = appt.user_joined === true;
    const doctorJoined = appt.doctor_joined === true;

    // First try the backend Cloud Function with Admin SDK privileges
    try {
      const autoResolveFn = httpsCallable(functions, 'autoResolveExpiredConsultation');
      await autoResolveFn({
        appointmentId,
        doctorId: doctorUid,
        userJoined,
        doctorJoined,
      });
      console.log(`Auto-resolved expired consultation ${appointmentId} via Cloud Function`);
      return;
    } catch (fnErr) {
      console.warn("Backend autoResolveExpiredConsultation failed, attempting client fallback:", fnErr);
    }

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

      const consultRef = doc(db, 'consultations', appointmentId);
      batch.set(consultRef, {
        status: resolvedStatus,
        is_no_show: isNoShow,
        auto_resolved: true,
        resolved_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await batch.commit();
      console.log(`Auto-resolved expired consultation ${appointmentId} to ${resolvedStatus} via client fallback`);
    } catch (e) {
      console.warn("Error auto-resolving expired consultation:", e);
    }
  };

  const formatAppointmentTime = (timestamp) => {
    if (!timestamp) return 'Time not set';
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

  // Listen to user's upcoming appointments
  useEffect(() => {
    if (!user) return;
    const upcomingQuery = collection(db, 'users', user.uid, 'appointments_upcoming');
    const unsubscribe = onSnapshot(
      upcomingQuery,
      (snapshot) => {
        const now = new Date();
        const validUpcoming = [];

        snapshot.docs.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() };
          // If call has ended or status is completed, auto-resolve to history and omit from upcoming
          if (
            data.call_status === 'ended' ||
            data.call_ended_at ||
            data.status === 'completed' ||
            data.consultation_outcome === 'completed'
          ) {
            autoResolveExpiredConsultation(data, docSnap.id);
            return;
          }
          const apptDate = data.time?.toDate ? data.time.toDate() : (data.time ? new Date(data.time) : null);
          if (apptDate) {
            const diffMinutes = (apptDate.getTime() - now.getTime()) / (1000 * 60);
            if (diffMinutes < -60) {
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
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
    
    if (resolvedDoctorUid) {
      loadDoctorInfo(resolvedDoctorUid);
    } else {
      setLoading(false);
    }
  }, [resolvedDoctorUid]);

  // When pressing browser back button from schedule page, navigate to /user/home
  useEffect(() => {
    const handlePopState = () => {
      router.push('/user/home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  useEffect(() => {
    if (selectedDate && doctorSchedule && doctorTimezone && userTimezone) {
      generateTimeSlots();
    }
  }, [selectedDate, doctorSchedule, bookedSlots, doctorTimezone, userTimezone, isInstantAvailable]);

  // Load / create PaymentIntent whenever a slot is selected (only when not rescheduling)
  useEffect(() => {
    if (selectedSlot && user && !clientSecret && !isRescheduleParam) {
      initializePaymentIntent();
    }
  }, [selectedSlot, user, isRescheduleParam, clientSecret]);

  const loadDoctorInfo = async (docUid) => {
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', docUid));
      if (doctorDoc.exists()) {
        const doctorData = doctorDoc.data();
        setDoctorInfo(doctorData);
        setDoctorSchedule(doctorData.schedule || {});
        setIsInstantAvailable(Boolean(doctorData.is_available_now));
        const docTz = doctorData.timezone || 'America/New_York';
        setDoctorTimezone(docTz);
        
        const dateToLoad = selectedDate || new Date();
        await loadBookedAppointments(docUid, dateToLoad);

        // If arrived via instant or doctor is available now on today's date, auto-select instant slot
        if (isInstantParam && doctorData.is_available_now) {
          const now = new Date();
          const instantSlot = {
            isInstant: true,
            time: now,
            doctorTime: now,
            display: "Available Now (Instant)",
            userDisplay: "Available Now (Instant)",
            doctorDisplay: "Available Now (Instant)"
          };
          setSelectedSlot(instantSlot);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading doctor info:', error);
      setHasScheduleError(true);
      setLoading(false);
    }
  };

  const loadBookedAppointments = async (doctorUid, date) => {
    if (!doctorUid) return;

    try {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const appointmentsQuery = query(
        collection(db, 'doctors', doctorUid, 'appointments_upcoming'),
        where('time', '>=', Timestamp.fromDate(startOfDay)),
        where('time', '<', Timestamp.fromDate(endOfDay))
      );
      
      const snapshot = await getDocs(appointmentsQuery);
      const booked = snapshot.docs.map(doc => doc.data().time.toDate());
      setBookedSlots(booked);
    } catch (error) {
      if (error?.code === 'permission-denied') {
        return;
      }
      console.error('Error loading booked appointments:', error);
    }
  };

  const generateTimeSlots = () => {
    if (!selectedDate || !doctorSchedule || !doctorTimezone || !userTimezone) {
      setAvailableSlots([]);
      return;
    }

    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = doctorSchedule[dayName];
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    
    const slots = [];

    // If today and doctor is available now, prepend instant slot
    if (isToday && isInstantAvailable) {
      const now = new Date();
      slots.push({
        isInstant: true,
        time: now,
        doctorTime: now,
        display: "Available Now",
        userDisplay: "Available Now",
        doctorDisplay: "Available Now"
      });
    }

    if (!daySchedule || !daySchedule.is_available) {
      setAvailableSlots(slots);
      return;
    }
    
    const startTimeData = daySchedule.start_time || daySchedule.startTime;
    const endTimeData = daySchedule.end_time || daySchedule.endTime;
    
    if (!startTimeData || !endTimeData) {
      setAvailableSlots(slots);
      return;
    }
    
    const startHour = typeof startTimeData === 'object' ? (startTimeData.hour || 0) : parseInt(String(startTimeData).split(':')[0], 10);
    const startMinute = typeof startTimeData === 'object' ? (startTimeData.minute || 0) : parseInt(String(startTimeData).split(':')[1] || 0, 10);
    const endHour = typeof endTimeData === 'object' ? (endTimeData.hour || 0) : parseInt(String(endTimeData).split(':')[0], 10);
    const endMinute = typeof endTimeData === 'object' ? (endTimeData.minute || 0) : parseInt(String(endTimeData).split(':')[1] || 0, 10);
    
    const selectedDateStr = moment(selectedDate).format('YYYY-MM-DD');
    const doctorStartTime = moment.tz(
      `${selectedDateStr} ${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
      'YYYY-MM-DD HH:mm',
      doctorTimezone
    );
    
    const doctorEndTime = moment.tz(
      `${selectedDateStr} ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
      'YYYY-MM-DD HH:mm',
      doctorTimezone
    );
    
    const nowUser = moment.tz(userTimezone);
    const nowUserCompare = nowUser.clone().second(0).millisecond(0);
    const minLeadTime = nowUserCompare.clone().add(5, 'minutes');
    const startUser = doctorStartTime.clone().tz(userTimezone);
    const endUser = doctorEndTime.clone().tz(userTimezone);

    // Snap starting minute to clean 30-minute marks (:00 or :30)
    const rawMinute = startUser.minute();
    const alignedMinute = rawMinute < 30 ? 0 : 30;
    let currentUserTime = startUser.clone().minute(alignedMinute).second(0).millisecond(0);
    
    while (currentUserTime.isBefore(endUser)) {
      const isPast = currentUserTime.isSameOrBefore(minLeadTime);
      
      const slotTimestamp = currentUserTime.toDate();
      const currentDoctorTime = currentUserTime.clone().tz(doctorTimezone);
      const isBooked = bookedSlots.some(booked => 
        Math.abs(booked.getTime() - slotTimestamp.getTime()) < 60000
      );
      
      if (!isPast && !isBooked) {
        slots.push({
          isInstant: false,
          time: slotTimestamp,
          doctorTime: currentDoctorTime.toDate(),
          display: currentUserTime.format('h:mm A'),
          userDisplay: currentUserTime.format('h:mm A'),
          doctorDisplay: currentDoctorTime.format('h:mm A')
        });
      }
      
      currentUserTime.add(30, 'minutes');
    }
    
    setAvailableSlots(slots);
  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setClientSecret("");
    setPaymentIntentId("");
    
    if (resolvedDoctorUid) {
      await loadBookedAppointments(resolvedDoctorUid, date);
    }
  };

  const handleInstantSelect = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    const instantSlot = {
      isInstant: true,
      time: new Date(),
      doctorTime: new Date(),
      display: "Available Now",
      userDisplay: "Available Now",
      doctorDisplay: "Available Now"
    };
    setSelectedSlot(instantSlot);
  };

  const initializePaymentIntent = async () => {
    if (!user) return;
    setPaymentLoading(true);
    try {
      const docName = doctorInfo ? `Dr. ${doctorInfo.first_name || ''} ${doctorInfo.last_name || ''}`.trim() : "Healthcare Provider";

      // 1. Try Firebase Cloud Function createPaymentIntent (dynamically switches test/live key based on isTestMode)
      try {
        const fn = httpsCallable(functions, "createPaymentIntent");
        const fbRes = await fn({
          amount: 5000,
          currency: "usd",
          type: "consultation",
          isTestMode: Boolean(isTestMode),
        });
        if (fbRes.data?.clientSecret) {
          setClientSecret(fbRes.data.clientSecret);
          setPaymentIntentId(fbRes.data.paymentIntentId || "");
          setPaymentLoading(false);
          return;
        }
      } catch (fnErr) {
        console.warn("createPaymentIntent Cloud Function fallback:", fnErr);
      }

      // 2. Fallback to API route
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 5000, // $50.00
          currency: "usd",
          userId: user.uid,
          doctorId: resolvedDoctorUid || "",
          doctorName: docName,
          appointmentTime: selectedSlot?.time ? selectedSlot.time.getTime() : Date.now(),
          description: `Consultation Deposit - ${docName}`,
          isTestMode: Boolean(isTestMode),
        })
      });

      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId || "");
      }
    } catch (err) {
      console.error("Error creating payment intent:", err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayPalDeposit = async () => {
    if (!selectedSlot || !user || paypalProcessing) return;
    setPaypalProcessing(true);

    try {
      await startPayPalCheckout({
        amountCents: 5000,
        type: "consultation",
        isTestMode: Boolean(isTestMode),
        onSuccess: async ({ orderId }) => {
          await handlePaymentSuccessAndSchedule(orderId);
          setPaypalProcessing(false);
        },
        onError: (err) => {
          console.error("PayPal deposit error:", err);
          alert(err.message || "PayPal deposit payment could not be completed.");
          setPaypalProcessing(false);
        },
        onCancel: () => {
          setPaypalProcessing(false);
        }
      });
    } catch (e) {
      console.error("PayPal flow error:", e);
      setPaypalProcessing(false);
    }
  };


  const handlePaymentSuccessAndSchedule = async (intentId) => {
    if (!selectedSlot || !user) return;
    setScheduling(true);

    try {
      const appointmentTimeMillis = selectedSlot.time.getTime();
      const docName = doctorInfo 
        ? `Dr. ${doctorInfo.first_name || ''} ${doctorInfo.last_name || ''}`.trim() 
        : (profile?.doctor_name || "Healthcare Provider");
      const userFullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user.displayName || 'Patient';

      // 1. Schedule Appointment via Cloud Function
      let scheduledSuccessfully = false;
      let finalApptId = `appt_${Date.now()}_${user.uid.substring(0, 5)}`;
      let finalDocName = docName;

      try {
        const scheduleAppointment = httpsCallable(functions, 'scheduleAppointment');
        const result = await scheduleAppointment({
          appointmentTime: appointmentTimeMillis,
          userTimezone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          doctorTimezone: doctorTimezone || 'America/New_York',
        });
        if (result.data?.success) {
          scheduledSuccessfully = true;
          if (result.data.appointmentId) {
            finalApptId = result.data.appointmentId;
          }
          if (result.data.doctorName) {
            finalDocName = result.data.doctorName.startsWith('Dr.') 
              ? result.data.doctorName 
              : `Dr. ${result.data.doctorName}`;
          }
        }
      } catch (fnErr) {
        console.warn('Cloud function schedule error, executing Firestore fallback:', fnErr);
      }

      // 2. Fallback direct Firestore write if Cloud Function failed
      if (!scheduledSuccessfully) {
        const batch = writeBatch(db);
        const userApptRef = doc(db, 'users', user.uid, 'appointments_upcoming', finalApptId);
        const apptData = {
          appointment_id: finalApptId,
          doctor_id: resolvedDoctorUid || '',
          doctor_name: finalDocName,
          user_id: user.uid,
          user_name: userFullName,
          time: Timestamp.fromMillis(appointmentTimeMillis),
          status: 'scheduled',
          is_instant: Boolean(selectedSlot.isInstant),
          deposit_paid: 50.00,
          payment_id: intentId || paymentIntentId || '',
          payment_intent_id: intentId || paymentIntentId || '',
          created_at: serverTimestamp()
        };

        batch.set(userApptRef, apptData);

        if (resolvedDoctorUid) {
          const docApptRef = doc(db, 'doctors', resolvedDoctorUid, 'appointments_upcoming', finalApptId);
          batch.set(docApptRef, apptData);
        }

        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, { is_consultation_set: true });
        await batch.commit();
      }

      // 3. Record $50 Purchase in users/{uid}/purchases/{intentId}
      let effectiveIntentId = intentId || paymentIntentId;
      if (!effectiveIntentId && user) {
        try {
          const uSnap = await getDoc(doc(db, 'users', user.uid));
          if (uSnap.exists()) {
            effectiveIntentId = uSnap.data()?.lastPaymentId || null;
          }
        } catch (_) {}
      }
      const finalIntentId = effectiveIntentId || `deposit_${Date.now()}`;

      // 4. Ensure payment_id is linked back to the upcoming appointment and shared consultation doc
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'appointments_upcoming', finalApptId),
          {
            payment_id: finalIntentId,
            payment_intent_id: finalIntentId,
            doctor_name: finalDocName,
          },
          { merge: true }
        );

        if (resolvedDoctorUid) {
          await setDoc(
            doc(db, 'doctors', resolvedDoctorUid, 'appointments_upcoming', finalApptId),
            {
              payment_id: finalIntentId,
              payment_intent_id: finalIntentId,
              doctor_name: finalDocName,
            },
            { merge: true }
          );
        }

        // Initialize shared consultations collection doc
        await setDoc(
          doc(db, 'consultations', finalApptId),
          {
            appointment_id: finalApptId,
            user_id: user.uid,
            user_name: userFullName,
            doctor_id: resolvedDoctorUid || '',
            doctor_name: finalDocName,
            time: Timestamp.fromMillis(appointmentTimeMillis),
            status: 'scheduled',
            payment_id: finalIntentId,
            payment_intent_id: finalIntentId,
            deposit_amount: 50.00,
            created_at: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (linkErr) {
        console.warn('Error linking payment_id to appointment:', linkErr);
      }

      try {
        const purchaseRef = doc(db, 'users', user.uid, 'purchases', finalIntentId);
        const pSnap = await getDoc(purchaseRef);
        const purchaseData = {
          id: finalIntentId,
          amount: 50.00,
          currency: 'USD',
          status: 'succeeded',
          type: 'consultation',
          description: `Consultation Deposit - ${finalDocName}`,
          appointment_time: Timestamp.fromMillis(appointmentTimeMillis),
          consultation_id: finalApptId,
          appointment_id: finalApptId,
          doctor_id: resolvedDoctorUid || '',
          doctor_name: finalDocName,
          refund_policy: 'Full $50 refund within 30 days via info@ambewellness.com. 50% ($25) if missed.',
          payment_intent_id: finalIntentId,
        };
        if (!pSnap.exists() || (!pSnap.data()?.created && !pSnap.data()?.created_at)) {
          purchaseData.created = serverTimestamp();
          purchaseData.created_at = serverTimestamp();
        }
        await setDoc(purchaseRef, purchaseData, { merge: true });
      } catch (pErr) {
        console.error('Error saving purchase record:', pErr);
      }

      setBookingSuccess(true);
      router.replace('/user/consult');
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Your payment was processed, but we encountered an issue finalizing your appointment. Please contact info@ambewellness.com with your receipt.');
    } finally {
      setScheduling(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedSlot || !user) return;
    setScheduling(true);

    try {
      const targetApptId = rescheduleAppointmentId || activeAppointment?.id || upcomingAppointments[0]?.id;
      if (!targetApptId) {
        throw new Error('No appointment found to reschedule.');
      }

      const userApptRef = doc(db, 'users', user.uid, 'appointments_upcoming', targetApptId);
      const userApptSnap = await getDoc(userApptRef);
      const apptData = userApptSnap.exists() ? userApptSnap.data() : null;

      if (apptData?.time) {
        const apptDate = apptData.time.toDate ? apptData.time.toDate() : new Date(apptData.time);
        if (Date.now() - apptDate.getTime() > 60 * 60 * 1000) {
          alert('This appointment time has already passed and can no longer be rescheduled.');
          router.push('/user/consult');
          return;
        }
      }

      // 1. Try Cloud Function
      let fnSuccess = false;
      try {
        const rescheduleFn = httpsCallable(functions, "rescheduleAppointmentByUser");
        await rescheduleFn({
          appointmentId: targetApptId,
          newAppointmentTime: selectedSlot.time.getTime(),
        });
        fnSuccess = true;
      } catch (fnErr) {
        console.warn("Cloud function rescheduleAppointmentByUser failed, using fallback:", fnErr);
        if (fnErr.message && fnErr.message.includes("past")) {
          alert(fnErr.message);
          router.push('/user/consult');
          return;
        }
      }

      if (!fnSuccess) {
        const targetDocUid = resolvedDoctorUid || apptData?.doctor_id || apptData?.doctor_uid;
        const newTimestamp = Timestamp.fromDate(selectedSlot.time);
        const updatePayload = {
          time: newTimestamp,
          rescheduled_at: serverTimestamp(),
          rescheduled_by: 'user'
        };

        const batch = writeBatch(db);

        if (userApptSnap.exists()) {
          batch.update(userApptRef, updatePayload);
        } else {
          batch.set(userApptRef, {
            appointment_id: targetApptId,
            doctor_id: targetDocUid || '',
            doctor_name: doctorDisplayName,
            user_id: user.uid,
            user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user.displayName || 'Patient',
            status: 'scheduled',
            deposit_paid: 50.00,
            ...updatePayload
          }, { merge: true });
        }

        if (targetDocUid) {
          const docApptRef = doc(db, 'doctors', targetDocUid, 'appointments_upcoming', targetApptId);
          const docApptSnap = await getDoc(docApptRef);
          if (docApptSnap.exists()) {
            batch.update(docApptRef, updatePayload);
          } else {
            batch.set(docApptRef, {
              appointment_id: targetApptId,
              doctor_id: targetDocUid,
              doctor_name: doctorDisplayName,
              user_id: user.uid,
              user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user.displayName || 'Patient',
              status: 'scheduled',
              deposit_paid: 50.00,
              ...updatePayload
            }, { merge: true });
          }
        }

        await batch.commit();
      }

      setBookingSuccess(true);
      router.replace('/user/consult');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Could not reschedule your appointment. Please try again or contact support.');
    } finally {
      setScheduling(false);
    }
  };

  const handleCheckInstantAvailability = async () => {
    if (!user) return;
    setCheckingInstant(true);
    try {
      const prefHealth = profile?.preferred_health || 'general_health';
      const result = await matchUserWithDoctor(user.uid, prefHealth, true);
      if (result.matched && result.doctor) {
        window.location.href = '/user/consult/schedule?instant=true';
      } else {
        await updateDoc(doc(db, 'users', user.uid), {
          needs_doctor_assignment: true,
          preferred_health: prefHealth,
        }).catch(() => {});
        alert('No doctor is currently available for instant consult right now. Our medical team will assign a specialist for you shortly.');
      }
    } catch (err) {
      console.error('Instant matching error:', err);
      await updateDoc(doc(db, 'users', user.uid), {
        needs_doctor_assignment: true,
        preferred_health: profile?.preferred_health || 'general_health',
      }).catch(() => {});
      alert('Could not check instant availability right now. Your request has been queued for doctor assignment.');
    } finally {
      setCheckingInstant(false);
    }
  };

  // 30 days for calendar
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#C8996A] border-t-transparent" />
        </div>
      </ProtectedRoute>
    );
  }

  // 1. If Questionnaire Not Completed AND no specialty selected -> Show Questionnaire
  if (!profile?.is_free_questionnaire_completed && !profile?.preferred_health) {
    return (
      <ProtectedRoute userType="user">
        <div className="max-w-2xl mx-auto space-y-6">
          <BackButton href="/user/home" label="Back to Home" forceHref={true} />
          <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 bg-[#FFF3E8] border border-[#FFD3AC] rounded-full flex items-center justify-center mx-auto text-3xl">
              📋
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Intake Assessment Required</h2>
            <p className="text-sm text-[#6B6862] max-w-md mx-auto">
              Please complete your intake assessment first so we can match you with the best specialist before scheduling your consultation.
            </p>
            <button
              onClick={() => setShowQuestionnaireModal(true)}
              className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition shadow-sm uppercase tracking-wider"
            >
              Start Intake Assessment
            </button>
          </div>

          {showQuestionnaireModal && (
            <UserQuestionnaireModal
              onComplete={() => {
                setShowQuestionnaireModal(false);
                window.location.reload();
              }}
            />
          )}
        </div>
      </ProtectedRoute>
    );
  }

  // 2. If Doctor Not Assigned -> Show "Finding Your Perfect Match" (Matching Image 1)
  if (!resolvedDoctorUid) {
    return (
      <ProtectedRoute userType="user">
        <div className="max-w-md mx-auto space-y-6">
          <BackButton href="/user/home" label="Back to Home" forceHref={true} />
          <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 text-center shadow-sm space-y-6">
            <div className="w-16 h-16 bg-[#FFF3E8] border border-[#FFD3AC] rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-sm">
              ⏳
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Finding your perfect match</h2>
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
        </div>
      </ProtectedRoute>
    );
  }

  const doctorDisplayName = doctorInfo
    ? `Dr. ${doctorInfo.first_name || ''} ${doctorInfo.last_name || ''}`.trim()
    : (profile?.doctor_name || "Healthcare Provider");

  // 3. If User Just Completed Booking/Rescheduling -> Show Smooth Transition
  if (bookingSuccess) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#C8996A] border-t-transparent" />
          <p className="text-[#8C827A] text-sm font-medium">Opening your consultation...</p>
        </div>
      </ProtectedRoute>
    );
  }

  // 4. If Already Has Active Consultation & Not in Reschedule Mode -> Guard View
  if (hasActiveAppointment && !isRescheduleParam && !scheduling && !bookingSuccess) {
    return (
      <ProtectedRoute userType="user">
        <div className="max-w-2xl mx-auto space-y-6">
          <BackButton href="/user/consult" label="Back to Consultations" forceHref={true} />
          <div className="bg-white border border-[#E7E2D9] rounded-3xl p-8 sm:p-10 text-center shadow-sm space-y-6">
            <div className="w-16 h-16 bg-[#FFF3E8] border border-[#FFD3AC] rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
              ⏳
            </div>
            <div className="space-y-2">
              <h2 
                className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]"
                style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
              >
                Consultation Already Scheduled
              </h2>
              <p className="text-sm text-[#6B6862] max-w-md mx-auto leading-relaxed">
                You already have an active consultation scheduled. You cannot book a second appointment until your current consultation is completed.
              </p>
            </div>

            {activeAppointment && (
              <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
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

            <div className="pt-2 max-w-md mx-auto">
              <button
                onClick={() => router.push('/user/consult')}
                className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 px-6 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm"
              >
                View My Consultations
              </button>
            </div>

          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <WebLayoutWrapper>
        <div className="space-y-6 pb-24">
          <div className="flex items-center gap-4 pt-2">
            <AmbeBackButton onClick={() => router.push('/user/consult')} />
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              {isRescheduleParam ? "Reschedule Consultation" : "Schedule Consultation"}
            </h1>
          </div>

          {/* Doctor Info Card */}
          <div className="bg-white rounded-[20px] p-5 shadow-lg text-[#1E1E1E]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-neutral-100 border-2 border-[#FFD3AC] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                {doctorInfo?.profile_picture ? (
                  <img 
                    src={doctorInfo.profile_picture} 
                    alt={doctorDisplayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xl font-bold text-[#1E1E1E]">
                    {doctorDisplayName.replace('Dr. ', '').charAt(0) || '👨‍⚕️'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg text-[#1E1E1E] leading-tight truncate">{doctorDisplayName}</h3>
                  {isInstantAvailable && (
                    <span className="inline-flex items-center gap-1 bg-[#2E7D32] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      <BoltIcon className="w-3 h-3" /> Available Now
                    </span>
                  )}
                </div>
                {doctorInfo?.title && (
                  <p className="text-xs text-[#C2691C] font-semibold mt-0.5">{doctorInfo.title}</p>
                )}
                {doctorInfo?.field && doctorInfo.field.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {doctorInfo.field.map(f => HEALTH_FIELD_LABELS[f] || f).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Instant Availability Card */}
          {isInstantAvailable && (
            <div className="bg-[#2D2D30]/85 border border-[#FFD3AC]/40 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <BoltIcon className="w-5 h-5 text-[#FFD3AC]" />
                  Instant Consultation Available
                </div>
                <p className="text-xs text-white/70 mt-1">
                  Your doctor is available right now for an immediate video consultation.
                </p>
              </div>
              <button
                onClick={handleInstantSelect}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer ${
                  selectedSlot?.isInstant 
                    ? 'bg-black text-[#FFD3AC]' 
                    : 'bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E]'
                }`}
              >
                <BoltIcon className="w-4 h-4" />
                {selectedSlot?.isInstant ? "Selected: Available Now" : "Available Now"}
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-[#FFD3AC]" />
                Select a Date
              </h2>
              <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md text-white">
                <div className="text-center font-bold text-base text-white mb-4">
                  {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-white/50 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-1">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((date, index) => {
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                    const daySchedule = doctorSchedule?.[dayName];
                    const isScheduledAvail = daySchedule?.is_available === true;
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isAvailable = isScheduledAvail || (isToday && isInstantAvailable);
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const isPast = date < new Date(new Date().setHours(0,0,0,0));
                    
                    return (
                      <button
                        key={index}
                        onClick={() => isAvailable && !isPast && handleDateSelect(date)}
                        disabled={!isAvailable || isPast}
                        className={`h-10 rounded-xl flex flex-col items-center justify-center transition-all text-xs relative ${
                          isSelected
                            ? 'bg-[#FFD3AC] text-[#1E1E1E] font-bold shadow-md'
                            : isAvailable && !isPast
                            ? 'bg-white/10 text-white font-medium hover:bg-white/20 border border-white/10 cursor-pointer'
                            : 'bg-black/20 text-white/20 cursor-not-allowed border border-transparent'
                        }`}
                      >
                        <span>{date.getDate()}</span>
                        {isAvailable && !isPast && (
                          <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-[#1E1E1E]' : 'bg-[#FFD3AC]'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Timezone banner */}
                <div className="mt-4 p-3 bg-black/30 border border-white/10 rounded-xl flex items-center text-xs text-white/70">
                  <ClockIcon className="w-4 h-4 mr-2 text-[#FFD3AC] flex-shrink-0" />
                  <span>Displaying times in: <strong className="text-white font-semibold">{userTimezone || "Local Time"}</strong></span>
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3 flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-[#FFD3AC]" />
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
              
              <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md p-5 text-white">
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {availableSlots.map((slot, index) => {
                      const isSelected = selectedSlot?.time?.getTime() === slot.time?.getTime();
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-xl border transition-all font-medium text-center cursor-pointer ${
                            isSelected
                              ? 'border-[#FFD3AC] bg-[#FFD3AC] text-[#1E1E1E] font-bold shadow-md'
                              : slot.isInstant
                              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                          }`}
                        >
                          {slot.isInstant ? (
                            <div className="flex items-center justify-center gap-1 font-bold text-xs">
                              <BoltIcon className="w-3.5 h-3.5" /> Available Now
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-xs">{slot.userDisplay}</div>
                              {doctorTimezone !== userTimezone && (
                                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#1E1E1E]/70' : 'text-white/50'}`}>
                                  ({slot.doctorDisplay} Dr's time)
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-white/60 text-center py-8">
                    No available time slots for this date. Please select another date from the calendar.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking / Reschedule Review */}
          {selectedSlot && (
            <div className="mt-8 bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6 text-white">
              <h3 className="font-bold text-xl text-white">
                {isRescheduleParam ? "Confirm Rescheduled Slot" : "Confirm Consultation & Pay Deposit"}
              </h3>

              {/* Summary Details */}
              <div className="grid sm:grid-cols-3 gap-4 p-4 bg-black/30 border border-white/10 rounded-xl text-xs text-white">
                <div>
                  <span className="text-white/60 block font-medium">Doctor</span>
                  <strong className="text-sm font-semibold">{doctorDisplayName}</strong>
                </div>
                <div>
                  <span className="text-white/60 block font-medium">
                    {isRescheduleParam ? "New Date & Time" : "Date & Time"}
                  </span>
                  <strong className="text-sm font-semibold text-[#FFD3AC]">
                    {selectedSlot.isInstant 
                      ? "Available Now (Immediate)" 
                      : `${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${selectedSlot.userDisplay}`}
                  </strong>
                </div>
                <div>
                  <span className="text-white/60 block font-medium">Deposit Fee</span>
                  <strong className={`text-sm font-semibold ${isRescheduleParam ? "text-emerald-400" : "text-[#FFD3AC]"}`}>
                    {isRescheduleParam ? "Previously Paid ($50.00)" : "$50.00 USD"}
                  </strong>
                </div>
              </div>

              {isRescheduleParam ? (
                /* Reschedule Mode: No New Deposit Charged */
                <div className="space-y-6 pt-2">
                  <div className="bg-white/5 border border-[#FFD3AC]/30 rounded-xl p-5 space-y-2 text-xs text-white">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#FFD3AC]">
                      <ShieldCheckIcon className="w-5 h-5" />
                      Reschedule Policy
                    </div>
                    <p className="leading-relaxed text-white/80">
                      Your original <strong>$50 deposit</strong> remains securely applied to this appointment. You do not need to pay anything additional to reschedule your slot.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleConfirmReschedule}
                      disabled={scheduling}
                      className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] py-4 rounded-full font-bold text-sm transition disabled:opacity-50 shadow-md uppercase tracking-wider cursor-pointer"
                    >
                      {scheduling ? "Updating Appointment..." : "Confirm Rescheduled Slot"}
                    </button>
                  </div>
                </div>
              ) : (
                /* New Booking Mode: Stripe $50 Deposit Payment Sheet */
                <>
                  {/* Deposit & Refund Policy Card */}
                  <div className="bg-white/5 border border-[#FFD3AC]/30 rounded-xl p-5 space-y-2 text-xs text-white">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#FFD3AC]">
                      <ShieldCheckIcon className="w-5 h-5" />
                      Deposit & Refund Policy
                    </div>
                    <p className="leading-relaxed text-white/80">
                      A <strong>$50 deposit</strong> is required to secure each consultation booking. This deposit goes towards your custom remedies after your consultation.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-white/70 pt-1">
                      <li>
                        <strong>30-Day Full Refund:</strong> You can request a full refund for the $50 deposit by emailing{' '}
                        <a 
                          href="mailto:info@ambewellness.com" 
                          className="font-semibold text-[#FFD3AC] underline hover:text-white"
                        >
                          info@ambewellness.com
                        </a>{' '}
                        within 30 days of the appointment date.
                      </li>
                      <li>
                        <strong>Missed Consultation / No-Show Policy:</strong> If you do not join the scheduled video consultation, only <strong>50% ($25)</strong> of the deposit will be refunded.
                      </li>
                    </ul>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-4 border-t border-white/10">
                    <PaymentMethodSelector
                      selectedMethod={paymentMethod}
                      onSelectMethod={(method) => {
                        setPaymentMethod(method);
                        if (method === "stripe" && !clientSecret && !paymentLoading) {
                          initializePaymentIntent();
                        }
                      }}
                      isTestMode={isTestMode}
                      disabled={scheduling || paymentLoading || paypalProcessing}
                    />
                  </div>

                  {paymentMethod === "stripe" ? (
                    /* Stripe Card Payment Sheet */
                    <div className="pt-3">
                      <h4 className="font-sans font-semibold text-sm text-white mb-3">Enter Card Details</h4>
                      {paymentLoading || !clientSecret || !stripePromise ? (
                        <div className="py-8 flex flex-col items-center justify-center space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FFD3AC] border-t-transparent" />
                          <p className="text-xs text-white/60">Loading secure payment sheet...</p>
                        </div>
                      ) : (
                        <Elements
                          stripe={stripePromise}
                          options={{
                            clientSecret,
                            appearance: {
                              theme: 'night',
                              variables: { colorPrimary: '#FFD3AC', colorBackground: '#1E1E1E', colorText: '#ffffff' }
                            }
                          }}
                        >
                          <ConsultationPaymentForm
                            user={user}
                            doctorInfo={doctorInfo}
                            selectedSlot={selectedSlot}
                            selectedDate={selectedDate}
                            paymentIntentId={paymentIntentId}
                            onSuccess={handlePaymentSuccessAndSchedule}
                          />
                        </Elements>
                      )}
                    </div>
                  ) : (
                    /* PayPal Deposit Flow */
                    <div className="pt-3 space-y-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#003087] text-white flex items-center justify-center font-bold text-lg">
                            <span className="font-serif italic">P</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-white">PayPal Checkout</p>
                            <p className="text-white/60">Secure $50 deposit via your PayPal account or PayPal card</p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePayPalDeposit}
                        disabled={scheduling || paypalProcessing}
                        className="w-full bg-[#0070BA] hover:bg-[#003087] text-white py-4 rounded-full font-bold text-sm transition disabled:opacity-50 shadow-md uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                      >
                        {paypalProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Processing with PayPal...
                          </>
                        ) : (
                          "Pay $50 Deposit with PayPal"
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {bookingSuccess && (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center text-emerald-300 text-sm font-semibold">
                  ✓ {isRescheduleParam ? "Consultation rescheduled successfully! Redirecting to your dashboard..." : "Consultation booked successfully! Redirecting to your dashboard..."}
                </div>
              )}
            </div>
          )}
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}

export default function ScheduleConsultationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#C8996A] border-t-transparent" />
      </div>
    }>
      <ScheduleConsultationContent />
    </Suspense>
  );
}