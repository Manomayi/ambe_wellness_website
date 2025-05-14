'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';

export default function ScheduleConsultationPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [doctorName, setDoctorName] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');
      const uid = user.uid;
      setUserId(uid);
      // Fetch doctor UID from patient
      const patSnap = await getDoc(doc(db, 'patients', uid));
      const docUid = patSnap.data()?.doctor?.uid;
      setDoctorId(docUid);
      // Fetch doctor name
      const drSnap = await getDoc(doc(db, 'doctors', docUid));
      setDoctorName(`Dr. ${drSnap.data()?.first_name} ${drSnap.data()?.last_name}`);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    // Generate hourly slots from 9 to 17 for selectedDate
    const date = new Date(selectedDate);
    const slots = [];
    for (let h = 9; h < 17; h++) {
      const dt = new Date(date);
      dt.setHours(h, 0, 0, 0);
      slots.push(dt);
    }
    setTimeSlots(slots);
    setSelectedSlotTime(null);
  }, [selectedDate]);

  const formatTime = dt => dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const handleSchedule = async () => {
    if (!selectedSlotTime || !userId || !doctorId) return;
    setSubmitting(true);
    try {
      const batch = writeBatch(db);
      // create appointment ID
      const apptRef = doc(collection(db, 'doctors', doctorId, 'appointments_upcoming'));
      const id = apptRef.id;
      const payload = {
        appointment_id: id,
        patient_id: userId,
        patient_name: auth.currentUser.displayName || '',
        doctor_id: doctorId,
        doctor_name: doctorName,
        time: selectedSlotTime,
        status: 'upcoming',
        created_at: new Date()
      };
      batch.set(apptRef, payload);
      batch.set(doc(db, 'patients', userId, 'appointments_upcoming', id), payload);
      await batch.commit();
      alert('Appointment scheduled!');
      router.push('/member/consult');
    } catch (err) {
      console.error(err);
      alert('Scheduling failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-semibold text-gray-800">Schedule Consultation</h1>

      <div>
        <label className="block text-sm uppercase font-semibold text-gray-600 mb-2">Select Date</label>
        <input
          type="date"
          className="w-full bg-white border border-gray-300 rounded-lg p-2"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm uppercase font-semibold text-gray-600 mb-2">Select Time</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {timeSlots.map((dt, idx) => {
            const isSelected = selectedSlotTime?.getTime() === dt.getTime();
            return (
              <button
                key={idx}
                onClick={() => setSelectedSlotTime(dt)}
                className={`py-2 rounded-lg shadow border transition ${isSelected ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}`}
              >
                {formatTime(dt)}
              </button>
            );
          })}
        </div>
      </div>

      <button
        disabled={!selectedSlotTime || submitting}
        onClick={handleSchedule}
        className={`w-full py-3 rounded-lg text-white font-semibold shadow transition ${selectedSlotTime ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
      >
        {submitting ? 'Scheduling…' : 'Schedule'}
      </button>
    </div>
  );
}
