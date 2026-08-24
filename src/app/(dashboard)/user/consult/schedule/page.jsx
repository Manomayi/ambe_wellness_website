"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase/config';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import moment from 'moment-timezone';
import BackButton from '@/components/common/BackButton';

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

export default function ScheduleConsultationPage() {
  const router = useRouter();
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

  useEffect(() => {
    // Detect user timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
    
    if (profile?.doctor?.uid) {
      loadDoctorInfo();
    } else {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (selectedDate && doctorSchedule && doctorTimezone && userTimezone) {
      generateTimeSlots();
    }
  }, [selectedDate, doctorSchedule, bookedSlots, doctorTimezone, userTimezone]);

  const loadDoctorInfo = async () => {
    try {
      // Get doctor's info and schedule
      const doctorDoc = await getDoc(doc(db, 'doctors', profile.doctor.uid));
      if (doctorDoc.exists()) {
        const doctorData = doctorDoc.data();
        setDoctorInfo(doctorData);
        setDoctorSchedule(doctorData.schedule || {});
        const docTz = doctorData.timezone || 'America/New_York';
        setDoctorTimezone(docTz);
        
        // Check if schedule is set
        if (!doctorData.schedule || !doctorData.is_schedule_set) {
          setHasScheduleError(true);
          console.log('Doctor has not set their schedule');
        }
        
        // Always load booked appointments for selectedDate (today by default)
        const dateToLoad = selectedDate || new Date();
        await loadBookedAppointments(dateToLoad);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading doctor info:', error);
      setHasScheduleError(true);
      setLoading(false);
    }
  };

  const loadBookedAppointments = async (date) => {
    const doctorUid = profile?.doctor?.uid;
    if (!doctorUid) return;

    try {
      // Get start and end of selected day
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      // Query upcoming appointments for this doctor on this day
      const appointmentsQuery = query(
        collection(db, 'doctors', doctorUid, 'appointments_upcoming'),
        where('time', '>=', Timestamp.fromDate(startOfDay)),
        where('time', '<', Timestamp.fromDate(endOfDay))
      );
      
      const snapshot = await getDocs(appointmentsQuery);
      const booked = snapshot.docs.map(doc => doc.data().time.toDate());
      setBookedSlots(booked);
      
      console.log('Loaded booked slots:', booked);
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
    
    if (!daySchedule || !daySchedule.is_available) {
      setAvailableSlots([]);
      return;
    }
    
    const slots = [];
    
    // Get start and end times from doctor's schedule
    const startTimeData = daySchedule.start_time;
    const endTimeData = daySchedule.end_time;
    
    if (!startTimeData || !endTimeData) {
      setAvailableSlots([]);
      return;
    }
    
    const startHour = startTimeData.hour || 0;
    const startMinute = startTimeData.minute || 0;
    const endHour = endTimeData.hour || 0;
    const endMinute = endTimeData.minute || 0;
    
    // Create moment objects in doctor's timezone
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
    
    // Get current time in user's timezone
    const nowUser = moment.tz(userTimezone);
    
    const currentDoctorTime = doctorStartTime.clone();
    
    while (currentDoctorTime.isBefore(doctorEndTime)) {
      // Convert doctor time to user timezone for display
      const slotInUserTz = currentDoctorTime.clone().tz(userTimezone);
      
      // Check if slot is in the past
      const isPast = slotInUserTz.isBefore(nowUser);
      
      // Check if slot is already booked
      const slotTimestamp = slotInUserTz.toDate();
      const isBooked = bookedSlots.some(booked => 
        Math.abs(booked.getTime() - slotTimestamp.getTime()) < 60000 // Within 1 minute
      );
      
      if (!isPast && !isBooked) {
        slots.push({
          time: slotTimestamp,
          doctorTime: currentDoctorTime.clone().toDate(),
          display: slotInUserTz.format('h:mm A'),
          userDisplay: slotInUserTz.format('h:mm A'),
          doctorDisplay: currentDoctorTime.format('h:mm A')
        });
      }
      
      // Add 60 minutes for next slot
      currentDoctorTime.add(60, 'minutes');
    }
    
    setAvailableSlots(slots);
  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    
    // Load booked slots for the selected date
    if (profile?.doctor?.uid) {
      await loadBookedAppointments(date);
    }
  };

  const handleSchedule = async () => {
    if (!selectedSlot) return;
    
    setScheduling(true);
    try {
      const scheduleAppointment = httpsCallable(functions, 'scheduleAppointment');
      const result = await scheduleAppointment({
        appointmentTime: selectedSlot.time.getTime(),
        userTimezone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        doctorTimezone: doctorTimezone,
      });
      
      if (result.data.success) {
        router.push('/user/consult');
      } else {
        alert(result.data.message || 'Failed to schedule appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      
      let errorMessage = 'Failed to schedule appointment. Please try again.';

      // Callable errors carry the code on error.code ("functions/already-exists"),
      // not in the message — checking only the message silently fell through to
      // the generic error for both of these cases.
      const isAlreadyExists =
        error.code?.includes('already-exists') ||
        error.message?.includes('already-exists');

      if (isAlreadyExists) {
        if (error.message?.includes('time slot')) {
          errorMessage = 'This time slot is already booked. Please select another time.';
        } else if (error.message?.includes('upcoming appointment')) {
          errorMessage =
            'You already have an upcoming appointment scheduled. ' +
            'Please edit or reschedule it from the Consult page.';
        }
      }

      alert(errorMessage);
    } finally {
      setScheduling(false);
    }
  };

  // Generate next 30 days for calendar
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

  if (!profile?.doctor) {
    return (
      <ProtectedRoute userType="user">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">No Doctor Assigned</h2>
          <p className="text-sm text-[#6B6862] mb-6">
            You need to be matched with a healthcare provider before scheduling consultations.
          </p>
          <button
            onClick={() => router.push('/user/get-matched')}
            className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition shadow-sm"
          >
            Get Matched Now
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  if (hasScheduleError) {
    return (
      <ProtectedRoute userType="user">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Schedule Not Available</h2>
          <p className="text-sm text-[#6B6862] mb-6">
            Your doctor has not set their availability yet. Please try again later or contact support.
          </p>
          <button
            onClick={() => router.push('/user/consult')}
            className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition shadow-sm"
          >
            Back to Consultations
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-6xl mx-auto space-y-6">
        <BackButton label="Back to Consult" href="/user/consult" />
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Schedule Your Consultation</h1>

        {/* Doctor Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
              {doctorInfo?.profile_picture ? (
                <img 
                  src={doctorInfo.profile_picture} 
                  alt={`Dr. ${doctorInfo.first_name} ${doctorInfo.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-green-100 flex items-center justify-center">
                  <span className="text-2xl">👨‍⚕️</span>
                </div>
              )}
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-lg text-gray-900">
                Dr. {doctorInfo?.first_name || profile.doctor.first_name} {doctorInfo?.last_name || profile.doctor.last_name}
              </h3>
              {doctorInfo?.title && (
                <p className="text-gray-700">{doctorInfo.title}</p>
              )}
              {doctorInfo?.field && doctorInfo.field.length > 0 && (
                <p className="text-sm text-gray-600">
                  {doctorInfo.field.map(f => HEALTH_FIELD_LABELS[f] || f).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendar */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2" />
              Select a Date
            </h2>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                    {day}
                  </div>
                ))}
                {calendarDays.map((date, index) => {
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  const daySchedule = doctorSchedule?.[dayName];
                  const isAvailable = daySchedule?.is_available === true;
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isPast = date < new Date(new Date().setHours(0,0,0,0));
                  
                  return (
                    <button
                      key={index}
                      onClick={() => isAvailable && !isPast && handleDateSelect(date)}
                      disabled={!isAvailable || isPast}
                      className={`p-3 rounded-lg text-center transition-all ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-[#FFD3AC] font-semibold ring-2 ring-[#FFD3AC]'
                          : isAvailable && !isPast
                          ? 'bg-white text-[#1A1A1A] font-medium hover:bg-[#FAF8F5] hover:text-[#C8996A] cursor-pointer'
                          : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      } ${isToday && isAvailable && !isPast ? 'ring-2 ring-[#C8996A]' : ''}`}
                    >
                      <div className="text-sm">{date.getDate()}</div>
                      {isToday && <div className="text-xs">Today</div>}
                    </button>
                  );
                })}
              </div>
              
              {/* Timezone info */}
              {doctorTimezone && userTimezone && (
                <div className="mt-4 p-3 bg-[#FAF8F5] border border-[#E7E2D9] rounded-lg">
                  <p className="text-xs text-[#6B6862]">
                    <span className="block">Your timezone: {userTimezone}</span>
                    {doctorTimezone !== userTimezone && (
                      <>
                        <span className="block">Doctor's timezone: {doctorTimezone}</span>
                        <span className="block mt-1 font-medium text-[#1A1A1A]">
                          Time difference: {moment.tz(userTimezone).format('Z')} (You) vs {moment.tz(doctorTimezone).format('Z')} (Doctor)
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2 text-[#C8996A]" />
              Available Time Slots
            </h2>
            
            {selectedDate ? (
              <div className="bg-white border border-[#E7E2D9] rounded-xl shadow-sm p-4">
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg border-2 transition-all font-medium ${
                          selectedSlot?.time === slot.time
                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#FFD3AC]'
                            : 'border-[#E7E2D9] bg-white text-[#1A1A1A] hover:border-[#C8996A] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-sm">{slot.userDisplay}</div>
                          {doctorTimezone !== userTimezone && (
                            <div className={`text-xs mt-0.5 ${
                              selectedSlot?.time === slot.time ? 'text-[#FFD3AC]/80' : 'text-[#8C827A]'
                            }`}>
                              ({slot.doctorDisplay} Dr's time)
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B6862] text-center py-8">
                    No available time slots for this date
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl p-8 text-center text-sm text-[#6B6862]">
                Please select a date to view available time slots
              </div>
            )}
          </div>
        </div>

        {/* Confirmation */}
        {selectedSlot && (
          <div className="mt-8 bg-white border border-[#E7E2D9] rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-[#1A1A1A] mb-2">Confirm Your Appointment</h3>
            <p className="text-sm text-[#6B6862] mb-4 space-y-1">
              <strong className="text-[#1A1A1A]">Date:</strong> {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              <br />
              <strong className="text-[#1A1A1A]">Time:</strong> {selectedSlot.userDisplay} (Your time)
              {doctorTimezone !== userTimezone && (
                <>
                  <br />
                  <span className="text-xs text-[#8C827A]">
                    {selectedSlot.doctorDisplay} (Doctor's time)
                  </span>
                </>
              )}
              <br />
              <strong className="text-[#1A1A1A]">Duration:</strong> 60 minutes
            </p>
            <button
              onClick={handleSchedule}
              disabled={scheduling}
              className="w-full md:w-auto bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-8 py-3 rounded-lg font-medium text-sm transition disabled:opacity-50 shadow-sm uppercase tracking-wider"
            >
              {scheduling ? 'Scheduling...' : 'Confirm Appointment'}
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> All appointment times are shown in your local timezone. 
            You'll receive a confirmation email with details about how to join your video consultation.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}