/**
 * MIRROR of `functions/refund_policy.js` in the Cloud Functions package, and of
 * `lib/core/services/refund_policy.dart` in the Flutter app.
 *
 * All three must stay in step. The website renders the amount from this file,
 * the callable stores the amount from its own copy, and a patient who is shown
 * "$50.00" here and then has $25.00 approved has lost trust in the product.
 * When you change a rule, change it in all three and re-run
 * `functions/test/refund_policy.unit.test.js`.
 */

/**
 * Single source of truth for the patient deposit-refund policy.
 *
 * Every surface that shows or stores a refund amount — the Flutter app, the
 * Next.js website, `getRefundEligibility`, `submitRefundRequest` and the
 * lifecycle sweep — must agree, otherwise the patient sees one number and the
 * admin panel approves another. Before this module the branch was duplicated
 * (and had drifted) in five places; keep it here and here only.
 *
 * The master scenario table this implements:
 *
 *   #  Scenario                          Patient  Doctor  Refund  Doctor ledger
 *   1  Patient cancelled in advance      no       no      $50     $0
 *   2  Doctor cancelled (>=24h notice)   no       no      $50     $0
 *   3  Doctor cancelled late (<24h)      no       no      $50     -$5 fine
 *   4  Both attended                     yes      yes     $50     +$10
 *   5  Doctor absent / no-show           yes      no      $50     $0
 *   6  Patient missed / no-show          no       yes     $25     +$5
 *   7  Neither joined                    no       no      $25     $0
 *   8  Upcoming / before the call        -        -       $0 locked
 *   9  After the 30-day window           -        -       $0 expired
 *
 * Columns 1-3 are decided by `status` + `cancelledAtMs`; 4-7 by attendance;
 * 8 by timing. The doctor-ledger column is NOT this module's concern — it
 * lives in `doctor_earnings.js` and keys off the same attendance flags.
 *
 * Note the asymmetry in rows 5 and 6, which is deliberate: the patient is only
 * penalised for their OWN absence. Whether the doctor showed up never reduces
 * the patient's refund.
 */

const DEPOSIT_AMOUNT = 50.0;
const FULL_REFUND = 50.0;
const PARTIAL_REFUND = 25.0; // 50% of the deposit
const NO_REFUND = 0.0;

/**
 * Minutes after the scheduled start during which the appointment is still
 * "live" and a no-show cannot yet be declared. Matches the join window the
 * clients enforce (the patient can join until 60 minutes after the start), so
 * a patient who is merely late is never classified as absent.
 */
const GRACE_MINUTES = 60;

/** Days after payment during which a refund may be requested. */
const REFUND_WINDOW_DAYS = 30;

const OUTCOME = {
  COMPLETED: "completed",
  MISSED_BY_PATIENT: "missed_by_patient",
  MISSED_BY_DOCTOR: "missed_by_doctor",
  MISSED_BY_BOTH: "missed_by_both",
};

const CANCELLED_STATUSES = [
  "cancelled_by_user",
  "cancelled_by_doctor",
  "cancelled_by_admin",
  "cancelled_doctor_deleted",
];

/**
 * Coerces any of the timestamp shapes this codebase stores into epoch millis.
 *
 * Firestore `Timestamp`, JS `Date`, a raw number, an ISO string and the
 * `{_seconds}` / `{seconds}` plain-object form all appear in these documents
 * depending on whether a value came from the Admin SDK, the web SDK, a
 * callable payload or a JSON round-trip.
 *
 * @param {*} value timestamp in any supported shape
 * @return {number|null} epoch millis, or null when unusable
 */
function toMillis(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value.toMillis === "function") {
    try {
      return value.toMillis();
    } catch (_) {
      return null;
    }
  }
  if (typeof value.toDate === "function") {
    try {
      return value.toDate().getTime();
    } catch (_) {
      return null;
    }
  }
  if (typeof value === "object") {
    const seconds = value._seconds !== undefined ? value._seconds : value.seconds;
    if (typeof seconds === "number") {
      const nanos = value._nanoseconds || value.nanoseconds || 0;
      return seconds * 1000 + Math.floor(nanos / 1e6);
    }
  }
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

/**
 * Maps raw attendance onto one of the four terminal outcomes.
 *
 * @param {{userJoined: boolean, doctorJoined: boolean}} attendance flags
 * @return {string} an OUTCOME value
 */
function classifyOutcome({ userJoined, doctorJoined }) {
  if (userJoined && doctorJoined) return OUTCOME.COMPLETED;
  if (doctorJoined) return OUTCOME.MISSED_BY_PATIENT;
  if (userJoined) return OUTCOME.MISSED_BY_DOCTOR;
  return OUTCOME.MISSED_BY_BOTH;
}

