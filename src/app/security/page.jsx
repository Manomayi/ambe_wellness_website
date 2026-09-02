import React from "react";
import Link from "next/link";

import { buildPageMetadata } from "@/lib/metadata";
import {
  CONTROL_DOMAINS,
  GATED_DOCUMENTS,
  LAST_REVIEWED,
  PATIENT_RIGHTS,
  POSTURE,
  PRIVACY_CONTACT,
  ROADMAP,
  SECURITY_CONTACT,
  SUBPROCESSORS,
  SUBPROCESSOR_BAA_LABELS,
  TRUST_STATUS,
} from "@/lib/trust-center";

export const metadata = {
  ...buildPageMetadata({
    title: "Security & Trust | Ambé Wellness",
    description:
      "How Ambé Wellness protects health information: our encryption, access " +
      "controls, subprocessors, and HIPAA compliance roadmap.",
    path: "/security",
  }),
};

/* -------------------------------------------------------------------------- */
/* Status pill                                                                 */
/* -------------------------------------------------------------------------- */

const TONE_CLASSES = {
  live: "bg-emerald-50 text-emerald-800 border-emerald-200",
  progress: "bg-amber-50 text-amber-900 border-amber-200",
  soon: "bg-ambe-cream text-ambe-charcoal/70 border-ambe-gold/30",
  na: "bg-gray-50 text-gray-600 border-gray-200",
};

