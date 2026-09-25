"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ClockIcon, CheckIcon, BoltIcon, InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { BoltIcon as BoltIconSolid } from '@heroicons/react/24/solid';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';

const DAYS_OF_WEEK = [
  'monday',
  'tuesday', 
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00'
];

const TIMEZONES = [
  { value: 'Asia/Kolkata', city: 'Kolkata', region: 'Asia' },
  { value: 'America/New_York', city: 'New York', region: 'America' },
  { value: 'America/Chicago', city: 'Chicago', region: 'America' },
  { value: 'America/Denver', city: 'Denver', region: 'America' },
  { value: 'America/Los_Angeles', city: 'Los Angeles', region: 'America' },
  { value: 'America/Phoenix', city: 'Phoenix', region: 'America' },
  { value: 'America/Anchorage', city: 'Anchorage', region: 'America' },
  { value: 'Pacific/Honolulu', city: 'Honolulu', region: 'Pacific' },
  { value: 'America/Toronto', city: 'Toronto', region: 'America' },
  { value: 'America/Vancouver', city: 'Vancouver', region: 'America' },
  { value: 'Europe/London', city: 'London', region: 'Europe' },
  { value: 'Europe/Paris', city: 'Paris', region: 'Europe' },
  { value: 'Asia/Dubai', city: 'Dubai', region: 'Asia' },
  { value: 'Asia/Singapore', city: 'Singapore', region: 'Asia' },
  { value: 'Asia/Tokyo', city: 'Tokyo', region: 'Asia' },
  { value: 'Australia/Sydney', city: 'Sydney', region: 'Australia' },
];

function normalizeTimezone(tz) {
  if (!tz) return 'Asia/Kolkata';
  if (tz === 'Asia/Calcutta' || tz === 'Calcutta' || tz === 'IST') {
    return 'Asia/Kolkata';
  }
  return tz;
}

function getTimezoneDisplay(tz) {
  const normalized = normalizeTimezone(tz);
  const found = TIMEZONES.find((t) => t.value === normalized);
  if (found) return found;
  const parts = normalized.split('/');
  let city = parts.length > 1 ? parts[parts.length - 1].replace(/_/g, ' ') : normalized;
  if (city === 'Calcutta') city = 'Kolkata';
  const region = parts.length > 1 ? parts[0] : '';
  return { city, region };
}

function parseTimeString(val, defaultTime = '09:00') {
  if (!val) return defaultTime;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const h = String(val.hour ?? 9).padStart(2, '0');
    const m = String(val.minute ?? 0).padStart(2, '0');
    return `${h}:${m}`;
  }
  return defaultTime;
}

