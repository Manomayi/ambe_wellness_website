"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import { httpsCallable } from "firebase/functions";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db, functions } from "@/lib/firebase/config";
import moment from "moment-timezone";

export default function RescheduleConsultationModal({
  appointment,
  doctorUid,
  onClose,
  onSuccess
}) {
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [doctorTimezone, setDoctorTimezone] = useState("America/New_York");
  const [localTimezone, setLocalTimezone] = useState("America/New_York");

  // Stable timestamp for current appointment
  const apptTimeMillis = useMemo(() => {
    if (!appointment?.time) return 0;
    if (appointment.time.toDate) return appointment.time.toDate().getTime();
    const parsed = new Date(appointment.time).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }, [appointment?.time]);

  // Initial date calculation (memoized so it does not recreate on every render)
  const initialDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (apptTimeMillis > 0) {
      const apptD = new Date(apptTimeMillis);
      apptD.setHours(0, 0, 0, 0);
      if (apptD >= today) return apptD;
    }
    return today;
  }, [apptTimeMillis]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Detect local timezone once
  useEffect(() => {
    try {
      let detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected === 'Asia/Calcutta' || detected === 'Calcutta') {
        detected = 'Asia/Kolkata';
      }
      if (detected) setLocalTimezone(detected);
    } catch (_) {}
  }, []);

  // Fetch Doctor Schedule & Timezone
  useEffect(() => {
    let isMounted = true;
    async function loadDoctorData() {
      if (!doctorUid) return;
      try {
        const docRef = doc(db, "doctors", doctorUid);
        const snap = await getDoc(docRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          if (data.schedule) setDoctorSchedule(data.schedule);
          if (data.timezone) setDoctorTimezone(data.timezone);
        }
      } catch (err) {
        console.error("Error loading doctor schedule:", err);
      } finally {
        if (isMounted) setLoadingSchedule(false);
      }
    }
    loadDoctorData();
    return () => {
      isMounted = false;
    };
  }, [doctorUid]);

  // Stable string representing the selected day: e.g. "2026-09-07"
  const selectedDateStr = useMemo(() => {
    return moment(selectedDate).format("YYYY-MM-DD");
  }, [selectedDate]);

  // Load booked slots and calculate available slots for selectedDate
  const fetchAndComputeSlots = useCallback(async () => {
    if (!doctorUid || !doctorSchedule || !selectedDateStr) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    try {
      // 1. Query booked slots for the chosen day
      const startOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0, 0, 0
      );
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const apptsQuery = query(
        collection(db, "doctors", doctorUid, "appointments_upcoming"),
        where("time", ">=", Timestamp.fromDate(startOfDay)),
        where("time", "<", Timestamp.fromDate(endOfDay))
      );

      const snapshot = await getDocs(apptsQuery);
      const booked = [];
      snapshot.docs.forEach((d) => {
        if (d.id === appointment?.id) return; // Allow re-selecting current slot if needed
        const t = d.data().time;
        if (t?.toDate) {
          booked.push(t.toDate());
        } else if (t) {
          booked.push(new Date(t));
        }
      });

      // 2. Generate slots according to doctor's schedule for this weekday
      const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const daySchedule = doctorSchedule[dayName];
      const isAvailableDay = daySchedule?.is_available === true || daySchedule?.isAvailable === true;

      if (!daySchedule || !isAvailableDay) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      const startTimeData = daySchedule.start_time || daySchedule.startTime;
      const endTimeData = daySchedule.end_time || daySchedule.endTime;
      if (!startTimeData || !endTimeData) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      const startHour = typeof startTimeData === "object"
        ? (startTimeData.hour ?? 9)
        : parseInt(String(startTimeData).split(":")[0], 10);
      const startMinute = typeof startTimeData === "object"
        ? (startTimeData.minute ?? 0)
        : parseInt(String(startTimeData).split(":")[1] || 0, 10);

      const endHour = typeof endTimeData === "object"
        ? (endTimeData.hour ?? 17)
        : parseInt(String(endTimeData).split(":")[0], 10);
      const endMinute = typeof endTimeData === "object"
        ? (endTimeData.minute ?? 0)
        : parseInt(String(endTimeData).split(":")[1] || 0, 10);

      const doctorStartTime = moment.tz(
        `${selectedDateStr} ${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
        "YYYY-MM-DD HH:mm",
        doctorTimezone
      );
      const doctorEndTime = moment.tz(
        `${selectedDateStr} ${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`,
        "YYYY-MM-DD HH:mm",
        doctorTimezone
      );

      const nowLocal = moment.tz(localTimezone);
      const nowLocalCompare = nowLocal.clone().second(0).millisecond(0);
      const minLeadTime = nowLocalCompare.clone().add(5, "minutes");
      const startLocal = doctorStartTime.clone().tz(localTimezone);
      const endLocal = doctorEndTime.clone().tz(localTimezone);

      // Snap starting minute to clean 30-minute marks (:00 or :30)
      const rawMinute = startLocal.minute();
      const alignedMinute = rawMinute < 30 ? 0 : 30;
      let currentCursor = startLocal.clone().minute(alignedMinute).second(0).millisecond(0);
      const slots = [];

      while (currentCursor.isBefore(endLocal)) {
        const isPast = currentCursor.isSameOrBefore(minLeadTime);
        const slotTimeDate = currentCursor.toDate();
        const currentDoctorTime = currentCursor.clone().tz(doctorTimezone);

        const isBooked = booked.some(
          (b) => Math.abs(b.getTime() - slotTimeDate.getTime()) < 60000
        );

        const isCurrentSlot =
          apptTimeMillis > 0 && Math.abs(apptTimeMillis - slotTimeDate.getTime()) < 60000;

        if (!isPast && !isBooked) {
          slots.push({
            time: slotTimeDate,
            doctorTime: currentDoctorTime.toDate(),
            display: currentCursor.format("h:mm A"),
            doctorDisplay: currentDoctorTime.format("h:mm A"),
            isCurrentSlot,
          });
        }

        currentCursor.add(30, "minutes");
      }

      setAvailableSlots(slots);
    } catch (err) {
      console.error("Error generating slots:", err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [
    doctorUid,
    doctorSchedule,
    selectedDateStr,
    selectedDate,
    appointment?.id,
    doctorTimezone,
    localTimezone,
    apptTimeMillis
  ]);

  useEffect(() => {
    if (doctorSchedule) {
      fetchAndComputeSlots();
    }
  }, [doctorSchedule, selectedDateStr, fetchAndComputeSlots]);

  // Calendar days calculation for current month view
  const calendarDays = useMemo(() => {
    const days = [];
    const yr = currentMonth.getFullYear();
    const mo = currentMonth.getMonth();
    const firstDayIndex = new Date(yr, mo, 1).getDay();
    const totalDaysInMonth = new Date(yr, mo + 1, 0).getDate();

    // Previous month trailing days
    const prevMonthTotalDays = new Date(yr, mo, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(yr, mo - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({
        date: new Date(yr, mo, d),
        isCurrentMonth: true,
      });
    }

    // Next month leading days
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(yr, mo + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    setSelectedSlot(null);
    setErrorMessage(null);
  };

  const formatCurrentAppointmentTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const handleRescheduleConfirm = async () => {
    if (!selectedSlot) return;

    if (apptTimeMillis > 0 && (Date.now() - apptTimeMillis) > 60 * 60 * 1000) {
      setErrorMessage("This appointment time has already passed and can no longer be rescheduled.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const finalReason = "Doctor requested change";
    const newUtcTime = selectedSlot.time;

    try {
      // 1. Try Cloud Function
      let fnSuccess = false;
      try {
        const rescheduleFn = httpsCallable(functions, "rescheduleAppointmentByDoctor");
        await rescheduleFn({
          appointmentId: appointment.id,
          newAppointmentTime: newUtcTime.getTime(),
          reason: finalReason,
        });
        fnSuccess = true;
      } catch (fnErr) {
        console.warn("Cloud function rescheduleAppointmentByDoctor failed or unauthenticated, trying fallback:", fnErr);
      }

      // 2. Fallback to direct Firestore operations if callable didn't succeed
      if (!fnSuccess) {
        const targetUserId = appointment.user_id || appointment.userId;
        if (!targetUserId) {
          throw new Error("Appointment data is missing user ID.");
        }

        const newTimestamp = Timestamp.fromDate(newUtcTime);

        // Check conflicts in doctor upcoming appointments
        const conflictQuery = query(
          collection(db, "doctors", doctorUid, "appointments_upcoming"),
          where("time", "==", newTimestamp)
        );
        const conflictSnap = await getDocs(conflictQuery);
        if (conflictSnap.docs.some((docSnap) => docSnap.id !== appointment.id)) {
          throw new Error("This time slot is already booked.");
        }

        const doctorApptRef = doc(
          db,
          "doctors",
          doctorUid,
          "appointments_upcoming",
          appointment.id
        );
        const userApptRef = doc(
          db,
          "users",
          targetUserId,
          "appointments_upcoming",
          appointment.id
        );
        const userNotifRef = doc(
          collection(db, "users", targetUserId, "notifications")
        );

        const updatePayload = {
          time: newTimestamp,
          rescheduled_at: serverTimestamp(),
          rescheduled_by: "doctor",
          reschedule_reason: finalReason,
          reschedule_notification_sent: false,
        };

        const batch = writeBatch(db);
        batch.set(doctorApptRef, updatePayload, { merge: true });
        batch.set(userApptRef, updatePayload, { merge: true });
        batch.set(userNotifRef, {
          title: "Appointment Rescheduled by Practitioner",
          body: `Dr. ${appointment.doctor_name || "your doctor"} has rescheduled your appointment to ${moment(newUtcTime).format("MMM D, h:mm A")}.${finalReason ? " Reason: " + finalReason : ""}`,
          type: "appointment_rescheduled",
          is_read: false,
          created_at: serverTimestamp(),
        });
        await batch.commit();
      }

      if (onSuccess) {
        onSuccess("Consultation rescheduled successfully.");
      }
      onClose();
    } catch (err) {
      console.error("Reschedule error:", err);
      setErrorMessage(err.message || "Failed to reschedule consultation. Please try again.");
      setIsSubmitting(false);
    }
  };

  const todayMidnight = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-3 sm:p-4 pb-20 sm:pb-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1E1E1E] rounded-2xl shadow-2xl w-full max-w-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh] sm:max-h-[90vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#1E1E1E]/95 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">Reschedule Consultation</h3>
            <p className="text-xs text-white/60">Select a new date and time for the client</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-50 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 min-h-0">
          {/* Client & Current Schedule Info */}
          <div className="bg-[#2D2D30]/60 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FFD3AC] flex items-center justify-center text-[#1E1E1E] font-bold text-sm shadow-sm">
                {(appointment.user_name || "C").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm text-white">
                  {appointment.user_name || "Client"}
                </p>
                <p className="text-xs text-white/60 flex items-center mt-0.5">
                  <ClockIcon className="w-3.5 h-3.5 mr-1 text-[#FFD3AC]" />
                  Current: {formatCurrentAppointmentTime(appointment.time)}
                </p>
              </div>
            </div>
            <span className="text-xs bg-[#FFD3AC]/20 text-[#FFD3AC] border border-[#FFD3AC]/40 px-2.5 py-1 rounded-full font-medium w-fit">
              Rescheduling
            </span>
          </div>

          {loadingSchedule ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD3AC]" />
              <p className="text-xs text-white/60">Loading availability schedule...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar Column */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-[#FFD3AC]" />
                    Select Date
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-white min-w-[100px] text-center">
                      {currentMonth.toLocaleString("default", { month: "short", year: "numeric" })}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#2D2D30]/60 border border-white/10 rounded-xl p-3">
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-white/50 mb-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <div key={day} className="py-0.5">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((item, index) => {
                      const itemDate = item.date;
                      const dayName = itemDate
                        .toLocaleDateString("en-US", { weekday: "long" })
                        .toLowerCase();
                      const daySchedule = doctorSchedule?.[dayName];
                      const isWorkingDay = daySchedule?.is_available === true || daySchedule?.isAvailable === true;

                      const isPast = itemDate < todayMidnight;
                      const isSelected = selectedDate && selectedDate.toDateString() === itemDate.toDateString();
                      const isSelectable = item.isCurrentMonth && !isPast && isWorkingDay;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => isSelectable && handleDateClick(itemDate)}
                          disabled={!isSelectable}
                          className={`h-8 rounded-lg flex flex-col items-center justify-center text-xs transition relative ${
                            isSelected
                              ? "bg-[#FFD3AC] text-[#1E1E1E] font-bold shadow-md"
                              : isSelectable
                              ? "bg-[#1E1E1E] text-white hover:bg-[#FFD3AC]/20 hover:border-[#FFD3AC]/50 cursor-pointer border border-white/10"
                              : !item.isCurrentMonth
                              ? "text-white/20 bg-transparent cursor-not-allowed"
                              : "text-white/30 bg-white/[0.02] cursor-not-allowed"
                          }`}
                        >
                          <span>{itemDate.getDate()}</span>
                          {isSelectable && !isSelected && (
                            <span className="w-1 h-1 rounded-full bg-[#FFD3AC] -mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-white/50 mt-2 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3 text-[#FFD3AC]" />
                  Times shown in {localTimezone}
                </p>
              </div>

              {/* Time Slots Column */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-[#FFD3AC]" />
                  Available Slots ({selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                </h4>

                {loadingSlots ? (
                  <div className="bg-[#2D2D30]/60 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center space-y-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-[#FFD3AC]" />
                    <p className="text-[11px] text-white/60">Checking open slots...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="bg-[#2D2D30]/60 border border-white/10 rounded-xl p-8 text-center space-y-2">
                    <ExclamationCircleIcon className="w-8 h-8 text-white/40 mx-auto" />
                    <p className="text-xs font-semibold text-white">No Slots Available</p>
                    <p className="text-[11px] text-white/60">
                      There are no open slots on this date according to your availability schedule.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {availableSlots.map((slot, index) => {
                      const isSelected = selectedSlot?.time?.getTime() === slot.time.getTime();
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? "bg-[#FFD3AC] text-[#1E1E1E] border-[#FFD3AC] shadow-md ring-2 ring-[#FFD3AC] font-semibold"
                              : slot.isCurrentSlot
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                              : "bg-[#2D2D30] text-white border-white/10 hover:border-[#FFD3AC]/50 hover:bg-[#FFD3AC]/15"
                          }`}
                        >
                          <span>{slot.display}</span>
                          {slot.isCurrentSlot && (
                            <span className="text-[9px] text-amber-300/80 font-normal">
                              (Current Slot)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Slot Summary */}
          {selectedSlot && (
            <div className="bg-[#FFD3AC]/15 border border-[#FFD3AC]/40 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-white">
                New slot: <strong className="text-[#FFD3AC]">{moment(selectedSlot.time).format("dddd, MMM D, YYYY [at] h:mm A")}</strong>
              </span>
              <span className="text-[#FFD3AC] font-bold">Selected</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="text-xs text-red-300 bg-red-500/15 border border-red-500/30 p-3 rounded-xl">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-white/10 bg-[#1E1E1E]/95 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition rounded-xl cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRescheduleConfirm}
            disabled={isSubmitting || !selectedSlot}
            className="px-5 py-2 text-sm font-semibold text-[#1E1E1E] bg-[#FFD3AC] hover:bg-[#ffe3c9] rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1E1E1E] border-t-transparent" />
                Rescheduling...
              </>
            ) : (
              "Confirm Reschedule"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