/**
 * True when `status` is any of the cancellation states.
 *
 * @param {string|null|undefined} status appointment status
 * @return {boolean} whether the appointment was cancelled
 */
function isCancelledStatus(status) {
  if (!status || typeof status !== "string") return false;
  return CANCELLED_STATUSES.includes(status) || status.toLowerCase().includes("cancel");
}

const POLICY_TEXT = {
  CANCELLED_BY_DOCTOR: "Full deposit refund eligible (Appointment was cancelled by doctor).",
  CANCELLED: "Full deposit refund eligible (Appointment was cancelled).",
  COMPLETED: "Full deposit refund eligible (Consultation completed).",
  DOCTOR_ABSENT: "Full deposit refund eligible (Doctor was absent).",
  MISSED: "50% refund because the consultation was missed.",
  UPCOMING: "Refund locked until the consultation ends or is cancelled.",
  EXPIRED: "Refund period expired (exceeded 30 days).",
  DEFAULT: "Full deposit refund eligible.",
};

/**
 * Decides what a patient is owed for one consultation deposit.
 *
 * Resolution order, highest precedence first:
 *   1. an explicit terminal `status` written by the lifecycle sweep or the
 *      completion flow (`completed` / `missed_by_*`),
 *   2. a cancellation,
 *   3. attendance flags,
 *   4. timing (still inside the join window -> locked).
 *
 * Missing data never penalises the patient: with no appointment time and no
 * attendance we return the full deposit rather than guessing a no-show.
 *
 * @param {object} input decision inputs
 * @param {number} input.nowMs evaluation time in epoch millis
 * @param {number|null} [input.appointmentTimeMs] scheduled start
 * @param {number|null} [input.cancelledAtMs] when the appointment was cancelled
 * @param {boolean} [input.userJoined] patient joined the call
 * @param {boolean} [input.doctorJoined] doctor joined the call
 * @param {string|null} [input.status] appointment status
 * @param {number|null} [input.paymentDateMs] deposit payment time, for the
 *   30-day window. Omit to skip the expiry check entirely.
 * @param {number} [input.depositAmount] deposit paid, defaults to $50
 * @param {boolean} [input.hasPendingAppointment] the patient has a booked
 *   consultation that no other deposit accounts for, so an unresolvable
 *   appointment time means "not yet held" rather than "never booked"
 * @return {{refundableAmount: number, isNoShow: boolean, isUpcoming: boolean,
 *   isCancelled: boolean, isExpired: boolean, outcome: string|null,
 *   policyText: string, scenario: number}} the decision
 */
