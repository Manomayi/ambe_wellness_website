"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClockIcon, CheckIcon } from '@heroicons/react/24/outline';

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

export default function DoctorSchedulePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      // Load existing schedule
      if (profile.schedule) {
        setSchedule(profile.schedule);
      } else {
        // Initialize empty schedule
        const emptySchedule = {};
        DAYS_OF_WEEK.forEach(day => {
          emptySchedule[day] = {
            isAvailable: false,
            startTime: '09:00',
            endTime: '17:00'
          };
        });
        setSchedule(emptySchedule);
      }
      
      // Set timezone
      setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [profile]);

  const handleDayToggle = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable
      }
    }));
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
      if (schedule[day].isAvailable) {
        const start = schedule[day].startTime;
        const end = schedule[day].endTime;
        
        if (!start || !end) {
          alert(`Please set both start and end times for ${day}`);
          return false;
        }
        
        if (start >= end) {
          alert(`End time must be after start time for ${day}`);
          return false;
        }
      }
    }
    
    // Check if at least one day is available
    const hasAvailableDay = DAYS_OF_WEEK.some(day => schedule[day].isAvailable);
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
      await updateDoc(doc(db, 'doctors', user.uid), {
        schedule,
        timezone,
        is_schedule_set: true
      });
      
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
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <ProtectedRoute userType="doctor">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Set Your Availability</h1>
          <p className="text-gray-600 mt-2">
            Configure your weekly schedule for user consultations
          </p>
        </div>

        {/* Timezone Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Timezone
          </label>
          <select
            value={timezone}
            onChange={handleTimezoneChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          <p className="text-sm text-gray-500 mt-2">
            All appointment times will be shown in this timezone
          </p>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Weekly Schedule</h2>
          
          <div className="space-y-4">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={day}
                      checked={schedule[day]?.isAvailable || false}
                      onChange={() => handleDayToggle(day)}
                      className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <label htmlFor={day} className="ml-3 font-medium text-gray-700 capitalize">
                      {day}
                    </label>
                  </div>
                  
                  {schedule[day]?.isAvailable && (
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="text-sm text-gray-500 mr-2">From:</label>
                        <select
                          value={schedule[day].startTime}
                          onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                          className="p-2 border rounded focus:ring-2 focus:ring-green-500"
                        >
                          {TIME_SLOTS.map(time => (
                            <option key={time} value={time}>
                              {formatTime(time)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 mr-2">To:</label>
                        <select
                          value={schedule[day].endTime}
                          onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                          className="p-2 border rounded focus:ring-2 focus:ring-green-500"
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
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center"
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
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Important Notes:</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Users can book 30-minute consultation slots within your available hours</li>
            <li>You can update your schedule at any time</li>
            <li>Existing appointments won't be affected by schedule changes</li>
            <li>Consider adding buffer time between consultations</li>
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}