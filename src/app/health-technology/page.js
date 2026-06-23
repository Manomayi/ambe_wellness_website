import React from "react";
import Link from "next/link";
import Image from "next/image";
import InquiryForm from "@/components/health-tech/InquiryForm";

export const metadata = {
  title: "Health Technology — Ambé Wellness",
  description:
    "Ambé integrates five clinically validated health technologies into a single, doctor-guided wellness protocol — making ancient wisdom measurable.",
};

const ACCENT = "#C8996A";
const SERIF = "'Cormorant Garamond', serif";

const STATS = [
  { value: "NASA", label: "Agency-backed research" },
  { value: "3,800+", label: "Global clinical partners" },
  { value: "200+", label: "Peer-reviewed studies" },
  { value: "5", label: "Integrated modalities" },
];

const MODALITIES = [
  {
    number: "01",
    tagline: ["Cellular energy,", "at the source."],
    title: "Mitochondrial Energy Optimization",
    label: "Mitochondrial Health",
    body: "This technology uses targeted light-based energy delivery to stimulate mitochondrial ATP production at the cellular level — the same biological mechanism that governs how effectively your body converts nutrients into usable energy. Originally developed for use in environments where cellular recovery must occur without conventional intervention.",
    calloutLead: "Research origin:",
    calloutBody:
      "Developed with NASA-backed research on cellular regeneration in low-resource environments. Mechanism is independently replicated across multiple peer-reviewed publications.",
  },
  {
    number: "02",
    tagline: ["Circulation,", "restored."],
    title: "Cardiovascular Recovery & Circulation",
    label: "Cardiovascular Recovery",
    body: "A non-invasive technology that works with the body's own circulatory rhythms to enhance microvascular blood flow, support cardiac coherence, and accelerate recovery from physical or metabolic stress. Used across professional sports recovery, cardiac rehabilitation programs, and preventive longevity protocols worldwide.",
    calloutLead: "Clinical adoption:",
    calloutBody:
      "Trusted by more than 3,800 clinical partners globally across cardiology, sports medicine, and rehabilitation settings.",
  },
  {
    number: "03",
    tagline: ["Renewal,", "at the cellular level."],
    title: "Cellular Regeneration & Tissue Support",
    label: "Cellular Regeneration",
    body: "Targets the body's innate cellular repair processes by delivering specific frequency signals that support tissue integrity, reduce systemic inflammation markers, and accelerate the cellular renewal cycle. Increasingly used in integrative oncology support, post-surgical recovery, and chronic inflammatory conditions.",
    calloutLead: "Evidence base:",
    calloutBody:
      "Supported by more than 200 peer-reviewed studies examining cellular signaling, tissue repair, and systemic inflammatory response.",
  },
  {
    number: "04",
    tagline: ["A resilient mind,", "by design."],
    title: "Neurological Resilience & Cognitive Recovery",
    label: "Neurological Resilience",
    body: "Addresses the intersection of nervous system regulation and cognitive performance — supporting the body's ability to recover from chronic stress load, optimize sleep architecture, and maintain neurological function under sustained pressure. Documented applications in burnout recovery, anxiety regulation, and cognitive aging support.",
    calloutLead: "Application domains:",
    calloutBody:
      "Studied in occupational health, neurological rehabilitation, and stress-related cognitive decline across clinical and research settings.",
  },
  {
    number: "05",
    tagline: ["Clear what no", "longer serves you."],
    title: "Systemic Detoxification & Lymphatic Flow",
    label: "Systemic Detoxification",
    body: "Supports the body's own detoxification pathways — the lymphatic system, hepatic clearance, and cellular waste removal — through non-invasive stimulation protocols. This addresses a frequently overlooked dimension of systemic health: the efficiency with which the body removes what it no longer needs, directly impacting energy, immunity, and inflammatory load.",
    calloutLead: "Integrative role:",
    calloutBody:
      "Functions as the systemic foundation for all other modalities — detoxification efficiency directly affects how well the body responds to cellular and cardiovascular protocols.",
  },
];

