"use client";
import React from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import DoctorProfileFinePrint, {
  MedicalDirectorBadge,
} from "@/components/common/DoctorProfileFinePrint";

// View Profile modal for a doctor. The fine-print block is appended at the
// bottom for every practitioner; Dr. Smita Bhatia also shows the MEDICAL
// DIRECTOR badge (doctor.isMedicalDirector).
export default function DoctorProfileModal({ doctor, onClose }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!doctor) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [doctor, onClose]);

  if (!mounted || !doctor) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${doctor.name} profile`}
        className="relative w-full max-w-lg bg-[#1E1E1E] border border-white/15 rounded-[24px] p-6 sm:p-8 my-8 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-2xl leading-none cursor-pointer text-white/60 hover:text-white transition w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
        >
          ×
        </button>

        {/* Avatar */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-[#FFD3AC] bg-neutral-800 flex items-center justify-center shadow-md">
          {doctor.image || doctor.profile_picture ? (
            <img
              src={doctor.image || doctor.profile_picture}
              alt={doctor.name || "Doctor"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[#FFD3AC] font-bold text-3xl">
              {(doctor.name || "Dr.").replace("Dr. ", "").charAt(0) || "👨‍⚕️"}
            </span>
          )}
        </div>

        <div className="font-heading text-2xl sm:text-3xl font-medium mb-1 text-white">
          {doctor.name?.startsWith?.("Dr.") ? doctor.name : `Dr. ${doctor.name || "Practitioner"}`}
        </div>
        <div className="text-xs font-semibold tracking-widest uppercase mb-3 text-[#FFD3AC]">
          {doctor.professional_title
            ? `${doctor.professional_title} · Integrative Doctor`
            : (doctor.title || "BAMS · Integrative Doctor")}
        </div>

        {doctor.specialty && (
          <p className="text-sm font-medium mb-3 text-white/80">
            {doctor.specialty}
          </p>
        )}

        {doctor.bio && (
          <div className="my-3 text-sm leading-relaxed text-gray-300 bg-[#2D2D30]/80 p-4 rounded-2xl border border-white/10">
            {doctor.bio}
          </div>
        )}

        {(doctor.education || doctor.experience || doctor.certifications || doctor.languages) && (
          <div className="my-3 space-y-2 text-xs sm:text-sm text-gray-300 bg-[#2D2D30]/80 p-4 rounded-2xl border border-white/10">
            {doctor.experience && (
              <div className="flex items-start gap-2">
                <span className="text-[#FFD3AC] font-semibold min-w-[85px]">Experience:</span>
                <span className="text-white/90">{doctor.experience}</span>
              </div>
            )}
            {doctor.education && (
              <div className="flex items-start gap-2">
                <span className="text-[#FFD3AC] font-semibold min-w-[85px]">Education:</span>
                <span className="text-white/90">{doctor.education}</span>
              </div>
            )}
            {doctor.certifications && (
              <div className="flex items-start gap-2">
                <span className="text-[#FFD3AC] font-semibold min-w-[85px]">Certifications:</span>
                <span className="text-white/90">{doctor.certifications}</span>
              </div>
            )}
            {doctor.languages && (
              <div className="flex items-start gap-2">
                <span className="text-[#FFD3AC] font-semibold min-w-[85px]">Languages:</span>
                <span className="text-white/90">
                  {Array.isArray(doctor.languages) ? doctor.languages.join(", ") : doctor.languages}
                </span>
              </div>
            )}
          </div>
        )}

        {doctor.isMedicalDirector && (
          <div className="mt-3">
            <MedicalDirectorBadge />
          </div>
        )}

        {/* Fine print — identical for every practitioner, dark mode matching Flutter */}
        <DoctorProfileFinePrint className="mt-6" isDark={true} />
      </div>
    </div>,
    document.body
  );
}