function decideRefund(input) {
  const {
    nowMs,
    appointmentTimeMs = null,
    cancelledAtMs = null,
    userJoined = false,
    doctorJoined = false,
    status = null,
    paymentDateMs = null,
    depositAmount = DEPOSIT_AMOUNT,
    hasPendingAppointment = false,
  } = input || {};

  const now = typeof nowMs === "number" ? nowMs : Date.now();
  const full = depositAmount > 0 ? depositAmount : FULL_REFUND;
  const half = Math.round(full * 50) / 100; // 50% of whatever was actually paid

  const decide = (amount, policyText, scenario, extra = {}) => ({
    refundableAmount: amount,
    isNoShow: false,
    isUpcoming: false,
    isCancelled: false,
    isExpired: false,
    outcome: null,
    policyText,
    scenario,
    ...extra,
  });

  // --- Scenario 8: still inside the join window --------------------------
  // Checked before everything except an explicit terminal status, because a
  // consultation that has not finished cannot yet be refunded. A patient who
  // has already joined is never "upcoming".
  const windowPassed =
    appointmentTimeMs !== null &&
    now >= appointmentTimeMs + GRACE_MINUTES * 60000;

  // --- Scenarios 1-3: cancellations ---------------------------------------
  if (isCancelledStatus(status)) {
    // A patient who "cancels" a slot that already started, and never joined,
    // is a no-show dressed up as a cancellation — clearing a dead appointment
    // out of the list must not buy back the full deposit. A doctor or admin
    // cancellation is always honoured in full, whenever it lands.
    const clearedAfterStart =
      status === "cancelled_by_user" &&
      cancelledAtMs !== null &&
      appointmentTimeMs !== null &&
      cancelledAtMs >= appointmentTimeMs &&
      !userJoined;

    if (!clearedAfterStart) {
      const byDoctor = status === "cancelled_by_doctor" || status === "cancelled_doctor_deleted";
      return decide(
        full,
        byDoctor ? POLICY_TEXT.CANCELLED_BY_DOCTOR : POLICY_TEXT.CANCELLED,
        byDoctor ? 2 : 1,
        { isCancelled: true },
      );
    }
    // else: fall through to the attendance rules below.
  }

  // --- Explicit terminal outcomes written by the lifecycle sweep ----------
  switch (status) {
    case OUTCOME.COMPLETED:
      return decide(full, POLICY_TEXT.COMPLETED, 4, { outcome: OUTCOME.COMPLETED });
    case OUTCOME.MISSED_BY_DOCTOR:
      return decide(full, POLICY_TEXT.DOCTOR_ABSENT, 5, { outcome: OUTCOME.MISSED_BY_DOCTOR });
    case OUTCOME.MISSED_BY_PATIENT:
      return decide(half, POLICY_TEXT.MISSED, 6, {
        isNoShow: true,
        outcome: OUTCOME.MISSED_BY_PATIENT,
      });
    case OUTCOME.MISSED_BY_BOTH:
      return decide(half, POLICY_TEXT.MISSED, 7, {
        isNoShow: true,
        outcome: OUTCOME.MISSED_BY_BOTH,
      });
    default:
      break;
  }

  // --- Scenarios 4-7: decided by who actually joined ----------------------
  if (userJoined && doctorJoined) {
    return decide(full, POLICY_TEXT.COMPLETED, 4, { outcome: OUTCOME.COMPLETED });
  }
  if (userJoined) {
    // Scenario 5. The patient turned up; the doctor did not. Full refund, and
    // explicitly NOT a no-show — the patient is never charged for this.
    return decide(full, POLICY_TEXT.DOCTOR_ABSENT, 5, { outcome: OUTCOME.MISSED_BY_DOCTOR });
  }

  // Patient has not joined. If the slot is still live, nothing is decided yet.
  if (appointmentTimeMs !== null && !windowPassed) {
    return decide(NO_REFUND, POLICY_TEXT.UPCOMING, 8, { isUpcoming: true });
  }

  if (appointmentTimeMs === null) {
    // No appointment time could be resolved for this deposit, but the patient
    // has a booked consultation that nothing else is paying for. Scenario 8:
    // the consultation has not happened, so the deposit is locked. Returning
    // the full deposit here would refund a consultation the patient is still
    // going to attend.
    if (hasPendingAppointment) {
      return decide(NO_REFUND, POLICY_TEXT.UPCOMING, 8, { isUpcoming: true });
    }
    // Nothing pending: we cannot prove absence, so never penalise. This is a
    // deposit that was paid and never used.
    return decide(full, POLICY_TEXT.DEFAULT, 0);
  }

  // --- Scenario 9: the 30-day window ---------------------------------------
  // Applied only once the outcome is otherwise settled, and only when the
  // caller supplied a payment date.
  if (paymentDateMs !== null) {
    const days = Math.floor((now - paymentDateMs) / 86400000);
    if (days > REFUND_WINDOW_DAYS) {
      return decide(NO_REFUND, POLICY_TEXT.EXPIRED, 9, { isExpired: true });
    }
  }

  // Scenarios 6 and 7: the patient was absent for a consultation that is over.
  const outcome = doctorJoined ? OUTCOME.MISSED_BY_PATIENT : OUTCOME.MISSED_BY_BOTH;
  return decide(half, POLICY_TEXT.MISSED, doctorJoined ? 6 : 7, {
    isNoShow: true,
    outcome,
  });
}

/**
 * Human-readable joint call duration, or null when there was no joint call.
 *
 * "Joint" is the point of this function: the clock starts when the SECOND
 * participant joins, not when the first one did, so a doctor sitting alone in
 * an empty room never accrues a call duration. Column 7 of the scenario table
 * ("Joint Call Duration Shown?") is exactly this returning non-null.
 *
 * @param {object} input attendance and timing
 * @param {boolean} input.userJoined patient joined
 * @param {boolean} input.doctorJoined doctor joined
 * @param {*} [input.userJoinedAt] when the patient joined
 * @param {*} [input.doctorJoinedAt] when the doctor joined
 * @param {*} [input.callEndedAt] when the call ended
 * @param {number} [input.nowMs] fallback end for a call still in progress
 * @return {string|null} e.g. "15 min 30 sec", or null
 */
