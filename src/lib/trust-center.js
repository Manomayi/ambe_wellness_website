// Trust Center content model — the single source of truth for /security.
//
// HONESTY RULE (read before editing):
// A public security page is a legal representation. Claiming a control that is
// not actually in place is an unfair-or-deceptive practice under FTC Act §5 and
// is the first thing a plaintiff's lawyer subpoenas after a breach. Every entry
// below therefore carries an explicit `status`:
//
//   "live"    — implemented, verifiable today. Safe to state publicly.
//   "progress"— actively being built, not finished. Stated as in progress.
//   "soon"    — planned, not started. Rendered with a "Coming Soon" label.
//
// Move an item to "live" ONLY when someone can demonstrate it on request.
// When a control ships, update the item here — not the page markup.

export const TRUST_STATUS = {
  live: { label: "Live", tone: "live" },
  progress: { label: "In Progress", tone: "progress" },
  soon: { label: "Coming Soon", tone: "soon" },
};

export const LAST_REVIEWED = "September 2, 2026";

export const SECURITY_CONTACT = "security@ambewellness.com";
export const PRIVACY_CONTACT = "privacy@ambewellness.com";

// ---------------------------------------------------------------------------
// Posture summary — the honest headline.
// ---------------------------------------------------------------------------

export const POSTURE = {
  headline: "Building toward HIPAA compliance, in the open.",
  body:
    "Ambé Wellness handles health information, and we hold ourselves to the " +
    "standard that comes with it. We are partway through a formal HIPAA " +
    "readiness program. Rather than claim a finish line we have not crossed, " +
    "this page shows exactly what is in place today, what is being built, and " +
    "what is still ahead.",
};

// ---------------------------------------------------------------------------
// Control domains
// ---------------------------------------------------------------------------