const SUMMARY = [
  {
    name: "Mitochondrial Health",
    text: "Cellular energy production at the source — the foundation of every other health outcome.",
  },
  {
    name: "Cardiovascular Recovery",
    text: "Circulation, cardiac coherence, and physical resilience across the body's delivery systems.",
  },
  {
    name: "Cellular Regeneration",
    text: "Tissue repair, inflammatory regulation, and the body's fundamental renewal cycle.",
  },
  {
    name: "Neurological Resilience",
    text: "Stress recovery, cognitive performance, and nervous system regulation under pressure.",
  },
  {
    name: "Systemic Detoxification",
    text: "Lymphatic flow, hepatic clearance, and the body's capacity to clear what no longer serves it.",
  },
];

function Kicker({ children, center }) {
  return (
    <div
      className={`text-xs sm:text-sm font-medium tracking-[0.25em] uppercase mb-4 ${center ? "text-center" : ""}`}
      style={{ color: ACCENT }}
    >
      {children}
    </div>
  );
}

export default function HealthTechnologyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header — logo + back link */}
      <header className="w-full bg-white border-b" style={{ borderColor: "#ECE7DE" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/images/logos/ambe_logo.png"
              alt="AMBE"
              width={110}
              height={36}
              className="w-[90px] sm:w-[110px] h-auto"
              priority
            />
          </Link>
          <Link href="/" className="text-sm flex items-center gap-2" style={{ color: "#6B6B6B" }}>
            <span aria-hidden>←</span> Back to Ambé Wellness
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-12">
        <Kicker>Next-Generation Systemic Health Technology</Kicker>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl leading-tight mb-6 max-w-3xl"
          style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 500 }}
        >
          The science that makes ancient wisdom measurable.
        </h1>
        <p className="text-base sm:text-lg max-w-2xl mb-10 leading-relaxed" style={{ color: "#6B6B6B" }}>
          Ambé integrates five clinically validated health technologies into a
          single, doctor-guided wellness protocol — extending what Ayurvedic
          medicine has always known into the language of modern science.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 max-w-3xl">
          {STATS.map((s) => (
            <div key={s.label}>
              <div
                className="text-3xl sm:text-4xl mb-1"
                style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 600 }}
              >
                {s.value}
              </div>
              <div className="text-xs sm:text-sm leading-snug" style={{ color: "#9A948B" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="#work-with-us"
            className="inline-block text-center px-8 py-3 rounded-full text-xs sm:text-sm font-medium tracking-[0.18em] uppercase transition-all duration-200 bg-[#FFD3AC] text-[#2E2E2E] hover:bg-[#2E2E2E] hover:text-white"
          >
            Request Information
          </Link>
          <Link
            href="#work-with-us"
            className="inline-block text-center px-8 py-3 rounded-full text-xs sm:text-sm font-medium tracking-[0.18em] uppercase transition-all duration-200 border border-[#2E2E2E] text-[#2E2E2E] hover:bg-[#2E2E2E] hover:text-white"
          >
            Partnership Inquiry
          </Link>
        </div>
      </section>

      {/* Intro statement */}
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-10 text-center">
        <p className="text-xl sm:text-2xl leading-relaxed" style={{ color: "#6B6B6B" }}>
          These are not supplements, apps, or generic wellness programs. These
          are{" "}
          <span style={{ color: ACCENT, fontStyle: "italic", fontFamily: SERIF }}>
            systemic health technologies
          </span>{" "}
          — each with a documented clinical mechanism, independently studied, and
          brought together under doctor-supervised integrative protocols designed
          for real health outcomes.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="border-t" style={{ borderColor: "#ECE7DE" }} />
      </div>

      {/* Five modalities */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 pt-16 sm:pt-20 pb-8">
        <Kicker center>Five Modalities</Kicker>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl text-center mb-4"
          style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 500 }}
        >
          The technologies behind the results
        </h2>
        <p
          className="text-base text-center max-w-2xl mx-auto mb-14 leading-relaxed"
          style={{ color: "#6B6B6B" }}
        >
          Each modality addresses a distinct physiological domain. Together they
          form a coherent, clinically grounded protocol.
        </p>

        <div className="space-y-8">
          {MODALITIES.map((m) => (
            <article
              key={m.number}
              className="rounded-3xl border p-8 sm:p-12"
              style={{ borderColor: "#ECE7DE" }}
            >
              {/* Tagline — faint serif italic */}
              <div
                className="text-xl sm:text-2xl italic leading-snug mb-8"
                style={{ fontFamily: SERIF, color: "#D8D2C8" }}
              >
                {m.tagline[0]}
                <br />
                {m.tagline[1]}
              </div>

              <div
                className="text-xs font-medium tracking-[0.25em] uppercase mb-4"
                style={{ color: ACCENT }}
              >
                Modality {m.number}
              </div>
              <h3
                className="text-2xl sm:text-3xl md:text-4xl mb-3"
                style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 500 }}
              >
                {m.title}
              </h3>
              <div className="text-sm font-semibold mb-5" style={{ color: "#2E2E2E" }}>
                {m.label}
              </div>
              <p className="text-base leading-relaxed mb-8 max-w-3xl" style={{ color: "#6B6B6B" }}>
                {m.body}
              </p>

              {/* Callout */}
              <div
                className="rounded-2xl border p-5 sm:p-6 flex gap-3 max-w-3xl"
                style={{ borderColor: "#F0E6D8", backgroundColor: "#FBFAF7" }}
              >
                <span className="text-base flex-shrink-0" style={{ color: ACCENT }}>
                  ✦
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>
                  <span className="font-semibold" style={{ color: "#2E2E2E" }}>
                    {m.calloutLead}
                  </span>{" "}
                  {m.calloutBody}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Collectively */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 pt-16 sm:pt-20 pb-8">
        <Kicker center>Collectively</Kicker>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl text-center mb-4 max-w-3xl mx-auto"
          style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 500 }}
        >
          Next-generation technology, guided by ancient intelligence.
        </h2>
        <p
          className="text-base text-center max-w-2xl mx-auto mb-14 leading-relaxed"
          style={{ color: "#6B6B6B" }}
        >
          No single modality works in isolation. Together, these five form a
          coherent systemic protocol — each one amplifying the others under the
          guidance of a doctor trained in both modern science and Ayurvedic
          medicine.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUMMARY.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl border p-6"
              style={{ borderColor: "#ECE7DE" }}
            >
              <div className="text-base mb-2" style={{ color: ACCENT }}>
                ✦
              </div>
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 600 }}
              >
                {s.name}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Work with us — inquiry form */}
      <section id="work-with-us" className="max-w-2xl mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-12 scroll-mt-8">
        <Kicker center>Work With Us</Kicker>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl text-center mb-4"
          style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 500 }}
        >
          Request Information or Partnership Inquiry
        </h2>
        <p
          className="text-base text-center max-w-xl mx-auto mb-12 leading-relaxed"
          style={{ color: "#6B6B6B" }}
        >
          Whether you are exploring enterprise integration, clinical partnership,
          or a demo for your organization — we would like to hear from you. All
          inquiries are reviewed personally.
        </p>

        <InquiryForm />
      </section>

      {/* Footer disclaimer */}
      <footer className="border-t" style={{ borderColor: "#ECE7DE" }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12 text-center">
          <p className="text-xs leading-relaxed" style={{ color: "#A8A29A" }}>
            The health technologies described on this page are presented for
            educational and informational purposes. Clinical claims referenced
            reflect published research on the technology category and do not
            constitute a medical claim by Ambé Wellness. These modalities are
            integrated into Ambé&apos;s doctor-supervised wellness protocols and
            are not intended to diagnose, treat, cure, or prevent any disease.
            Individual outcomes vary.
          </p>
        </div>
      </footer>
    </div>
  );
}
