/**
 * Doctor earnings helpers for the Doctor Portal on the Website.
 *
 * Every amount is handled as integer CENTS, matching `functions/doctor_earnings.js`
 * and the Flutter mobile application.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const LEDGER_COLLECTION = 'doctorLedger';
export const PAYOUT_COLLECTION = 'doctorPayouts';

export const LEDGER_TYPE_LABELS = {
  consultation_earning: 'Consultation Completed',
  no_show_earning: 'Patient No-show',
  cancellation_deduction: 'Doctor Cancellation',
  doctor_payout: 'Doctor Payout',
};

export const LEDGER_FILTERS = [
  { key: 'all', label: 'All', types: null },
  {
    key: 'earnings',
    label: 'Earnings',
    types: ['consultation_earning', 'no_show_earning'],
  },
  {
    key: 'deductions',
    label: 'Deductions',
    types: ['cancellation_deduction'],
  },
  {
    key: 'payouts',
    label: 'Payouts',
    types: ['doctor_payout'],
  },
];

export const EMPTY_SUMMARY = {
  gross_earned_cents: 0,
  deductions_cents: 0,
  net_earned_cents: 0,
  paid_cents: 0,
  pending_cents: 0,
  consultations_total: 0,
  consultations_completed: 0,
  consultations_no_show: 0,
  cancellations_count: 0,
  payouts_count: 0,
  worked_seconds: 0,
};

/**
 * Business-rule defaults, in CENTS. These mirror `DEFAULT_EARNINGS_CONFIG` in
 * `functions/doctor_earnings.js`, which is the code that actually credits the
 * ledger — a different number here would promise money that is never paid.
 */
export const DEFAULT_EARNINGS_POLICY = {
  consultationEarningCents: 1000,
  noShowEarningCents: 500,
  hourlyRateCents: 1000,
  lateCancellationFinePercent: 50,
  lateCancellationWindowHours: 24,
  lateCancellationFineCents: 500,
};

/** Dollars as stored by the admin -> integer cents, without float drift. */
function settingToCents(value, fallbackCents) {
  const numeric = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallbackCents;
  return Math.round(numeric * 100);
}

/** A non-negative finite number, or the fallback. */
function settingToNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

/**
 * Resolves a raw `admin_settings/general` document into the rate card, using
 * the same fallbacks and fine arithmetic as the server.
 */
export function normaliseEarningsPolicy(data) {
  const stored = data && typeof data === 'object' ? data : {};

  const hourlyRateCents = settingToCents(
    stored.doctor_hourly_rate,
    DEFAULT_EARNINGS_POLICY.hourlyRateCents,
  );
  // The server falls back to the hourly rate for the consultation earning.
  const consultationEarningCents = settingToCents(
    stored.doctor_consultation_earning,
    hourlyRateCents,
  );
  const lateCancellationFinePercent = settingToNumber(
    stored.doctor_late_cancellation_fine_percent,
    DEFAULT_EARNINGS_POLICY.lateCancellationFinePercent,
  );

  return {
    consultationEarningCents,
    noShowEarningCents: settingToCents(
      stored.doctor_no_show_earning,
      DEFAULT_EARNINGS_POLICY.noShowEarningCents,
    ),
    hourlyRateCents,
    lateCancellationFinePercent,
    lateCancellationWindowHours: settingToNumber(
      stored.doctor_late_cancellation_window_hours,
      DEFAULT_EARNINGS_POLICY.lateCancellationWindowHours,
    ),
    lateCancellationFineCents: Math.round(
      (hourlyRateCents * lateCancellationFinePercent) / 100,
    ),
  };
}

/**
 * Reads the configured rates. Never throws — an unreadable settings document
 * falls back to the server defaults so the rate strip still renders.
 */
export async function fetchEarningsPolicy() {
  try {
    const snap = await getDoc(doc(db, 'admin_settings', 'general'));
    return normaliseEarningsPolicy(snap.exists() ? snap.data() : null);
  } catch (error) {
    console.error('fetchEarningsPolicy: falling back to defaults', error);
    return { ...DEFAULT_EARNINGS_POLICY };
  }
}

/** Formats integer cents as `$1,234.56` (a negative value reads `-$20.00`). */
export function formatCents(cents) {
  const value = Number(cents) || 0;
  const sign = value < 0 ? '-' : '';
  return `${sign}$${(Math.abs(value) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** `$12.34` -> 1234. Returns NaN for unusable input. */
export function dollarsToCents(value) {
  const numeric =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric)) return NaN;
  return Math.round(numeric * 100);
}

/** Formats worked seconds as `22h 40m` or `45m` or `30s`. Returns null when unknown. */
export function formatWorkedSeconds(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const total = Number(seconds);
  if (!Number.isFinite(total) || total < 0) return null;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours === 0 && minutes === 0) return `${Math.round(total)}s`;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** Normalises a possibly-missing `earnings_summary` map into a complete one. */
export function normaliseSummary(raw) {
  const summary = { ...EMPTY_SUMMARY };
  if (raw && typeof raw === 'object') {
    Object.keys(EMPTY_SUMMARY).forEach((key) => {
      const value = Number(raw[key]);
      if (Number.isFinite(value)) summary[key] = Math.round(value);
    });
  }
  // Re-derive invariants: net = gross - deductions, pending = net - paid
  summary.net_earned_cents = summary.gross_earned_cents - summary.deductions_cents;
  summary.pending_cents = summary.net_earned_cents - summary.paid_cents;
  return summary;
}

/** Firestore Timestamp | Date | millis | ISO string -> Date | null. */
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'number')
    return new Date(value > 1e11 ? value : value * 1000);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value._seconds === 'number')
    return new Date(value._seconds * 1000);
  return null;
}

/**
 * Fetches one page of ledger entries for a doctor, newest first.
 * @param {string} doctorId
 * @param {object} [options]
 * @param {string[]|null} [options.types]
 * @param {*} [options.cursor]
 * @param {number} [options.pageSize]
 */
export async function fetchLedgerPage(doctorId, options = {}) {
  const { types = null, cursor = null, pageSize = 20 } = options;
  const constraints = [where('doctor_id', '==', doctorId)];
  if (types && types.length) constraints.push(where('type', 'in', types));
  constraints.push(orderBy('created_at', 'desc'));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(fsLimit(pageSize));

  const snap = await getDocs(query(collection(db, LEDGER_COLLECTION), ...constraints));
  return {
    entries: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    cursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : cursor,
    hasMore: snap.docs.length === pageSize,
  };
}
