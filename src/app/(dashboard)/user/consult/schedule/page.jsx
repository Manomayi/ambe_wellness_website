"use client";

import { useState, useEffect, Suspense } from 'react';
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
  Timestamp 
} from 'firebase/firestore';
import { functions, db } from '@/lib/firebase/config';
import { matchUserWithDoctor } from '@/lib/doctorMatching';
import UserQuestionnaireModal from '@/components/user/UserQuestionnaireModal';
import { CalendarIcon, ClockIcon, BoltIcon, ShieldCheckIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import moment from 'moment-timezone';
import BackButton from '@/components/common/BackButton';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

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
        // Fallback success
        await onSuccess(paymentIntentId);
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
        className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-4 rounded-xl font-semibold text-sm transition disabled:opacity-50 shadow-sm uppercase tracking-wider cursor-pointer"
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

  const { user, profile } = useAuth();
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

  // Stripe Payment Sheet states
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

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
    
    if (resolvedDoctorUid) {
      loadDoctorInfo(resolvedDoctorUid);
    } else {
      setLoading(false);
    }
  }, [resolvedDoctorUid]);

  useEffect(() => {
    if (selectedDate && doctorSchedule && doctorTimezone && userTimezone) {
      generateTimeSlots();
    }
  }, [selectedDate, doctorSchedule, bookedSlots, doctorTimezone, userTimezone, isInstantAvailable]);

  // Load / create PaymentIntent whenever a slot is selected
  useEffect(() => {
    if (selectedSlot && user && !clientSecret) {
      initializePaymentIntent();
    }
  }, [selectedSlot, user]);

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
    const currentDoctorTime = doctorStartTime.clone();
    
    while (currentDoctorTime.isBefore(doctorEndTime)) {
      const slotInUserTz = currentDoctorTime.clone().tz(userTimezone);
      const isPast = slotInUserTz.isBefore(nowUser);
      
      const slotTimestamp = slotInUserTz.toDate();
      const isBooked = bookedSlots.some(booked => 
        Math.abs(booked.getTime() - slotTimestamp.getTime()) < 60000
      );
      
      if (!isPast && !isBooked) {
        slots.push({
          isInstant: false,
          time: slotTimestamp,
          doctorTime: currentDoctorTime.clone().toDate(),
          display: slotInUserTz.format('h:mm A'),
          userDisplay: slotInUserTz.format('h:mm A'),
          doctorDisplay: currentDoctorTime.format('h:mm A')
        });
      }
      
      currentDoctorTime.add(60, 'minutes');
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
          description: `Consultation Deposit - ${docName}`
        })
      });

      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId || "");
      } else {
        // Fallback: try Firebase Cloud Function createPaymentIntent
        const fn = httpsCallable(functions, "createPaymentIntent");
        const fbRes = await fn({ amount: 5000, currency: "usd", type: "consultation_deposit" });
        if (fbRes.data?.clientSecret) {
          setClientSecret(fbRes.data.clientSecret);
          setPaymentIntentId(fbRes.data.paymentIntentId || "");
        }
      }
    } catch (err) {
      console.error("Error creating payment intent:", err);
    } finally {
      setPaymentLoading(false);
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
      try {
        const scheduleAppointment = httpsCallable(functions, 'scheduleAppointment');
        const result = await scheduleAppointment({
          appointmentTime: appointmentTimeMillis,
          userTimezone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          doctorTimezone: doctorTimezone || 'America/New_York',
        });
        if (result.data?.success) {
          scheduledSuccessfully = true;
        }
      } catch (fnErr) {
        console.warn('Cloud function schedule error, executing Firestore fallback:', fnErr);
      }

      // 2. Fallback direct Firestore write if Cloud Function failed
      const apptId = `appt_${Date.now()}_${user.uid.substring(0, 5)}`;
      if (!scheduledSuccessfully) {
        const batch = writeBatch(db);
        const userApptRef = doc(db, 'users', user.uid, 'appointments_upcoming', apptId);
        const apptData = {
          appointment_id: apptId,
          doctor_id: resolvedDoctorUid,
          doctor_name: docName,
          user_id: user.uid,
          user_name: userFullName,
          time: Timestamp.fromMillis(appointmentTimeMillis),
          status: 'scheduled',
          is_instant: Boolean(selectedSlot.isInstant),
          deposit_paid: 50.00,
          payment_intent_id: intentId || paymentIntentId || '',
          created_at: serverTimestamp()
        };

        batch.set(userApptRef, apptData);

        if (resolvedDoctorUid) {
          const docApptRef = doc(db, 'doctors', resolvedDoctorUid, 'appointments_upcoming', apptId);
          batch.set(docApptRef, apptData);
        }

        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, { is_consultation_set: true });
        await batch.commit();
      }

      // 3. Record $50 Purchase in users/{uid}/purchases/{intentId}
      const finalIntentId = intentId || paymentIntentId || `deposit_${Date.now()}`;
      try {
        const purchaseRef = doc(db, 'users', user.uid, 'purchases', finalIntentId);
        await setDoc(purchaseRef, {
          id: finalIntentId,
          amount: 50.00,
          currency: 'USD',
          status: 'succeeded',
          type: 'consultation',
          description: `Consultation Deposit - ${docName}`,
          appointment_time: Timestamp.fromMillis(appointmentTimeMillis),
          doctor_id: resolvedDoctorUid || '',
          doctor_name: docName,
          refund_policy: 'Full $50 refund within 30 days via info@ambewellness.com. 50% ($25) if missed.',
          created: serverTimestamp(),
          payment_intent_id: finalIntentId,
        }, { merge: true });
      } catch (pErr) {
        console.error('Error saving purchase record:', pErr);
      }

      setBookingSuccess(true);
      setTimeout(() => {
        router.push('/user/consult');
      }, 1500);
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Your payment was processed, but we encountered an issue finalizing your appointment. Please contact info@ambewellness.com with your receipt.');
    } finally {
      setScheduling(false);
    }
  };

  const handleCheckInstantAvailability = async () => {
    if (!user) return;
    setCheckingInstant(true);
    try {
      const result = await matchUserWithDoctor(user.uid, profile?.preferred_health || 'general_health', true);
      if (result.matched && result.doctor) {
        window.location.href = '/user/consult/schedule?instant=true';
      } else {
        alert('No doctor is currently available for instant consult. Your doctor will be assigned shortly, or you can pick your health areas to match.');
      }
    } catch (err) {
      console.error('Instant matching error:', err);
      alert('Could not check instant availability. Please try again.');
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

  // 1. If Questionnaire Not Completed -> Show Questionnaire
  if (!profile?.is_free_questionnaire_completed) {
    return (
      <ProtectedRoute userType="user">
        <div className="max-w-2xl mx-auto space-y-6">
          <BackButton href="/user/consult" label="Back" />
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
          <BackButton href="/user/consult" label="Back to Consult" />
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

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <BackButton label="Back to Consult" href="/user/consult" />
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Schedule Consultation</h1>

        {/* Doctor Info Card */}
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#FAF8F5] border border-[#E7E2D9] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
              {doctorInfo?.profile_picture ? (
                <img 
                  src={doctorInfo.profile_picture} 
                  alt={doctorDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-2xl font-bold text-[#1A1A1A]">
                  {doctorDisplayName.replace('Dr. ', '').charAt(0) || '👨‍⚕️'}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xl text-[#1A1A1A]">{doctorDisplayName}</h3>
                {isInstantAvailable && (
                  <span className="inline-flex items-center gap-1 bg-[#2E7D32] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    <BoltIcon className="w-3 h-3" /> Available Now
                  </span>
                )}
              </div>
              {doctorInfo?.title && (
                <p className="text-sm text-[#C8996A] font-medium">{doctorInfo.title}</p>
              )}
              {doctorInfo?.field && doctorInfo.field.length > 0 && (
                <p className="text-xs text-[#6B6862] mt-1">
                  {doctorInfo.field.map(f => HEALTH_FIELD_LABELS[f] || f).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Instant Availability Card (Matching Image 2) */}
        {isInstantAvailable && (
          <div className="bg-[#FAF8F5] border border-[#C8996A]/40 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-base">
                <BoltIcon className="w-5 h-5 text-[#C8996A]" />
                Instant Consultation Available
              </div>
              <p className="text-xs text-[#6B6862] mt-1">
                Your doctor is available right now for an immediate video consultation.
              </p>
            </div>
            <button
              onClick={handleInstantSelect}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer ${
                selectedSlot?.isInstant 
                  ? 'bg-[#1A1A1A] text-[#FFD3AC]' 
                  : 'bg-[#2E7D32] text-white hover:bg-[#1B5E20]'
              }`}
            >
              <BoltIcon className="w-4 h-4" />
              {selectedSlot?.isInstant ? "Selected: Available Now" : "Available Now"}
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendar (Matching Image 2) */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-[#C8996A]" />
              Select a Date
            </h2>
            <div className="bg-white border border-[#E7E2D9] rounded-2xl p-5 shadow-sm">
              <div className="text-center font-bold text-base text-[#1A1A1A] mb-4">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#8C827A] mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
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
                      className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all text-xs relative ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-[#FFD3AC] font-bold ring-2 ring-[#FFD3AC]'
                          : isAvailable && !isPast
                          ? 'bg-white text-[#1A1A1A] font-medium hover:bg-[#FAF8F5] hover:text-[#C8996A] border border-[#E7E2D9]/60 cursor-pointer'
                          : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-transparent'
                      }`}
                    >
                      <span>{date.getDate()}</span>
                      {isAvailable && !isPast && (
                        <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-[#FFD3AC]' : 'bg-[#C8996A]'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Timezone banner (Matching Image 2) */}
              <div className="mt-4 p-3 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl flex items-center text-xs text-[#6B6862]">
                <ClockIcon className="w-4 h-4 mr-2 text-[#C8996A] flex-shrink-0" />
                <span>Displaying times in: <strong className="text-[#1A1A1A]">{userTimezone || "Local Time"}</strong></span>
              </div>
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-[#C8996A]" />
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h2>
            
            <div className="bg-white border border-[#E7E2D9] rounded-2xl shadow-sm p-5">
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availableSlots.map((slot, index) => {
                    const isSelected = selectedSlot?.time?.getTime() === slot.time?.getTime();
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border-2 transition-all font-medium text-center cursor-pointer ${
                          isSelected
                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#FFD3AC]'
                            : slot.isInstant
                            ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32] hover:border-[#1B5E20]'
                            : 'border-[#E7E2D9] bg-white text-[#1A1A1A] hover:border-[#C8996A] hover:bg-[#FAF8F5]'
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
                              <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#FFD3AC]/80' : 'text-[#8C827A]'}`}>
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
                <p className="text-xs text-[#6B6862] text-center py-8">
                  No available time slots for this date. Please select another date from the calendar.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Booking & $50 Deposit Review with Stripe Test Mode Payment Sheet */}
        {selectedSlot && (
          <div className="mt-8 bg-white border border-[#E7E2D9] rounded-2xl p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-xl text-[#1A1A1A]">
              Confirm Consultation & Pay Deposit
            </h3>

            {/* Summary Details */}
            <div className="grid sm:grid-cols-3 gap-4 p-4 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl text-xs text-[#1A1A1A]">
              <div>
                <span className="text-[#8C827A] block font-medium">Doctor</span>
                <strong className="text-sm font-semibold">{doctorDisplayName}</strong>
              </div>
              <div>
                <span className="text-[#8C827A] block font-medium">Date & Time</span>
                <strong className="text-sm font-semibold">
                  {selectedSlot.isInstant 
                    ? "Available Now (Immediate)" 
                    : `${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${selectedSlot.userDisplay}`}
                </strong>
              </div>
              <div>
                <span className="text-[#8C827A] block font-medium">Deposit Fee</span>
                <strong className="text-sm font-semibold text-[#1A1A1A]">$50.00 USD</strong>
              </div>
            </div>

            {/* Deposit & Refund Policy Card */}
            <div className="bg-[#FFF9F2] border border-[#FFD3AC] rounded-xl p-5 space-y-2 text-xs text-[#1A1A1A]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#C2691C]">
                <ShieldCheckIcon className="w-5 h-5" />
                Deposit & Refund Policy
              </div>
              <p className="leading-relaxed text-[#353535]">
                A <strong>$50 deposit</strong> is required to secure each consultation booking. This deposit goes towards your custom remedies after your consultation.
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#353535] pt-1">
                <li>
                  <strong>30-Day Full Refund:</strong> You can request a full refund for the $50 deposit by emailing{' '}
                  <a 
                    href="mailto:info@ambewellness.com" 
                    className="font-semibold text-[#C2691C] underline hover:text-[#1A1A1A]"
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

            {/* Stripe Test Mode Payment Sheet */}
            <div className="pt-4 border-t border-[#E7E2D9]">
              <h4 className="font-semibold text-sm text-[#1A1A1A] mb-3">Enter Payment Details</h4>
              {paymentLoading || !clientSecret ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C8996A] border-t-transparent" />
                  <p className="text-xs text-[#8C827A]">Loading secure payment sheet...</p>
                </div>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: { colorPrimary: '#C8996A' }
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

            {bookingSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 text-sm font-semibold">
                ✓ Consultation booked successfully! Redirecting to your dashboard...
              </div>
            )}
          </div>
        )}
      </div>
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