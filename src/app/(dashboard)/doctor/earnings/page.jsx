'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';
import EarningsPolicyStrip from '@/components/common/EarningsPolicyStrip';
import {
  formatCents,
  formatWorkedSeconds,
  normaliseSummary,
  toDate,
  fetchLedgerPage,
  LEDGER_FILTERS,
  LEDGER_TYPE_LABELS,
  EMPTY_SUMMARY,
} from '@/lib/doctorEarnings';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

export default function DoctorEarningsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  // Ledger state
  const [entries, setEntries] = useState([]);
  const [activeFilter, setActiveFilter] = useState(LEDGER_FILTERS[0]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState(null);

  // Selected entry for modal
  const [selectedEntry, setSelectedEntry] = useState(null);

  // 1. Auth & Realtime Doctor Summary Listener
  useEffect(() => {
    let unsubDoc = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Realtime listener on doctor's document for summary totals
      const doctorRef = doc(db, 'doctors', user.uid);
      unsubDoc = onSnapshot(
        doctorRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setSummary(normaliseSummary(data.earnings_summary));
          } else {
            setSummary(EMPTY_SUMMARY);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error listening to doctor summary:', err);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, [router]);

  // 2. Fetch Ledger Entries
  const loadLedger = useCallback(
    async (reset = true) => {
      if (!currentUser?.uid) return;
      setLedgerLoading(true);
      setLedgerError(null);

      try {
        const page = await fetchLedgerPage(currentUser.uid, {
          types: activeFilter.types,
          cursor: reset ? null : cursor,
          pageSize: 20,
        });

        setEntries((prev) => (reset ? page.entries : [...prev, ...page.entries]));
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      } catch (err) {
        console.error('Error loading ledger:', err);
        setLedgerError('Could not load ledger history. Please try again.');
      } finally {
        setLedgerLoading(false);
      }
    },
    [currentUser, activeFilter, cursor]
  );

  // Load first page whenever user or filter changes
  useEffect(() => {
    if (currentUser?.uid) {
      setCursor(null);
      loadLedger(true);
    }
  }, [currentUser, activeFilter]);

  const handleFilterChange = (filter) => {
    if (filter.key === activeFilter.key) return;
    setActiveFilter(filter);
  };

  const getEntryBadge = (type, direction) => {
    const isCredit = direction === 'credit';
    if (type === 'doctor_payout') {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'Payout',
      };
    }
    if (type === 'cancellation_deduction') {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        label: 'Cancellation Fine',
      };
    }
    if (type === 'no_show_earning') {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Patient No-Show',
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Consultation Completed',
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-[#C8996A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <BackButton href="/doctor/menu" label="Back to Menu" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Doctor Earnings</h1>
            <p className="text-[#6B6862] text-sm mt-1">
              Live overview of your consultation revenue, deductions, and payout history.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Available / Pending Balance */}
        <div className="bg-gradient-to-br from-[#FAF8F5] to-white rounded-2xl p-6 border-2 border-[#C8996A]/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C8996A]">
              Available Balance
            </span>
            <div className="bg-[#FFD3AC]/40 p-2 rounded-xl text-[#C8996A]">
              <BanknotesIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#1A1A1A]">
              {formatCents(summary.pending_cents)}
            </div>
            <p className="text-xs text-[#8C827A] mt-1">Pending payout transfer</p>
          </div>
        </div>

        {/* Gross Earned */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E2D9] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6862]">
              Gross Earned
            </span>
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
              <ArrowTrendingUpIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-[#1A1A1A]">
              {formatCents(summary.gross_earned_cents)}
            </div>
            <p className="text-xs text-[#8C827A] mt-1">Total revenue generated</p>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E2D9] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6862]">
              Deductions
            </span>
            <div className="bg-rose-50 p-2 rounded-xl text-rose-600">
              <ArrowTrendingDownIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-rose-600">
              {summary.deductions_cents > 0 ? `-${formatCents(summary.deductions_cents)}` : '$0.00'}
            </div>
            <p className="text-xs text-[#8C827A] mt-1">Late cancellation penalties</p>
          </div>
        </div>

        {/* Total Paid Out */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E2D9] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6862]">
              Total Paid Out
            </span>
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-[#1A1A1A]">
              {formatCents(summary.paid_cents)}
            </div>
            <p className="text-xs text-[#8C827A] mt-1">Paid to your bank account</p>
          </div>
        </div>
      </div>

      {/* Consultation rates — compact strip, details on demand */}
      <EarningsPolicyStrip />

      {/* Activity Statistics Grid */}
      <div className="bg-white rounded-2xl border border-[#E7E2D9] p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#6B6862] mb-4">
          Consultation Activity Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]/60">
            <div className="flex items-center space-x-2 text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Completed Calls</span>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-2">
              {summary.consultations_completed}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]/60">
            <div className="flex items-center space-x-2 text-amber-700">
              <UserGroupIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Patient No-Shows</span>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-2">
              {summary.consultations_no_show}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]/60">
            <div className="flex items-center space-x-2 text-rose-700">
              <XCircleIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Doctor Cancellations</span>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-2">
              {summary.cancellations_count}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]/60">
            <div className="flex items-center space-x-2 text-[#C8996A]">
              <ClockIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Total Worked Time</span>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-2">
              {formatWorkedSeconds(summary.worked_seconds) || '0m'}
            </p>
          </div>
        </div>
      </div>

      {/* Ledger Section */}
      <div className="bg-white rounded-2xl border border-[#E7E2D9] shadow-sm overflow-hidden">
        {/* Header & Filter Tabs */}
        <div className="p-6 border-b border-[#E7E2D9] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Earnings Ledger</h2>
            <p className="text-xs text-[#8C827A] mt-0.5">
              Immutable ledger of all consultation credits, cancellation debits, and payouts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-[#FAF8F5] p-1.5 rounded-xl border border-[#E7E2D9]">
            {LEDGER_FILTERS.map((f) => {
              const active = f.key === activeFilter.key;
              return (
                <button
                  key={f.key}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                    active
                      ? 'bg-[#C8996A] text-white shadow-sm'
                      : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-white/60'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ledger Table / List */}
        {ledgerError && (
          <div className="p-6 text-center text-sm text-rose-600 bg-rose-50 border-b border-rose-100">
            {ledgerError}
          </div>
        )}

        {entries.length === 0 && !ledgerLoading ? (
          <div className="p-16 text-center">
            <DocumentTextIcon className="h-12 w-12 text-[#8C827A]/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#1A1A1A]">No entries found</h3>
            <p className="text-xs text-[#8C827A] mt-1 max-w-sm mx-auto">
              No transactions match the selected filter. As you complete consultations, ledger entries will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E7E2D9]">
            {entries.map((entry) => {
              const isCredit = entry.direction === 'credit';
              const date = toDate(entry.created_at);
              const badge = getEntryBadge(entry.type, entry.direction);
              const metadata = entry.metadata || {};

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] transition cursor-pointer group"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowTrendingUpIcon className="h-5 w-5" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-[#1A1A1A] group-hover:text-[#C8996A] transition">
                          {LEDGER_TYPE_LABELS[entry.type] || entry.type}
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Subtitle / Details */}
                      <p className="text-xs text-[#6B6862] mt-1">
                        {metadata.patient_name
                          ? `Patient: ${metadata.patient_name}`
                          : metadata.reason || entry.notes || 'Transaction record'}
                        {metadata.duration_seconds ? (
                          <span className="ml-2 text-[#8C827A]">
                            • Duration: {formatWorkedSeconds(metadata.duration_seconds)}
                          </span>
                        ) : null}
                      </p>

                      <p className="text-[11px] text-[#8C827A] mt-0.5">
                        {date ? date.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        }) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-base font-bold ${
                        isCredit ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{formatCents(entry.amount_cents)}
                    </div>
                    <span className="text-[11px] text-[#8C827A] group-hover:underline">
                      View details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4 border-t border-[#E7E2D9] text-center bg-[#FAF8F5]/50">
            <button
              onClick={() => loadLedger(false)}
              disabled={ledgerLoading}
              className="px-6 py-2 text-xs font-semibold text-[#C8996A] hover:text-[#B38356] bg-white border border-[#C8996A]/40 rounded-xl hover:shadow-sm transition disabled:opacity-50"
            >
              {ledgerLoading ? 'Loading...' : 'Load More Transactions'}
            </button>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E7E2D9] relative space-y-6 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E7E2D9] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">Transaction Details</h3>
                <p className="text-xs text-[#8C827A] font-mono mt-0.5">
                  ID: {selectedEntry.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-2 text-[#8C827A] hover:text-[#1A1A1A] rounded-lg hover:bg-[#FAF8F5] transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Amount Banner */}
            <div
              className={`p-5 rounded-xl border text-center ${
                selectedEntry.direction === 'credit'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50/70 border-rose-200 text-rose-800'
              }`}
            >
              <div className="text-3xl font-extrabold">
                {selectedEntry.direction === 'credit' ? '+' : '-'}
                {formatCents(selectedEntry.amount_cents)}
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-80">
                {LEDGER_TYPE_LABELS[selectedEntry.type] || selectedEntry.type}
              </p>
            </div>

            {/* Details List */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[#E7E2D9]/60">
                <span className="text-[#6B6862]">Date & Time</span>
                <span className="font-medium text-[#1A1A1A]">
                  {toDate(selectedEntry.created_at)?.toLocaleString() || '—'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#E7E2D9]/60">
                <span className="text-[#6B6862]">Direction</span>
                <span className="font-medium capitalize text-[#1A1A1A]">
                  {selectedEntry.direction}
                </span>
              </div>

              {selectedEntry.metadata?.patient_name && (
                <div className="flex justify-between py-2 border-b border-[#E7E2D9]/60">
                  <span className="text-[#6B6862]">Patient</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {selectedEntry.metadata.patient_name}
                  </span>
                </div>
              )}

              {selectedEntry.metadata?.duration_seconds ? (
                <div className="flex justify-between py-2 border-b border-[#E7E2D9]/60">
                  <span className="text-[#6B6862]">Call Duration</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {formatWorkedSeconds(selectedEntry.metadata.duration_seconds)}
                  </span>
                </div>
              ) : null}

              {selectedEntry.metadata?.consultation_id && (
                <div className="flex justify-between py-2 border-b border-[#E7E2D9]/60">
                  <span className="text-[#6B6862]">Consultation ID</span>
                  <span className="font-mono text-xs text-[#1A1A1A]">
                    {selectedEntry.metadata.consultation_id}
                  </span>
                </div>
              )}

              {selectedEntry.metadata?.appointment_id && (
                <div className="flex justify-between py-2 border-b border-[#E7E2D9]/60">
                  <span className="text-[#6B6862]">Appointment ID</span>
                  <span className="font-mono text-xs text-[#1A1A1A]">
                    {selectedEntry.metadata.appointment_id}
                  </span>
                </div>
              )}

              {selectedEntry.metadata?.reason && (
                <div className="flex justify-between py-2 border-b border-[#E7E2D9]/60">
                  <span className="text-[#6B6862]">Reason / Notes</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {selectedEntry.metadata.reason}
                  </span>
                </div>
              )}

              {selectedEntry.metadata?.receipt_url && (
                <div className="pt-2">
                  <a
                    href={selectedEntry.metadata.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-[#C8996A] hover:underline"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    <span>View Payout Receipt Attachment</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-full py-2.5 bg-[#C8996A] hover:bg-[#B38356] text-white rounded-xl text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
