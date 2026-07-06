"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/navigation/Navigation";

const MODALITIES = [
  {
    flip: false,
    image: "https://picsum.photos/seed/energy/800/600",
    tagline: ["Cellular energy,", "at the source."],
    number: "01",
    title: "Mitochondrial Energy Optimization",
    focus: "Mitochondrial Health",
    desc: "This technology uses targeted light-based energy delivery to stimulate mitochondrial ATP production at the cellular level — the same biological mechanism that governs how effectively your body converts nutrients into usable energy. Originally developed for use in environments where cellular recovery must occur without conventional intervention.",
    badgeLead: "Research origin:",
    badgeBody:
      "Developed with NASA-backed research on cellular regeneration in low-resource environments. Mechanism is independently replicated across multiple peer-reviewed publications.",
  },
  {
    flip: true,
    image: "https://picsum.photos/seed/cardio/800/600",
    tagline: ["Circulation,", "restored."],
    number: "02",
    title: "Cardiovascular Recovery & Circulation",
    focus: "Cardiovascular Recovery",
    desc: "A non-invasive technology that works with the body's own circulatory rhythms to enhance microvascular blood flow, support cardiac coherence, and accelerate recovery from physical or metabolic stress. Used across professional sports recovery, cardiac rehabilitation programs, and preventive longevity protocols worldwide.",
    badgeLead: "Clinical adoption:",
    badgeBody:
      "Trusted by more than 3,800 clinical partners globally across cardiology, sports medicine, and rehabilitation settings.",
  },
  {
    flip: false,
    image: "https://picsum.photos/seed/botanical/800/600",
    tagline: ["Renewal,", "at the cellular level."],
    number: "03",
    title: "Cellular Regeneration & Tissue Support",
    focus: "Cellular Regeneration",
    desc: "Targets the body's innate cellular repair processes by delivering specific frequency signals that support tissue integrity, reduce systemic inflammation markers, and accelerate the cellular renewal cycle. Increasingly used in integrative oncology support, post-surgical recovery, and chronic inflammatory conditions.",
    badgeLead: "Evidence base:",
    badgeBody:
      "Supported by more than 200 peer-reviewed studies examining cellular signaling, tissue repair, and systemic inflammatory response.",
  },
  {
    flip: true,
    image: "https://picsum.photos/seed/mind/800/600",
    tagline: ["A resilient mind,", "by design."],
    number: "04",
    title: "Neurological Resilience & Cognitive Recovery",
    focus: "Neurological Resilience",
    desc: "Addresses the intersection of nervous system regulation and cognitive performance — supporting the body's ability to recover from chronic stress load, optimize sleep architecture, and maintain neurological function under sustained pressure. Documented applications in burnout recovery, anxiety regulation, and cognitive aging support.",
    badgeLead: "Application domains:",
    badgeBody:
      "Studied in occupational health, neurological rehabilitation, and stress-related cognitive decline across clinical and research settings.",
  },
  {
    flip: false,
    image: "https://picsum.photos/seed/nature/800/600",
    tagline: ["Clear what no", "longer serves you."],
    number: "05",
    title: "Systemic Detoxification & Lymphatic Flow",
    focus: "Cellular Regeneration",
    desc: "Supports the body's own detoxification pathways — the lymphatic system, hepatic clearance, and cellular waste removal — through non-invasive stimulation protocols. This addresses a frequently overlooked dimension of systemic health: the efficiency with which the body removes what it no longer needs, directly impacting energy, immunity, and inflammatory load.",
    badgeLead: "Integrative role:",
    badgeBody:
      "Functions as the systemic foundation for all other modalities — detoxification efficiency directly affects how well the body responds to cellular and cardiovascular protocols.",
  },
];

const COLLECTIVE = [
  {
    icon: "⚡",
    title: "Mitochondrial Health",
    desc: "Cellular energy production at the source — the foundation of every other health outcome.",
  },
  {
    icon: "♡",
    title: "Cardiovascular Recovery",
    desc: "Circulation, cardiac coherence, and physical resilience across the body's delivery systems.",
  },
  {
    icon: "✦",
    title: "Cellular Regeneration",
    desc: "Tissue repair, inflammatory regulation, and the body's fundamental renewal cycle.",
  },
  {
    icon: "☉",
    title: "Neurological Resilience",
    desc: "Stress recovery, cognitive performance, and nervous system regulation under pressure.",
  },
];

function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="aht-cta-success">
        <div className="aht-mod-badge-icon" style={{ fontSize: 24, marginBottom: 12 }}>
          ✦
        </div>
        <h3>Thank you — your inquiry has been received.</h3>
        <p className="aht-cta-note">We respond to all inquiries within 2 business days.</p>
      </div>
    );
  }

  return (
    <form className="aht-cta-form" onSubmit={handleSubmit}>
      <div className="aht-cta-field">
        <label htmlFor="firstName">First Name</label>
        <input id="firstName" name="firstName" type="text" placeholder="First name" required />
      </div>
      <div className="aht-cta-field">
        <label htmlFor="lastName">Last Name</label>
        <input id="lastName" name="lastName" type="text" placeholder="Last name" required />
      </div>
      <div className="aht-cta-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="your@email.com" required />
      </div>
      <div className="aht-cta-field">
        <label htmlFor="organization">Organization</label>
        <input id="organization" name="organization" type="text" placeholder="Company or institution" />
      </div>
      <div className="aht-cta-field full">
        <label htmlFor="inquiryType">Inquiry Type</label>
        <select id="inquiryType" name="inquiryType" defaultValue="" required>
          <option value="" disabled>
            Select one
          </option>
          <option>Request Information</option>
          <option>Clinical Partnership</option>
          <option>Enterprise Integration</option>
          <option>Research Collaboration</option>
          <option>Other</option>
        </select>
      </div>
      <div className="aht-cta-field full">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          placeholder="Tell us about your organization and what you're looking for…"
        />
      </div>
      <div className="aht-cta-submit">
        <button
          type="submit"
          className="aht-btn aht-btn-dark"
          style={{ background: "var(--near-black)", color: "#fff", padding: "18px 48px" }}
        >
          Submit Inquiry
        </button>
        <p className="aht-cta-note">We respond to all inquiries within 2 business days.</p>
      </div>
    </form>
  );
}

