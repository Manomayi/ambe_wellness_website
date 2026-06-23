"use client";
import React, { useState } from "react";

// "Work With Us" inquiry form. Front-end only for now — on submit it shows a
// confirmation state. Wire `handleSubmit` to a backend endpoint / email service
// (e.g. POST /api/inquiry) when one is available.
const ACCENT = "#C8996A";

const LABEL = "block text-xs font-semibold tracking-[0.12em] uppercase mb-2";
const FIELD =
  "w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-[#C8996A]";

export default function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: POST form data to the inquiry backend / email service.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border p-10 text-center"
        style={{ borderColor: "#ECE7DE", backgroundColor: "#FBFAF7" }}
      >
        <div className="text-2xl mb-3" style={{ color: ACCENT }}>
          ✦
        </div>
        <h3
          className="text-2xl mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2E2E2E", fontWeight: 600 }}
        >
          Thank you — your inquiry has been received.
        </h3>
        <p className="text-sm" style={{ color: "#6B6B6B" }}>
          We respond to all inquiries within 2 business days.
        </p>
      </div>
    );
  }

  const labelStyle = { color: "#2E2E2E" };
  const fieldStyle = { borderColor: "#E2DDD3", color: "#2E2E2E" };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className={LABEL} style={labelStyle}>
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            placeholder="First name"
            className={FIELD}
            style={fieldStyle}
          />
        </div>
        <div>
          <label htmlFor="lastName" className={LABEL} style={labelStyle}>
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            placeholder="Last name"
            className={FIELD}
            style={fieldStyle}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={LABEL} style={labelStyle}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className={FIELD}
          style={fieldStyle}
        />
      </div>

      <div>
        <label htmlFor="organization" className={LABEL} style={labelStyle}>
          Organization
        </label>
        <input
          id="organization"
          name="organization"
          type="text"
          placeholder="Company or institution"
          className={FIELD}
          style={fieldStyle}
        />
      </div>

      <div>
        <label htmlFor="inquiryType" className={LABEL} style={labelStyle}>
          Inquiry Type
        </label>
        <select id="inquiryType" name="inquiryType" required className={FIELD} style={fieldStyle} defaultValue="">
          <option value="" disabled>
            Select one
          </option>
          <option>Enterprise integration</option>
          <option>Clinical partnership</option>
          <option>Demo request</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className={LABEL} style={labelStyle}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Tell us about your organization and what you're looking for…"
          className={FIELD}
          style={fieldStyle}
        />
      </div>

      <div className="text-center pt-2">
        <button
          type="submit"
          className="inline-block px-10 py-3 rounded-full text-xs font-medium tracking-[0.18em] uppercase transition-all duration-200 bg-[#FFD3AC] text-[#2E2E2E] hover:bg-[#2E2E2E] hover:text-white"
        >
          Submit Inquiry
        </button>
        <p className="text-xs mt-5" style={{ color: "#9A948B" }}>
          We respond to all inquiries within 2 business days.
        </p>
      </div>
    </form>
  );
}
