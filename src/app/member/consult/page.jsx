// src/app/member/consult/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import {
  ChatBubbleLeftEllipsisIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";

export default function MemberConsultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Fetch patient & related data
  const fetchData = async (uid) => {
    const snap = await getDoc(doc(db, "patients", uid));
    const pt = snap.exists() ? snap.data() : {};
    setPatient(pt);

    if (pt.subscription?.active) {
      const drSnap = await getDoc(doc(db, "doctors", pt.doctor.uid));
      setDoctor(drSnap.exists() ? drSnap.data() : null);

      const upSnap = await getDocs(
        query(collection(db, "patients", uid, "appointments_upcoming"))
      );
      setUpcoming(upSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const histSnap = await getDocs(
        query(
          collection(db, "patients", uid, "appointments_history"),
          orderBy("time", "desc")
        )
      );
      setHistory(histSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    setLoading(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return router.push("/login");
      fetchData(user.uid);
    });
    return unsub;
  }, [router]);

  const formatTime = (ts) => {
    const d = ts.toDate ? ts.toDate() : ts;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  const subActive = patient.subscription?.active;
  const firstDone = patient.is_first_consultation_completed;
  const appt = upcoming[0] || null;
  const now =
    appt &&
    (() => {
      const t = appt.time.toDate();
      const n = new Date();
      return n >= t && n <= new Date(t.getTime() + 3600000);
    })();

  return (
    <div className="space-y-12">
      {/* Page Title */}
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Consult</h1>

      {/* Inactive subscription */}
      {!subActive && (
        <div className="bg-white shadow-lg rounded-xl p-8 mb-12 text-center">
          <p className="text-lg text-gray-700 mb-6 text-center">
            You don’t have an active subscription. Complete the questionnaire to
            start.
          </p>
          <button
            onClick={() => router.push("/member/menu/questionnaire")}
            className="inline-flex items-center space-x-2 bg-green-600 border border-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition"
          >
            <span className="uppercase font-bold text-sm">Start Questionnaire</span>
          </button>
        </div>
      )}

      {/* Active subscription */}
      {subActive && (
        <div className="space-y-12">
          {/* My Expert Section */}
          <p className="text-sm uppercase font-semibold text-gray-600 mb-4">
            My Expert
          </p>
          <section className="bg-white shadow-xl rounded-xl p-8">
            {doctor && (
              <div className="flex flex-col md:flex-row items-center">
                <img
                  src={doctor.profile_picture}
                  alt="Expert"
                  className="h-24 w-24 rounded-full shadow-md"
                />
                <div className="mt-4 md:mt-0 md:ml-6 flex-1">
                  <h3 className="text-xl font-medium text-gray-900">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </h3>
                  <p className="text-gray-600 mb-6">General Practitioner</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => {
                        if (firstDone) {
                          const params = new URLSearchParams({
                            expertUid: patient.doctor.uid,
                            expertName: `Dr. ${doctor.first_name} ${doctor.last_name}`,
                            expertPhotoUrl: doctor.profile_picture,
                          });
                          router.push(
                            `/member/consult/message_expert?${params.toString()}`
                          );
                        } else {
                          router.push("/member/menu/questionnaire");
                        }
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 border border-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
                    >
                      <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                      <span>Message</span>
                    </button>
                    <button
                      onClick={() => router.push("/member/consult/schedule")}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 border border-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
                    >
                      <CalendarDaysIcon className="h-5 w-5" />
                      <span>Schedule</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Upcoming / Happening Now */}
          {appt && (
            <>
              <p className="text-sm uppercase font-semibold text-gray-600 mb-4">
                {now ? "Happening Now" : "Upcoming Appointment"}
              </p>
              <section className="bg-white shadow-xl rounded-xl p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Dr. {appt.doctor_name}
                    </h3>
                    <p className="text-gray-600">{formatTime(appt.time)}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (now) {
                        router.push(`/member/consult/join/${appt.id}`);
                      } else {
                        // Open edit modal
                        setSelectedAppt(appt);
                        setModalOpen(true);
                      }
                    }}
                    className="flex items-center space-x-2 bg-green-600 border border-green-600 text-white px-5 py-2 rounded-lg shadow hover:bg-green-700 transition"
                  >
                    <span>{now ? "Join Now" : "Edit"}</span>
                  </button>
                </div>
              </section>
            </>
          )}

          {/* Appointment History */}
          {history.length > 0 && (
            <>
              <p className="text-sm uppercase font-semibold text-gray-600 mb-4">
                History
              </p>
              <section className="space-y-4">
                {history.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white border-l-4 border-green-600 p-4 rounded-lg shadow-sm flex justify-between items-center hover:shadow-md transition"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        Dr. {app.doctor_name}
                      </p>
                      <p className="text-gray-600">{formatTime(app.time)}</p>
                    </div>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams({
                          doctorName: app.doctor_name,
                        });
                        router.push(
                          `/member/consult/report/${app.id}?${params.toString()}`
                        );
                      }}
                      className="flex items-center justify-center bg-green-600 border border-green-600 text-white p-2 rounded-full shadow hover:bg-green-700 transition"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      )}

      {/* --- Modal Dialog --- */}
      {modalOpen && selectedAppt && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">
              {formatTime(selectedAppt.time)}
            </h3>
            <button
              className="w-full py-2 text-left hover:bg-gray-100 rounded"
              onClick={() => {
                setModalOpen(false);
                router.push("/member/consult/schedule");
              }}
            >
              Reschedule
            </button>
            <button
              className="w-full py-2 text-left hover:bg-gray-100 rounded mt-2"
              onClick={() => {
                setModalOpen(false);
                // TODO: call your cancellation logic here
                alert("Consultation cancelled");
              }}
            >
              Cancel Consultation
            </button>
            <button
              className="mt-4 w-full text-center text-gray-500 hover:underline"
              onClick={() => setModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}