export default function AmbeHealthTechnologyContent() {
  return (
    <div className="aht-page">
      <section className="aht-hero">
        <video
          className="aht-hero-video"
          src="/videos/hero_background.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="aht-hero-overlay" />

        <Navigation />

        <div className="aht-wrap aht-hero-body">
          <div className="aht-hero-inner">
            <div className="aht-eyebrow">Health Technology</div>
            <h1>
              <span className="aht-hero-highlight">
                The science of feeling well
              </span>{" "}
              <span className="aht-hero-accent">
                has never been more advanced.
              </span>
            </h1>
            <p className="aht-hero-sub">
              Five clinically validated technologies — integrated into one
              doctor-guided protocol that makes ancient wisdom measurable.
            </p>
            <div className="aht-hero-cta-row">
              <Link href="#modalities" className="aht-btn aht-btn-peach">
                Explore Modalities
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="aht-hero-stats">
        <div className="aht-wrap">
          <div className="aht-hero-stats-grid">
            <div className="aht-hero-stat">
              <span className="aht-hero-stat-num">NASA</span>
            </div>
            <div className="aht-hero-stat">
              <span className="aht-hero-stat-num">3,800+</span>
            </div>
            <div className="aht-hero-stat">
              <span className="aht-hero-stat-num">200+</span>
            </div>
          </div>
        </div>
      </div>

      <div className="aht-intro-band">
        <div className="aht-wrap">
          <p>
            These are not supplements, apps, or generic wellness programs. These are{" "}
            <em>systemic health technologies</em> — each with a documented clinical mechanism,
            independently studied, and brought together under doctor-supervised integrative
            protocols designed for real health outcomes.
          </p>
        </div>
      </div>

      <section id="modalities">
        <div className="aht-wrap">
          <div className="aht-modalities-header">
            <div className="aht-eyebrow">Five Modalities</div>
            <h2>The technologies behind the results</h2>
            <p>
              Each modality addresses a distinct physiological domain. Together they form a
              coherent, clinically grounded protocol.
            </p>
          </div>

          {MODALITIES.map((m) => (
            <div key={m.number} className={`aht-modality-card${m.flip ? " flip" : ""}`}>
              <div
                className="aht-mod-visual"
                style={{ backgroundImage: `url('${m.image}')` }}
              >
                <div className="aht-mod-icon">
                  {m.tagline[0]}
                  <br />
                  {m.tagline[1]}
                </div>
              </div>
              <div className="aht-mod-content">
                <div className="aht-mod-num">Modality {m.number}</div>
                <h3 className="aht-mod-title">{m.title}</h3>
                <span className="aht-mod-focus">{m.focus}</span>
                <p className="aht-mod-desc">{m.desc}</p>
                <div className="aht-mod-badge">
                  <span className="aht-mod-badge-icon">✦</span>
                  <span className="aht-mod-badge-text">
                    <b>{m.badgeLead}</b> {m.badgeBody}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="aht-collectively">
        <div className="aht-wrap">
          <div className="aht-eyebrow">Collectively</div>
          <h2>
            Next-generation technology, <em>guided by ancient intelligence.</em>
          </h2>
          <p className="aht-collectively-sub">
            No single modality works in isolation. Together, these five form a coherent systemic
            protocol — each one amplifying the others under the guidance of a doctor trained in
            both modern science and Ayurvedic medicine.
          </p>
          <div className="aht-collectively-grid">
            {COLLECTIVE.map((c) => (
              <div key={c.title} className="aht-coll-card">
                <div className="aht-coll-icon">{c.icon}</div>
                <div className="aht-coll-title">{c.title}</div>
                <p className="aht-coll-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="aht-cta-section" id="inquiry">
        <div className="aht-cta-inner">
          <div className="aht-eyebrow">Work With Us</div>
          <h2>Request Information or Partnership Inquiry</h2>
          <p>
            Whether you are exploring enterprise integration, clinical partnership, or a demo for
            your organization — we would like to hear from you. All inquiries are reviewed
            personally.
          </p>
          <InquiryForm />
        </div>
      </section>

      <div className="aht-footer-strip">
        <div className="aht-wrap">
          <p>
            The health technologies described on this page are presented for educational and
            informational purposes. Clinical claims referenced reflect published research on the
            technology category and do not constitute a medical claim by Ambé Wellness. These
            modalities are integrated into Ambé&apos;s doctor-supervised wellness protocols and are
            not intended to diagnose, treat, cure, or prevent any disease. Individual outcomes
            vary.
          </p>
        </div>
      </div>
    </div>
  );
}
