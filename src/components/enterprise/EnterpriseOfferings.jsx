"use client";

import Link from "next/link";
import {
  ENTERPRISE_OFFERINGS,
  ORG_BENEFITS,
} from "@/lib/enterprise/offerings";

function OfferingCard({ offering }) {
  return (
    <article className="ent-offering-card">
      <div className="ent-offering-inner">
        <span className="ent-offering-number" aria-hidden>
          {offering.number}
        </span>

        <div className="ent-offering-body">
          <p className="ent-offering-label">{offering.label}</p>

          <h3 className="ent-offering-title">{offering.title}</h3>

          <p className="ent-offering-desc">{offering.description}</p>

          {offering.modalities?.length > 0 && (
            <div className="ent-modalities-bar">
              {offering.modalities.map((mod) => (
                <span key={mod} className="ent-modality-item">
                  {mod}
                </span>
              ))}
            </div>
          )}

          <div className="ent-offering-bullets">
            <ul>
              {offering.bulletsLeft.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <ul>
              {offering.bulletsRight.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <Link href={offering.cta.href} className="ent-offering-cta">
            {offering.cta.label}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function EnterpriseOfferings() {
  return (
    <section className="ent-offerings" id="our-offerings">
      <div className="ent-offerings-intro">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <p className="ent-offerings-eyebrow">Our Offerings</p>
          <h2 className="font-heading !text-3xl sm:!text-4xl md:!text-5xl !text-charcoal !font-normal !leading-tight mb-5">
            Three ways to bring Ambé to your organization.
          </h2>
          <p className="text-sm sm:text-base text-charcoal/70 leading-relaxed max-w-2xl mx-auto">
            Each offering is designed to stand alone or work in combination —
            giving you a fully integrated, tax-advantaged wellness ecosystem.
          </p>
        </div>
      </div>

      <div className="ent-offerings-list">
        {ENTERPRISE_OFFERINGS.map((offering) => (
          <OfferingCard key={offering.number} offering={offering} />
        ))}
      </div>

      <div className="ent-org-benefits">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="ent-org-header">
            <span className="ent-org-header-line" aria-hidden />
            <p className="ent-offerings-eyebrow">Why Ambé</p>
            <h2 className="font-heading !text-3xl sm:!text-4xl md:!text-[2.75rem] !text-charcoal !font-normal text-center !leading-tight">
              Built for every level of your organization.
            </h2>
          </div>

          <div className="ent-org-grid">
            {ORG_BENEFITS.map((item) => (
              <div key={item.title} className="ent-org-cell">
                <span className="ent-org-accent" aria-hidden />
                <h3 className="ent-org-title">{item.title}</h3>
                <p className="ent-org-desc">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
