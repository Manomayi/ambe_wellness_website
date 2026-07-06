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
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${doctor.name} profile`}
        className="relative w-full max-w-lg bg-white rounded-lg p-8 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-2xl leading-none cursor-pointer hover:opacity-70"
          style={{ color: "#353535" }}
        >
          ×
        </button>

        {/* Avatar */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
          <Image src={doctor.image} alt={doctor.name} fill className="object-cover" />
        </div>

        <div
          className="font-heading text-2xl font-medium mb-1"
          style={{ color: "#353535" }}
        >
          {doctor.name}
        </div>
        <div
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: "#C8996A" }}
        >
          BAMS · Integrative Doctor
        </div>

        <p className="text-sm leading-relaxed mb-2" style={{ color: "#535353" }}>
          MBBS · BAMS · Doctor of Ayurvedic Medicine and Surgery
        </p>
        <p className="text-sm font-medium" style={{ color: "#353535" }}>
          {doctor.specialty}
        </p>

        {doctor.isMedicalDirector && (
          <div className="mt-3">
            <MedicalDirectorBadge />
          </div>
        )}

        {/* Fine print — identical for every practitioner */}
        <DoctorProfileFinePrint className="mt-6" />
      </div>
    </div>,
    document.body
  );
}
