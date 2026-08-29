"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ClockIcon, CheckIcon, BoltIcon } from '@heroicons/react/24/outline';
import { BoltIcon as BoltIconSolid } from '@heroicons/react/24/solid';
import BackButton from '@/components/common/BackButton';

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

  return (
    <ProtectedRoute userType="doctor">
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton href="/doctor/menu" label="Back to Menu" />
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Set Your Availability</h1>
          <p className="text-[#6B6862] mt-2">
            Configure your instant availability and weekly schedule for patient consultations
          </p>
        </div>

        {/* Instant Availability Toggle Card */}
        <div 
          className={`rounded-xl border p-5 transition-all shadow-sm ${
            isAvailableNow 
              ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200' 
              : 'bg-white border-[#E7E2D9]'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div 
                className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                  isAvailableNow 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-[#F4F1EA] text-[#8C827A]'
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
                  <h3 className="font-bold text-lg text-[#1A1A1A]">
                    Available for Instant Consult
                  </h3>
                  {isAvailableNow ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Active Now
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Offline
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#6B6862] mt-0.5">
                  {isAvailableNow 
                    ? 'Users will see you as available right now for immediate bookings' 
                    : 'Toggle to become active for immediate bookings'}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              {togglingInstant ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#C8996A] border-t-transparent" />
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAvailableNow}
                  onClick={handleToggleInstantAvailability}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C8996A] focus:ring-offset-2 ${
                    isAvailableNow ? 'bg-emerald-600' : 'bg-gray-300'
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
              className={`mt-3 pt-3 border-t text-sm font-medium transition-all flex items-center gap-1.5 ${
                isAvailableNow 
                  ? 'border-emerald-200 text-emerald-700' 
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <CheckIcon className="h-4 w-4 shrink-0" />
              {instantMessage}
            </div>
          )}
        </div>

        {/* Timezone Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-[#353535] mb-2">
            Your Timezone
          </label>
          <select
            value={timezone}
            onChange={handleTimezoneChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#C8996A] focus:border-transparent"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Phoenix">Arizona Time</option>
            <option value="Pacific/Honolulu">Hawaii Time</option>
            <option value="Europe/London">London Time</option>
            <option value="Europe/Paris">Central European Time</option>
            <option value="Asia/Dubai">Dubai Time</option>
            <option value="Asia/Kolkata">India Time</option>
            <option value="Asia/Singapore">Singapore Time</option>
            <option value="Australia/Sydney">Sydney Time</option>
          </select>
          <p className="text-sm text-[#8C827A] mt-2">
            All appointment times will be shown in this timezone
          </p>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Weekly Schedule</h2>
              <p className="text-sm text-[#6B6862] mt-0.5">
                Select your active consultation days and times
              </p>
            </div>
          </div>

          {/* Use Same Hours Toggle */}
          <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1A1A1A]">
                Use same hours for all days
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6862] mt-0.5">
                Set standard start and end times once for all active workdays
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useSameHours}
              onClick={handleToggleSameHours}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C8996A] ${
                useSameHours ? 'bg-[#C8996A]' : 'bg-gray-300'
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

          {/* Shared Time Slot Editor (when Same Hours is active) */}
          {useSameHours && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="font-medium text-[#1A1A1A] flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-[#C8996A] shrink-0" />
                  <span className="text-sm sm:text-base">Working Hours for All Selected Days:</span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex items-center">
                    <label className="text-sm text-[#8C827A] mr-2">From:</label>
                    <select
                      value={commonStartTime}
                      onChange={(e) => handleCommonTimeChange('startTime', e.target.value)}
                      className="p-2 bg-white border border-[#E7E2D9] rounded-lg focus:ring-2 focus:ring-[#C8996A] text-sm"
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <label className="text-sm text-[#8C827A] mr-2">To:</label>
                    <select
                      value={commonEndTime}
                      onChange={(e) => handleCommonTimeChange('endTime', e.target.value)}
                      className="p-2 bg-white border border-[#E7E2D9] rounded-lg focus:ring-2 focus:ring-[#C8996A] text-sm"
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Days List */}
          <div className="space-y-3">
            {DAYS_OF_WEEK.map(day => (
              <div 
                key={day} 
                className={`border rounded-xl p-4 transition-all ${
                  schedule[day]?.isAvailable 
                    ? 'border-[#C8996A]/60 bg-white shadow-xs' 
                    : 'border-[#E7E2D9] bg-[#FAF8F5]/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={day}
                      checked={schedule[day]?.isAvailable || false}
                      onChange={() => handleDayToggle(day)}
                      className="h-5 w-5 text-[#C8996A] rounded focus:ring-[#C8996A] cursor-pointer"
                    />
                    <label htmlFor={day} className="ml-3 font-semibold text-[#353535] capitalize cursor-pointer">
                      {day}
                    </label>
                    {schedule[day]?.isAvailable && useSameHours && (
                      <span className="ml-3 text-xs font-medium text-[#8C827A] bg-[#F4F1EA] px-2.5 py-1 rounded-md">
                        {formatTime(commonStartTime)} – {formatTime(commonEndTime)}
                      </span>
                    )}
                  </div>
                  
                  {schedule[day]?.isAvailable && !useSameHours && (
                    <div className="flex items-center space-x-3 sm:space-x-4 pl-8 sm:pl-0">
                      <div className="flex items-center">
                        <label className="text-sm text-[#8C827A] mr-2">From:</label>
                        <select
                          value={schedule[day]?.startTime || '09:00'}
                          onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                          className="p-2 bg-white border border-[#E7E2D9] rounded-lg focus:ring-2 focus:ring-[#C8996A] text-sm"
                        >
                          {TIME_SLOTS.map(time => (
                            <option key={time} value={time}>
                              {formatTime(time)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <label className="text-sm text-[#8C827A] mr-2">To:</label>
                        <select
                          value={schedule[day]?.endTime || '17:00'}
                          onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                          className="p-2 bg-white border border-[#E7E2D9] rounded-lg focus:ring-2 focus:ring-[#C8996A] text-sm"
                        >
                          {TIME_SLOTS.map(time => (
                            <option key={time} value={time}>
                              {formatTime(time)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/doctor/dashboard')}
            className="text-[#6B6862] hover:text-[#1A1A1A]"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#FFD3AC] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckIcon className="h-5 w-5 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <ClockIcon className="h-5 w-5 mr-2" />
                Save Schedule
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-[#F4F1EA] border border-[#E7E2D9] rounded-lg p-4">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Important Notes:</h3>
          <ul className="text-sm text-[#6B6862] space-y-1 list-disc list-inside">
            <li>Users can book 30-minute consultation slots within your available hours</li>
            <li>Instant availability allows patients searching for immediate care to connect with you right now</li>
            <li>Use the "same hours" toggle to quickly set identical hours across all selected days</li>
            <li>You can update your instant availability and schedule at any time</li>
            <li>Existing appointments won't be affected by schedule changes</li>
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}