function formatCallDuration({
  userJoined,
  doctorJoined,
  userJoinedAt = null,
  doctorJoinedAt = null,
  callEndedAt = null,
  nowMs = null,
}) {
  if (!userJoined || !doctorJoined) return null;

  const userMs = toMillis(userJoinedAt);
  const doctorMs = toMillis(doctorJoinedAt);
  if (userMs === null || doctorMs === null) return null;

  const startMs = Math.max(userMs, doctorMs);
  const endMs = toMillis(callEndedAt) !== null
    ? toMillis(callEndedAt)
    : (typeof nowMs === "number" ? nowMs : Date.now());

  const seconds = Math.floor((endMs - startMs) / 1000);
  return formatSeconds(seconds);
}

/**
 * Formats a duration in seconds the way every surface displays it.
 *
 * @param {number|null} seconds duration
 * @return {string|null} e.g. "39 sec", "1 min", "15 min 30 sec"
 */
function formatSeconds(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const s = Math.floor(Number(seconds));
  if (!Number.isFinite(s) || s <= 0) return null;
  if (s < 60) return `${s} sec`;
  const minutes = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${minutes} min ${rest} sec` : `${minutes} min`;
}

/**
 * Joint call duration in seconds, or null when there was no joint call.
 *
 * @param {object} input same shape as formatCallDuration
 * @return {number|null} seconds
 */
function jointCallSeconds({
  userJoined,
  doctorJoined,
  userJoinedAt = null,
  doctorJoinedAt = null,
  callEndedAt = null,
  nowMs = null,
}) {
  if (!userJoined || !doctorJoined) return null;
  const userMs = toMillis(userJoinedAt);
  const doctorMs = toMillis(doctorJoinedAt);
  if (userMs === null || doctorMs === null) return null;
  const startMs = Math.max(userMs, doctorMs);
  const endMs = toMillis(callEndedAt) !== null
    ? toMillis(callEndedAt)
    : (typeof nowMs === "number" ? nowMs : Date.now());
  const seconds = Math.floor((endMs - startMs) / 1000);
  return seconds > 0 ? seconds : null;
}

/**
 * Resolves the attendance/timing inputs for `decideRefund` out of the three
 * documents that may describe one consultation, in trust order.
 *
 * The `consultations/{id}` doc is written live by both clients as they join
 * and hang up, so it is the most trustworthy record of who was actually in the
 * room. The appointment doc is a mirror that can be stale, and the stored
 * refund request is a snapshot taken at submission time.
 *
 * @param {object} sources documents
 * @param {object|null} [sources.consultation] consultations/{id}
 * @param {object|null} [sources.appointment] the appointment doc
 * @param {object|null} [sources.refundRequest] an existing refundRequests doc
 * @return {{userJoined: boolean, doctorJoined: boolean, userJoinedAt: *,
 *   doctorJoinedAt: *, callEndedAt: *, callEndedBy: string|null,
 *   status: string|null, appointmentTimeMs: number|null,
 *   cancelledAtMs: number|null}} normalised inputs
 */
function resolveRefundContext({ consultation = null, appointment = null, refundRequest = null } = {}) {
  const c = consultation || {};
  const a = appointment || {};
  const r = refundRequest || {};

  const pick = (...values) => {
    for (const v of values) {
      if (v !== undefined && v !== null) return v;
    }
    return null;
  };

  return {
    userJoined: c.user_joined === true || a.user_joined === true || r.userJoined === true,
    doctorJoined: c.doctor_joined === true || a.doctor_joined === true || r.doctorJoined === true,
    userJoinedAt: pick(c.user_joined_at, a.user_joined_at, r.userJoinedAt),
    doctorJoinedAt: pick(c.doctor_joined_at, a.doctor_joined_at, r.doctorJoinedAt),
    callEndedAt: pick(c.call_ended_at, a.call_ended_at, r.callEndedAt),
    callEndedBy: pick(c.call_ended_by, a.call_ended_by, r.callEndedBy),
    status: pick(a.status, c.status),
    appointmentTimeMs: toMillis(pick(a.time, c.time, a.appointment_time)),
    cancelledAtMs: toMillis(pick(a.cancelled_at, c.cancelled_at)),
  };
}

export {
  DEPOSIT_AMOUNT,
  FULL_REFUND,
  PARTIAL_REFUND,
  NO_REFUND,
  GRACE_MINUTES,
  REFUND_WINDOW_DAYS,
  OUTCOME,
  POLICY_TEXT,
  CANCELLED_STATUSES,
  toMillis,
  classifyOutcome,
  isCancelledStatus,
  decideRefund,
  formatCallDuration,
  formatSeconds,
  jointCallSeconds,
  resolveRefundContext,
};