export default function DoctorSchedulePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Instant Consult Availability State
  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [togglingInstant, setTogglingInstant] = useState(false);
  const [instantMessage, setInstantMessage] = useState('');

  // "Use same hours for all days" state
  const [useSameHours, setUseSameHours] = useState(true);
  const [commonStartTime, setCommonStartTime] = useState('09:00');
  const [commonEndTime, setCommonEndTime] = useState('17:00');

  useEffect(() => {
    async function loadDoctorSchedule() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'doctors', user.uid));
        const data = snap.exists() ? snap.data() : (profile || {});
        
        // Load instant consult availability
        setIsAvailableNow(Boolean(data.is_available_now));
        
        // Set timezone (ensuring Asia/Calcutta is mapped to Asia/Kolkata)
        const detectedTz = normalizeTimezone(data.timezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata'));
        setTimezone(detectedTz);

        const scheduleRaw = data.schedule || {};
        const parsedSchedule = {};

        DAYS_OF_WEEK.forEach(day => {
          const rawDay = scheduleRaw[day] || scheduleRaw[day.toLowerCase()] || {};
          const isAvail = Boolean(rawDay.isAvailable ?? rawDay.is_available ?? false);
          const start = parseTimeString(rawDay.startTime || rawDay.start_time, '09:00');
          const end = parseTimeString(rawDay.endTime || rawDay.end_time, '17:00');

          parsedSchedule[day] = {
            isAvailable: isAvail,
            is_available: isAvail,
            startTime: start,
            endTime: end,
          };
        });

        setSchedule(parsedSchedule);

        // Check if active days share same hours
        const activeDays = DAYS_OF_WEEK.filter(day => parsedSchedule[day]?.isAvailable);
        if (activeDays.length > 0) {
          const firstDay = activeDays[0];
          const firstStart = parsedSchedule[firstDay].startTime;
          const firstEnd = parsedSchedule[firstDay].endTime;
          setCommonStartTime(firstStart);
          setCommonEndTime(firstEnd);

          const allSame = activeDays.every(
            day =>
              parsedSchedule[day].startTime === firstStart &&
              parsedSchedule[day].endTime === firstEnd
          );
          setUseSameHours(allSame);
        }
      } catch (e) {
        console.error('Error loading schedule from Firestore:', e);
      }
    }

    loadDoctorSchedule();
  }, [user, profile]);

  const handleToggleInstantAvailability = async () => {
    if (!user || togglingInstant) return;
    
    const nextValue = !isAvailableNow;
    setTogglingInstant(true);
    
    try {
      await setDoc(doc(db, 'doctors', user.uid), {
        is_available_now: nextValue,
        last_availability_update: serverTimestamp(),
      }, { merge: true });
      
      setIsAvailableNow(nextValue);
      setInstantMessage(
        nextValue 
          ? 'You are now available for instant consults!' 
          : 'Instant availability turned off.'
      );
      setTimeout(() => setInstantMessage(''), 4000);
    } catch (error) {
      console.error('Error toggling instant availability:', error);
      alert('Could not update your instant availability. Please try again.');
    } finally {
      setTogglingInstant(false);
    }
  };

  const handleToggleSameHours = () => {
    const nextValue = !useSameHours;
    setUseSameHours(nextValue);
    setSaved(false);

    if (nextValue) {
      // When turning ON, sync all days to common start/end times
      setSchedule(prev => {
        const updated = { ...prev };
        DAYS_OF_WEEK.forEach(day => {
          if (updated[day]) {
            updated[day] = {
              ...updated[day],
              startTime: commonStartTime,
              endTime: commonEndTime,
            };
          }
        });
        return updated;
      });
    }
  };

  const handleCommonTimeChange = (field, value) => {
    if (field === 'startTime') setCommonStartTime(value);
    if (field === 'endTime') setCommonEndTime(value);
    setSaved(false);

    setSchedule(prev => {
      const updated = { ...prev };
      DAYS_OF_WEEK.forEach(day => {
        if (updated[day]) {
          updated[day] = {
            ...updated[day],
            [field]: value
          };
        }
      });
      return updated;
    });
  };

  const handleDayToggle = (day) => {
    setSchedule(prev => {
      const isCurrentlyAvailable = prev[day]?.isAvailable || false;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          isAvailable: !isCurrentlyAvailable,
          is_available: !isCurrentlyAvailable,
          startTime: useSameHours ? commonStartTime : (prev[day]?.startTime || commonStartTime),
          endTime: useSameHours ? commonEndTime : (prev[day]?.endTime || commonEndTime),
        }
      };
    });
    setSaved(false);
  };

  const handleTimeChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
    setSaved(false);
  };

  const handleTimezoneChange = (e) => {
    setTimezone(normalizeTimezone(e.target.value));
    setSaved(false);
  };

  const validateSchedule = () => {
    for (const day of DAYS_OF_WEEK) {
      if (schedule[day]?.isAvailable) {
        const start = schedule[day].startTime;
        const end = schedule[day].endTime;
        
        if (!start || !end) {
          alert('Please set both start and end times for ' + day);
          return false;
        }
        
        if (start >= end) {
          alert('End time must be after start time for ' + day);
          return false;
        }
      }
    }
    
    // Check if at least one day is available
    const hasAvailableDay = DAYS_OF_WEEK.some(day => schedule[day]?.isAvailable);
    if (!hasAvailableDay) {
      alert('Please set availability for at least one day');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateSchedule()) return;
    
    setLoading(true);
    try {
      const scheduleToSave = {};
      DAYS_OF_WEEK.forEach((day) => {
        const dayConfig = schedule[day] || {
          isAvailable: false,
          startTime: '09:00',
          endTime: '17:00',
        };
        const isAvail = Boolean(dayConfig.isAvailable || dayConfig.is_available);
        const [startH, startM] = (dayConfig.startTime || '09:00').split(':').map(Number);
        const [endH, endM] = (dayConfig.endTime || '17:00').split(':').map(Number);

        scheduleToSave[day.toLowerCase()] = {
          is_available: isAvail,
          isAvailable: isAvail,
          startTime: dayConfig.startTime || '09:00',
          endTime: dayConfig.endTime || '17:00',
          start_time: { hour: isNaN(startH) ? 9 : startH, minute: isNaN(startM) ? 0 : startM },
          end_time: { hour: isNaN(endH) ? 17 : endH, minute: isNaN(endM) ? 0 : endM },
        };
      });

      await setDoc(
        doc(db, 'doctors', user.uid),
        {
          schedule: scheduleToSave,
          timezone: normalizeTimezone(timezone),
          is_schedule_set: true,
          schedule_updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { is_schedule_set: true },
          { merge: true }
        );
      } catch (_) {}
      
      setSaved(true);
      setTimeout(() => {
        router.push('/doctor/home');
      }, 700);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return displayHour + ':' + minutes + ' ' + ampm;
  };

  const hasSelectedDay = DAYS_OF_WEEK.some(d => schedule[d]?.isAvailable);

  return (
    <ProtectedRoute userType="doctor">
      <WebLayoutWrapper>
        <div className="space-y-6 pb-12">
          {/* Sticky Header matching Flutter AppBar */}
          <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm">
            <div className="relative flex items-center justify-center">
              <div className="absolute left-0">
                <AmbeBackButton
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.history.length > 1) {
                      router.back();
                    } else {
                      router.push('/doctor/home');
                    }
                  }}
                />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal text-center">
                Set Your Schedule
              </h1>
            </div>
          </div>

          {/* Hero Availability Card matching mobile app */}
          <div className="bg-gradient-to-br from-[#FFD3AC] to-[#F3BE8B] border border-[#FFD3AC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-lg text-[#1E1E1E]">
            <div className="flex justify-center mb-3 text-[#1E1E1E]">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM7 12h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 4h2v2h-2zm4 0h2v2h-2z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] mb-2 font-sans tracking-tight">
              Set Your Availability
            </h2>
            <p className="text-sm sm:text-base text-[#1E1E1E]/90 font-sans max-w-md mx-auto leading-relaxed">
              Choose the days and times you&apos;re available for consultations
            </p>
          </div>

          {/* Instant Consult Availability Card */}
          <div className="bg-[#1E1E1E]/85 backdrop-blur-md border border-emerald-500/60 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="text-emerald-400 shrink-0">
                  <BoltIconSolid className="h-7 w-7 text-[#00E676]" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white font-sans">
                    Available for Instant Consult
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60 mt-0.5 font-sans">
                    Users will see you as available right now
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                {togglingInstant ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#FFD3AC] border-t-transparent" />
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAvailableNow}
                    onClick={handleToggleInstantAvailability}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAvailableNow ? 'bg-[#00E676]' : 'bg-white/20'
                    }`}
                  >
                    <span className="sr-only">Toggle instant consult availability</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isAvailableNow ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>

            {instantMessage && (
              <div
                className={`mt-3 pt-3 border-t text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isAvailableNow
                    ? 'border-emerald-500/20 text-emerald-400'
                    : 'border-white/10 text-white/60'
                }`}
              >
                <CheckIcon className="h-4 w-4 shrink-0" />
                {instantMessage}
              </div>
            )}
          </div>

          {/* Instructions banner */}
          <div className="bg-[#2A2A2E] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5">
            <InformationCircleIcon className="w-6 h-6 text-[#FFD3AC] shrink-0" />
            <p className="text-sm sm:text-base text-white/80 font-normal">
              Select the days you&apos;re available and set your working hours
            </p>
          </div>

          {/* Timezone Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider uppercase block">
              TIMEZONE
            </label>
            <div className="relative bg-white rounded-2xl px-4 py-3.5 border border-gray-200 flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-300 transition">
              <div className="flex items-center gap-3 min-w-0">
                <ClockIcon className="w-6 h-6 text-[#FF9E54] shrink-0" />
                <div className="min-w-0">
                  <div className="text-base font-bold text-black font-sans leading-tight truncate">
                    {getTimezoneDisplay(timezone).city}
                  </div>
                  <div className="text-xs text-gray-500 font-sans leading-tight mt-0.5">
                    {getTimezoneDisplay(timezone).region}
                  </div>
                </div>
              </div>
              <ChevronDownIcon className="w-5 h-5 text-[#FF9E54] shrink-0 ml-2" />
              <select
                value={timezone}
                onChange={handleTimezoneChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.city} ({tz.region})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Days Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider uppercase block">
              SELECT DAYS
            </label>
            <div className="flex flex-wrap gap-2.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = schedule[day]?.isAvailable || false;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`capitalize px-5 py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFD3AC] text-[#1E1E1E] font-bold border-2 border-[#FFD3AC] shadow-md shadow-[#FFD3AC]/30'
                        : 'bg-white text-black font-medium border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hours Section */}
          <div className="space-y-4">
            <label className="text-xs font-semibold text-white/60 tracking-wider uppercase block">
              SET HOURS
            </label>

            {/* Same hours toggle */}
            <div className="bg-[#2A2A2E] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-white">
                  Use same hours for all days
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Set standard start and end times once for all active workdays
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useSameHours}
                onClick={handleToggleSameHours}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  useSameHours ? 'bg-[#FFD3AC]' : 'bg-white/20'
                }`}
              >
                <span className="sr-only">Use same hours for all days</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    useSameHours ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Time Slot Editor */}
            {useSameHours ? (
              <div className="bg-[#2A2A2E] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                <h4 className="font-bold text-sm sm:text-base text-white">All Days</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Start Time</label>
                    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs">
                      <select
                        value={commonStartTime}
                        onChange={(e) => handleCommonTimeChange('startTime', e.target.value)}
                        className="w-full bg-transparent text-[#1E1E1E] text-sm font-semibold focus:outline-none cursor-pointer"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {formatTime(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">End Time</label>
                    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs">
                      <select
                        value={commonEndTime}
                        onChange={(e) => handleCommonTimeChange('endTime', e.target.value)}
                        className="w-full bg-transparent text-[#1E1E1E] text-sm font-semibold focus:outline-none cursor-pointer"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {formatTime(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {DAYS_OF_WEEK.filter((day) => schedule[day]?.isAvailable).map((day) => (
                  <div key={day} className="bg-[#2A2A2E] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                    <h4 className="font-bold text-sm sm:text-base text-white capitalize">{day}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">Start Time</label>
                        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs">
                          <select
                            value={schedule[day]?.startTime || '09:00'}
                            onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                            className="w-full bg-transparent text-[#1E1E1E] text-sm font-semibold focus:outline-none cursor-pointer"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={t} value={t}>
                                {formatTime(t)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">End Time</label>
                        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs">
                          <select
                            value={schedule[day]?.endTime || '17:00'}
                            onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                            className="w-full bg-transparent text-[#1E1E1E] text-sm font-semibold focus:outline-none cursor-pointer"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={t} value={t}>
                                {formatTime(t)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Action matching Flutter full-width bottom button */}
          <div className="pt-6 pb-12">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#FFD3AC] hover:bg-[#ffe2c8] active:scale-[0.99] text-[#1E1E1E] font-bold py-4 rounded-full transition-all uppercase tracking-wider shadow-xl text-base sm:text-lg cursor-pointer flex items-center justify-center disabled:opacity-60"
            >
              {saved ? "SAVED!" : loading ? "SAVING..." : "SET SCHEDULE & CONTINUE"}
            </button>
          </div>
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}