export const CONTROL_DOMAINS = [
  {
    id: "encryption",
    title: "Encryption",
    summary: "How your information is protected in motion and at rest.",
    controls: [
      {
        name: "TLS 1.2+ in transit",
        status: "live",
        detail:
          "All traffic between our apps and our servers travels over encrypted " +
          "connections. Certificates are managed by our cloud provider and " +
          "rotated automatically.",
      },
      {
        name: "AES-256 at rest",
        status: "live",
        detail:
          "Databases, file storage, and backups are encrypted at rest with " +
          "AES-256 by our cloud provider, with keys managed in Google Cloud KMS.",
      },
      {
        name: "Customer-managed encryption keys (CMEK)",
        status: "soon",
        detail:
          "Moving encryption keys under our own control so key rotation and " +
          "revocation are independent of the platform default.",
      },
      {
        name: "Field-level encryption for clinical notes",
        status: "soon",
        detail:
          "Additional encryption applied to the most sensitive clinical fields " +
          "so that they remain unreadable even to platform-level operators.",
      },
    ],
  },
  {
    id: "access",
    title: "Access Control",
    summary: "Who can reach health information, and under what conditions.",
    controls: [
      {
        name: "Individual accounts, no shared logins",
        status: "live",
        detail:
          "Every patient, practitioner, and staff member authenticates as " +
          "themselves. Credentials are never shared between people.",
      },
      {
        name: "Role-based access control (RBAC)",
        status: "progress",
        detail:
          "Practitioner, patient, support, and administrator roles are being " +
          "separated so each role reaches only the records it needs.",
      },
      {
        name: "Database-enforced record isolation",
        status: "progress",
        detail:
          "Authorization rules are being moved into the database tier so a " +
          "patient record is reachable only by that patient and their assigned " +
          "care team — enforced by the server, not by the app.",
      },
      {
        name: "Multi-factor authentication (MFA)",
        status: "soon",
        detail:
          "MFA will be required for every practitioner and administrator " +
          "account, and offered to patients.",
      },
      {
        name: "Automatic session timeout",
        status: "soon",
        detail:
          "Idle sessions will end automatically and require re-authentication, " +
          "as required by the HIPAA Security Rule.",
      },
      {
        name: "Quarterly access reviews",
        status: "soon",
        detail:
          "A recurring review confirming that every account still needs the " +
          "access it holds, with removals documented.",
      },
    ],
  },
  {
    id: "infrastructure",
    title: "Infrastructure & Network",
    summary: "Where the platform runs and how it is isolated.",
    controls: [
      {
        name: "Managed cloud hosting (Google Cloud / Firebase)",
        status: "live",
        detail:
          "The platform runs on Google Cloud Platform, which maintains its own " +
          "SOC 2, ISO 27001, and HITRUST certifications for the underlying " +
          "infrastructure.",
      },
      {
        name: "United States data residency",
        status: "progress",
        detail:
          "Confirming and pinning every data store to United States regions, " +
          "and documenting the result.",
      },
      {
        name: "Private networking / VPC Service Controls",
        status: "soon",
        detail:
          "A service perimeter around production data so it cannot be reached " +
          "from the public internet, only from authorized services.",
      },
      {
        name: "Web Application Firewall & DDoS protection",
        status: "soon",
        detail:
          "Edge filtering for common web attacks and volumetric traffic floods.",
      },
    ],
  },
  {
    id: "monitoring",
    title: "Logging & Monitoring",
    summary: "How access to health information is recorded and reviewed.",
    controls: [
      {
        name: "Infrastructure and application logging",
        status: "live",
        detail:
          "Server activity and errors are captured in Google Cloud Logging.",
      },
      {
        name: "PHI access audit trail",
        status: "progress",
        detail:
          "An immutable, six-year audit log recording who viewed or changed " +
          "which health record and when — a HIPAA Security Rule requirement.",
      },
      {
        name: "Automated alerting on anomalous access",
        status: "soon",
        detail:
          "Alerts on unusual access patterns, such as bulk record reads or " +
          "logins from unexpected locations.",
      },
      {
        name: "Log integrity protection",
        status: "soon",
        detail:
          "Write-once retention so audit logs cannot be altered or deleted, " +
          "including by administrators.",
      },
    ],
  },
  {
    id: "resilience",
    title: "Backup & Disaster Recovery",
    summary: "What happens if data is lost or a system fails.",
    controls: [
      {
        name: "Automated daily backups",
        status: "progress",
        detail:
          "Scheduled, encrypted backups of all patient data with a defined " +
          "retention window.",
      },
      {
        name: "Tested restore procedure",
        status: "soon",
        detail:
          "A documented contingency plan with a restore drill performed and " +
          "recorded at least annually, as HIPAA requires.",
      },
      {
        name: "Published RTO / RPO targets",
        status: "soon",
        detail:
          "Formal recovery time and recovery point objectives, published here " +
          "once tested and met.",
      },
    ],
  },
  {
    id: "operations",
    title: "People & Process",
    summary: "The administrative safeguards behind the technology.",
    controls: [
      {
        name: "Designated Security Officer and Privacy Officer",
        status: "soon",
        detail:
          "Two named individuals formally accountable for the security and " +
          "privacy programs, as HIPAA requires.",
      },
      {
        name: "Annual workforce HIPAA training",
        status: "soon",
        detail:
          "Required annual training for everyone who touches code, " +
          "infrastructure, or patient support, with completion records kept.",
      },
      {
        name: "Annual Security Risk Analysis",
        status: "soon",
        detail:
          "A documented, repeated assessment of risks to health information " +
          "and the plan to remediate them.",
      },
      {
        name: "Incident Response & Breach Notification Plan",
        status: "soon",
        detail:
          "A written plan covering detection, containment, and notification " +
          "within the timelines set by the HIPAA Breach Notification Rule.",
      },
      {
        name: "Written policies and procedures",
        status: "soon",
        detail:
          "The full HIPAA policy set — sanction policy, workstation use, media " +
          "disposal, contingency planning, and more.",
      },
      {
        name: "Background checks for workforce with PHI access",
        status: "soon",
        detail: "Pre-engagement screening for anyone who can reach patient data.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Subprocessors — every vendor that could touch personal or health data.
// `baa` describes the Business Associate Agreement status.
// ---------------------------------------------------------------------------

export const SUBPROCESSORS = [
  {
    vendor: "Google Cloud / Firebase",
    purpose: "Application hosting, database, authentication, file storage",
    dataTouched: "Account and health information",
    baa: "soon",
    note: "BAA execution in progress with Google Cloud.",
  },
  {
    vendor: "Agora",
    purpose: "Live video consultations",
    dataTouched: "Real-time audio and video of consultations",
    baa: "soon",
    note: "HIPAA-eligible plan and BAA being arranged.",
  },
  {
    vendor: "Vercel",
    purpose: "Website and web portal hosting",
    dataTouched: "Account information in transit",
    baa: "soon",
    note: "Requires an Enterprise agreement to obtain a BAA.",
  },
  {
    vendor: "Stripe",
    purpose: "Payment processing",
    dataTouched: "Billing information only — no clinical data",
    baa: "na",
    note:
      "Stripe does not act as a Business Associate. We deliberately keep all " +
      "clinical information out of payment records.",
  },
  {
    vendor: "PayPal",
    purpose: "Alternative payment processing",
    dataTouched: "Billing information only — no clinical data",
    baa: "na",
    note: "Same segregation as Stripe: billing data only.",
  },
  {
    vendor: "Apple / Google push notification services",
    purpose: "Mobile push notifications",
    dataTouched: "Notification alerts only",
    baa: "progress",
    note:
      "Being reworked so notifications never contain clinical content — only " +
      "a neutral prompt to open the app.",
  },
];

export const SUBPROCESSOR_BAA_LABELS = {
  live: { label: "BAA in place", tone: "live" },
  progress: { label: "In Progress", tone: "progress" },
  soon: { label: "Coming Soon", tone: "soon" },
  na: { label: "No PHI shared", tone: "na" },
};

// ---------------------------------------------------------------------------
// Certification roadmap
// ---------------------------------------------------------------------------

export const ROADMAP = [
  {
    horizon: "Phase 1",
    window: "Now → 90 days",
    title: "HIPAA Security Rule remediation",
    status: "progress",
    items: [
      "Close all critical access-control gaps",
      "Execute Business Associate Agreements with every vendor touching PHI",
      "Stand up the PHI access audit trail",
      "Appoint Security and Privacy Officers",
      "Complete the first documented Security Risk Analysis",
    ],
  },
  {
    horizon: "Phase 2",
    window: "3 → 6 months",
    title: "Policy, training, and independent testing",
    status: "soon",
    items: [
      "Publish the full written policy set",
      "Complete annual workforce HIPAA training",
      "Third-party penetration test with remediation",
      "Tested backup and disaster recovery drill",
    ],
  },
  {
    horizon: "Phase 3",
    window: "6 → 12 months",
    title: "SOC 2 Type I",
    status: "soon",
    items: [
      "Independent CPA firm attests that controls are designed correctly",
      "Report available to enterprise partners under NDA",
    ],
  },
  {
    horizon: "Phase 4",
    window: "Year 2",
    title: "SOC 2 Type II",
    status: "soon",
    items: [
      "Controls proven to operate effectively over a 6–12 month window",
      "Continuous control monitoring in place",
    ],
  },
  {
    horizon: "Phase 5",
    window: "Year 2+",
    title: "HITRUST or ISO 27001",
    status: "soon",
    items: [
      "Pursued when required by hospital systems or enterprise health partners",
    ],
  },
];

// ---------------------------------------------------------------------------
// Gated documents — available under NDA once they exist.
// ---------------------------------------------------------------------------

export const GATED_DOCUMENTS = [
  {
    name: "Sample Business Associate Agreement",
    status: "soon",
    detail: "Our standard BAA template for enterprise and provider partners.",
  },
  {
    name: "Penetration test summary",
    status: "soon",
    detail: "Executive summary of our most recent third-party security test.",
  },
  {
    name: "SOC 2 Type I report",
    status: "soon",
    detail: "Available to prospective partners under NDA once issued.",
  },
  {
    name: "Security Risk Analysis summary",
    status: "soon",
    detail: "High-level findings and remediation status from our annual analysis.",
  },
  {
    name: "Architecture and data-flow diagram",
    status: "soon",
    detail: "How health information moves through our systems, end to end.",
  },
];

// ---------------------------------------------------------------------------
// Patient rights under HIPAA
// ---------------------------------------------------------------------------

export const PATIENT_RIGHTS = [
  {
    right: "Access your records",
    detail: "Request a copy of the health information we hold about you.",
  },
  {
    right: "Request a correction",
    detail: "Ask us to amend information you believe is inaccurate.",
  },
  {
    right: "An accounting of disclosures",
    detail: "Ask who your information has been shared with, and why.",
  },
  {
    right: "Request restrictions",
    detail: "Ask us to limit how your information is used or disclosed.",
  },
  {
    right: "File a complaint",
    detail:
      "Raise a concern with us directly, or with the U.S. Department of Health " +
      "and Human Services Office for Civil Rights. We will never retaliate.",
  },
];