function StatusPill({ tone, label }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${
        TONE_CLASSES[tone] || TONE_CLASSES.na
      }`}
    >
      {tone === "live" && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden />
      )}
      {tone === "progress" && (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
      )}
      {label}
    </span>
  );
}

function ControlStatus({ status }) {
  const meta = TRUST_STATUS[status] || TRUST_STATUS.soon;
  return <StatusPill tone={meta.tone} label={meta.label} />;
}

/* -------------------------------------------------------------------------- */
/* Section shell                                                               */
/* -------------------------------------------------------------------------- */

function Section({ id, eyebrow, title, intro, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-ambe-gold/20 pt-12">
      {eyebrow && (
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-ambe-gold">
          {eyebrow}
        </p>
      )}
      <h2 className="font-heading !text-3xl sm:!text-4xl !text-ambe-dark">{title}</h2>
      {intro && (
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ambe-charcoal/80">
          {intro}
        </p>
      )}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero ------------------------------------------------------------- */}
      <header className="bg-ambe-dark text-ambe-cream">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:px-8 sm:py-24">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-ambe-gold">
            Trust Center
          </p>
          <h1 className="font-heading !text-4xl sm:!text-5xl !text-ambe-cream leading-tight">
            Security &amp; Trust
          </h1>
          <p className="mt-6 max-w-2xl font-heading !text-2xl sm:!text-[1.75rem] !text-ambe-peach leading-snug">
            {POSTURE.headline}
          </p>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ambe-cream/80">
            {POSTURE.body}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={`mailto:${SECURITY_CONTACT}`}
              className="rounded-full bg-ambe-peach px-8 py-3 text-sm font-medium !text-ambe-charcoal transition-colors hover:bg-ambe-cream"
            >
              Contact our security team
            </a>
            <a
              href="#roadmap"
              className="rounded-full border border-ambe-cream/30 px-8 py-3 text-sm font-medium text-ambe-cream transition-colors hover:border-ambe-gold hover:text-ambe-gold"
            >
              See the roadmap
            </a>
          </div>

          <p className="mt-8 text-xs text-ambe-cream/50">
            Last reviewed {LAST_REVIEWED}
          </p>
        </div>
      </header>

      {/* Legend ------------------------------------------------------------ */}
      <div className="border-b border-ambe-gold/20 bg-ambe-cream/50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5 sm:px-8">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ambe-charcoal/60">
            How to read this page
          </span>
          <span className="flex items-center gap-2 text-[13px] text-ambe-charcoal/80">
            <StatusPill tone="live" label="Live" /> In place today
          </span>
          <span className="flex items-center gap-2 text-[13px] text-ambe-charcoal/80">
            <StatusPill tone="progress" label="In Progress" /> Being built now
          </span>
          <span className="flex items-center gap-2 text-[13px] text-ambe-charcoal/80">
            <StatusPill tone="soon" label="Coming Soon" /> Planned, not yet started
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-16 sm:px-8">
        {/* Honest disclosure ---------------------------------------------- */}
        <div className="rounded-2xl border border-ambe-gold/30 bg-ambe-cream/40 p-6 sm:p-8">
          <h2 className="font-heading !text-2xl !text-ambe-dark">
            A note on where we are
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ambe-charcoal/85">
            HIPAA has no government certification — no agency issues a badge that
            says a company is &ldquo;HIPAA certified.&rdquo; What it requires is a
            documented, continuously maintained program of safeguards. We are
            building that program now, and we are not finished. Until every item
            below reads <em>Live</em>, we will not describe Ambé Wellness as HIPAA
            compliant, and neither should anyone on our behalf.
          </p>
        </div>

        {/* Control domains -------------------------------------------------- */}
        {CONTROL_DOMAINS.map((domain) => (
          <Section
            key={domain.id}
            id={domain.id}
            eyebrow="Safeguards"
            title={domain.title}
            intro={domain.summary}
          >
            <ul className="divide-y divide-ambe-gold/15 border-y border-ambe-gold/15">
              {domain.controls.map((control) => (
                <li
                  key={control.name}
                  className="flex flex-col gap-2 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
                >
                  <div className="sm:max-w-2xl">
                    <p className="text-[15px] font-medium text-ambe-dark">
                      {control.name}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ambe-charcoal/75">
                      {control.detail}
                    </p>
                  </div>
                  <ControlStatus status={control.status} />
                </li>
              ))}
            </ul>
          </Section>
        ))}

        {/* Subprocessors ---------------------------------------------------- */}
        <Section
          id="subprocessors"
          eyebrow="Vendors"
          title="Subprocessors"
          intro="Every third party that can touch personal or health information, what
          they do, and whether a Business Associate Agreement governs that
          relationship."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ambe-gold/30">
                  {["Vendor", "Purpose", "Data touched", "BAA status"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="pb-3 pr-6 text-[11px] font-medium uppercase tracking-[0.12em] text-ambe-charcoal/60"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ambe-gold/15">
                {SUBPROCESSORS.map((sub) => {
                  const meta =
                    SUBPROCESSOR_BAA_LABELS[sub.baa] ||
                    SUBPROCESSOR_BAA_LABELS.soon;
                  return (
                    <tr key={sub.vendor} className="align-top">
                      <td className="py-5 pr-6 text-[15px] font-medium text-ambe-dark">
                        {sub.vendor}
                      </td>
                      <td className="py-5 pr-6 text-sm text-ambe-charcoal/75">
                        {sub.purpose}
                      </td>
                      <td className="py-5 pr-6 text-sm text-ambe-charcoal/75">
                        {sub.dataTouched}
                      </td>
                      <td className="py-5 pr-6">
                        <StatusPill tone={meta.tone} label={meta.label} />
                        <p className="mt-2 max-w-[16rem] text-xs leading-relaxed text-ambe-charcoal/60">
                          {sub.note}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Roadmap ---------------------------------------------------------- */}
        <Section
          id="roadmap"
          eyebrow="Compliance"
          title="Our roadmap"
          intro="Where we are headed, in the order we are getting there. Timelines are
          targets, not guarantees, and we will update this page as each phase
          completes."
        >
          <ol className="space-y-6">
            {ROADMAP.map((phase) => {
              const meta = TRUST_STATUS[phase.status] || TRUST_STATUS.soon;
              return (
                <li
                  key={phase.horizon}
                  className="rounded-2xl border border-ambe-gold/20 p-6 sm:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ambe-gold">
                        {phase.horizon} · {phase.window}
                      </p>
                      <h3 className="mt-1.5 font-heading !text-2xl !text-ambe-dark">
                        {phase.title}
                      </h3>
                    </div>
                    <StatusPill tone={meta.tone} label={meta.label} />
                  </div>
                  <ul className="mt-4 space-y-2">
                    {phase.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm leading-relaxed text-ambe-charcoal/80"
                      >
                        <span
                          className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ambe-gold"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </Section>

        {/* Gated documents -------------------------------------------------- */}
        <Section
          id="documents"
          eyebrow="Under NDA"
          title="Documentation for partners"
          intro="Enterprise partners, employers, and provider groups can request the
          following under a mutual non-disclosure agreement. Items marked Coming
          Soon do not exist yet — we will not send a document we have not
          produced."
        >
          <ul className="grid gap-4 sm:grid-cols-2">
            {GATED_DOCUMENTS.map((doc) => {
              const meta = TRUST_STATUS[doc.status] || TRUST_STATUS.soon;
              return (
                <li
                  key={doc.name}
                  className="rounded-xl border border-ambe-gold/20 bg-ambe-cream/25 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[15px] font-medium text-ambe-dark">
                      {doc.name}
                    </p>
                    <StatusPill tone={meta.tone} label={meta.label} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ambe-charcoal/75">
                    {doc.detail}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-ambe-charcoal/75">
            To start a review, write to{" "}
            <a
              href={`mailto:${SECURITY_CONTACT}`}
              className="font-medium text-ambe-gold underline underline-offset-4"
            >
              {SECURITY_CONTACT}
            </a>
            .
          </p>
        </Section>

        {/* Patient rights --------------------------------------------------- */}
        <Section
          id="your-rights"
          eyebrow="Patients"
          title="Your rights"
          intro="If we hold health information about you, HIPAA gives you specific
          rights over it."
        >
          <ul className="divide-y divide-ambe-gold/15 border-y border-ambe-gold/15">
            {PATIENT_RIGHTS.map((item) => (
              <li key={item.right} className="py-5">
                <p className="text-[15px] font-medium text-ambe-dark">
                  {item.right}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ambe-charcoal/75">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ambe-charcoal/75">
            To exercise any of these rights, contact{" "}
            <a
              href={`mailto:${PRIVACY_CONTACT}`}
              className="font-medium text-ambe-gold underline underline-offset-4"
            >
              {PRIVACY_CONTACT}
            </a>
            . See also our{" "}
            <Link
              href="/privacy-policy"
              className="font-medium text-ambe-gold underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        {/* Reporting -------------------------------------------------------- */}
        <Section
          id="report"
          eyebrow="Disclosure"
          title="Report a vulnerability"
          intro="If you believe you have found a security issue, we want to hear from
          you before anyone else does."
        >
          <div className="rounded-2xl bg-ambe-dark p-7 text-ambe-cream sm:p-9">
            <p className="text-[15px] leading-relaxed text-ambe-cream/85">
              Email{" "}
              <a
                href={`mailto:${SECURITY_CONTACT}`}
                className="font-medium text-ambe-gold underline underline-offset-4"
              >
                {SECURITY_CONTACT}
              </a>{" "}
              with enough detail to reproduce the issue. We aim to acknowledge
              every report within two business days.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-ambe-cream/85">
              We ask that you give us a reasonable window to fix the issue before
              disclosing it publicly, and that you avoid accessing, changing, or
              deleting any real patient data while testing. We will not pursue
              legal action against researchers who follow this.
            </p>
            <p className="mt-6 text-xs text-ambe-cream/50">
              A formal bug bounty program is{" "}
              <span className="font-medium text-ambe-gold">Coming Soon</span>.
            </p>
          </div>
        </Section>

        {/* Footer note ------------------------------------------------------ */}
        <p className="border-t border-ambe-gold/20 pt-8 text-xs leading-relaxed text-ambe-charcoal/60">
          This page describes our security program as of {LAST_REVIEWED} and is
          updated as controls change. It is provided for transparency and is not
          a warranty, a certification, or a contract. Ambé Wellness is operated by
          Lakshmi Devi Namaha LLC.
        </p>
      </div>
    </main>
  );
}
