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
import AmbeButton from '@/components/common/AmbeButton';
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
  const [timezone, setTimezone] = useState('');
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
        
        // Set timezone
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

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
    setTimezone(e.target.value);
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
          timezone,
          is_schedule_set: true,
          schedule_updated_at: serverTimestamp(),
        },
        { merge: true }
      );
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
          {/* Header */}
          <div className="flex items-center gap-4">
            <AmbeBackButton href="/doctor/menu" />
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
              Set Schedule
            </h1>
          </div>

          {/* Instant Consult Availability Card */}
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-2.5 rounded-full transition-colors shrink-0 ${
                    isAvailableNow
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {isAvailableNow ? (
                    <BoltIconSolid className="h-6 w-6" />
                  ) : (
                    <BoltIcon className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">
                      Available for Instant Consult
                    </h3>
                    {isAvailableNow ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Active Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/60">
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    {isAvailableNow
                      ? 'Users will see you as available right now for immediate bookings'
                      : 'Toggle to become active for immediate bookings'}
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
                      isAvailableNow ? 'bg-emerald-500' : 'bg-white/20'
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
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <InformationCircleIcon className="w-5 h-5 text-[#FFD3AC] shrink-0" />
            <p className="text-xs sm:text-sm text-white/70">
              Select the days you&apos;re available and set your working hours
            </p>
          </div>

          {/* Timezone Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider uppercase block">
              TIMEZONE
            </label>
            <div className="bg-white rounded-xl p-3 border border-gray-300 flex items-center gap-3 shadow-xs">
              <ClockIcon className="w-5 h-5 text-[#FFD3AC] shrink-0" />
              <select
                value={timezone}
                onChange={handleTimezoneChange}
                className="w-full bg-transparent text-[#1E1E1E] text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="America/New_York">Eastern Time (New York)</option>
                <option value="America/Chicago">Central Time (Chicago)</option>
                <option value="America/Denver">Mountain Time (Denver)</option>
                <option value="America/Los_Angeles">Pacific Time (Los Angeles)</option>
                <option value="America/Phoenix">Arizona Time (Phoenix)</option>
                <option value="America/Anchorage">Alaska Time (Anchorage)</option>
                <option value="Pacific/Honolulu">Hawaii Time (Honolulu)</option>
                <option value="America/Toronto">Toronto Time</option>
                <option value="America/Vancouver">Vancouver Time</option>
                <option value="Europe/London">London Time (GMT)</option>
                <option value="Europe/Paris">Paris Time (CET)</option>
                <option value="Asia/Dubai">Dubai Time (GST)</option>
                <option value="Asia/Kolkata">India Time (Kolkata)</option>
                <option value="Asia/Singapore">Singapore Time</option>
                <option value="Asia/Tokyo">Tokyo Time (JST)</option>
                <option value="Australia/Sydney">Sydney Time (AEST)</option>
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
                    className={`capitalize px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFD3AC] text-[#1E1E1E] border-2 border-[#FFD3AC] shadow-md shadow-[#FFD3AC]/20'
                        : 'bg-white text-[#1E1E1E] border border-gray-300 hover:border-gray-400'
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
            <div className="bg-[#2D2D30]/85 border border-white/10 rounded-xl p-4 flex items-center justify-between">
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
              <div className="bg-[#2D2D30]/85 border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-sm sm:text-base text-white">All Days</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Start Time</label>
                    <div className="bg-white rounded-lg p-2.5 border border-gray-300">
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
                    <div className="bg-white rounded-lg p-2.5 border border-gray-300">
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
                  <div key={day} className="bg-[#2D2D30]/85 border border-white/10 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-sm sm:text-base text-white capitalize">{day}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">Start Time</label>
                        <div className="bg-white rounded-lg p-2.5 border border-gray-300">
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
                        <div className="bg-white rounded-lg p-2.5 border border-gray-300">
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
            <AmbeButton
              onClick={handleSave}
              disabled={loading || !hasSelectedDay}
              className="w-full py-4 text-base sm:text-lg font-bold shadow-md tracking-wider"
            >
              {saved ? "SAVED!" : loading ? "SAVING..." : "SAVE SCHEDULE"}
            </AmbeButton>
          </div>
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}
