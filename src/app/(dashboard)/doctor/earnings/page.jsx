'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
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
          if (err?.code === 'permission-denied') return;
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
    <WebLayoutWrapper>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <AmbeBackButton href="/doctor/menu" />
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
              Earnings
            </h1>
            <p className="text-white/60 text-xs sm:text-sm mt-0.5">
              Live overview of your consultation revenue, deductions, and payout history.
            </p>
          </div>
        </div>

        {/* Headline Balance Card */}
        <div className="bg-[#2D2D30]/85 border border-[#FFD3AC]/35 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Pending Balance
              </span>
              <div className="text-3xl sm:text-4xl font-bold text-[#FFD3AC] mt-1">
                {formatCents(summary.pending_cents)}
              </div>
              <p className="text-xs text-white/50 mt-1">Pending payout transfer</p>
            </div>
            <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Total Earned
              </span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {formatCents(summary.gross_earned_cents)}
              </div>
              <p className="text-xs text-white/50 mt-1">Gross revenue</p>
            </div>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Paid Out */}
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">Total Paid</span>
              <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-2">
              {formatCents(summary.paid_cents)}
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">Deductions</span>
              <ArrowTrendingDownIcon className="h-4 w-4 text-[#FFD3AC]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#FFD3AC] mt-2">
              {summary.deductions_cents > 0 ? `-${formatCents(summary.deductions_cents)}` : '$0.00'}
            </div>
          </div>

          {/* Worked Hours */}
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">Worked Time</span>
              <ClockIcon className="h-4 w-4 text-white/70" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-2">
              {formatWorkedSeconds(summary.worked_seconds) || '0m'}
            </div>
          </div>

          {/* Consultations */}
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">Consultations</span>
              <UserGroupIcon className="h-4 w-4 text-white/70" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-2">
              {summary.consultations_completed}
            </div>
          </div>
        </div>

        {/* Consultation Rates & Policy Strip */}
        <EarningsPolicyStrip />

        {/* Activity Statistics Grid */}
        <div className="bg-[#2D2D30]/60 border border-white/10 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">
            Consultation Activity Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 font-medium">Completed</span>
              <p className="text-xl font-bold text-white mt-1">
                {summary.consultations_completed}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 font-medium">Patient No-Shows</span>
              <p className="text-xl font-bold text-white mt-1">
                {summary.consultations_no_show}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 font-medium">Cancellations</span>
              <p className="text-xl font-bold text-white mt-1">
                {summary.cancellations_count}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/60 font-medium">Total Worked</span>
              <p className="text-xl font-bold text-[#FFD3AC] mt-1">
                {formatWorkedSeconds(summary.worked_seconds) || '0m'}
              </p>
            </div>
          </div>
        </div>

        {/* Ledger Section */}
        <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl shadow-sm overflow-hidden">
          {/* Header & Filter Tabs */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">Earnings Ledger</h2>
              <p className="text-xs text-white/60 mt-0.5">
                Immutable ledger of all consultation credits, cancellation debits, and payouts.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="inline-flex items-center space-x-1.5 bg-white/5 p-1 rounded-full border border-white/10 min-w-max">
                {LEDGER_FILTERS.map((f) => {
                  const active = f.key === activeFilter.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => handleFilterChange(f)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-[#FFD3AC] text-[#1E1E1E] shadow-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ledger Table / List */}
          {ledgerError && (
            <div className="p-4 text-center text-sm text-rose-400 bg-rose-500/10 border-b border-rose-500/20">
              {ledgerError}
            </div>
          )}

          {entries.length === 0 && !ledgerLoading ? (
            <div className="p-10 sm:p-16 text-center">
              <DocumentTextIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No entries found</h3>
              <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
                No transactions match the selected filter. As you complete consultations, ledger entries will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {entries.map((entry) => {
                const isCredit = entry.direction === 'credit';
                const date = toDate(entry.created_at);
                const badge = getEntryBadge(entry.type, entry.direction);
                const metadata = entry.metadata || {};

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="p-3.5 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4 hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div
                        className={`p-2 sm:p-2.5 rounded-full flex-shrink-0 mt-0.5 ${
                          isCredit
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-semibold text-sm text-white group-hover:text-[#FFD3AC] transition">
                            {LEDGER_TYPE_LABELS[entry.type] || entry.type}
                          </span>
                          <span
                            className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${
                              isCredit
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Subtitle / Details */}
                        <p className="text-xs text-white/60 mt-1 break-words">
                          {metadata.patient_name
                            ? `Patient: ${metadata.patient_name}`
                            : metadata.reason || entry.notes || 'Transaction record'}
                          {metadata.duration_seconds ? (
                            <span className="inline-block sm:inline ml-0 sm:ml-2 text-white/40">
                              • Duration: {formatWorkedSeconds(metadata.duration_seconds)}
                            </span>
                          ) : null}
                        </p>

                        <p className="text-[11px] text-white/40 mt-0.5">
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

                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm sm:text-base font-bold whitespace-nowrap tabular-nums ${
                          isCredit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'}{formatCents(entry.amount_cents)}
                      </div>
                      <span className="text-[11px] text-white/50 group-hover:text-[#FFD3AC] whitespace-nowrap hidden sm:inline-block">
                        View details →
                      </span>
                      <span className="text-[10px] text-white/50 group-hover:text-[#FFD3AC] whitespace-nowrap sm:hidden block mt-0.5">
                        Details →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="p-4 border-t border-white/10 text-center bg-white/5">
              <button
                onClick={() => loadLedger(false)}
                disabled={ledgerLoading}
                className="px-6 py-2 text-xs font-semibold text-[#FFD3AC] hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition disabled:opacity-50 cursor-pointer"
              >
                {ledgerLoading ? 'Loading...' : 'Load More Transactions'}
              </button>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1E1E1E] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/20 relative space-y-6 animate-scale-up text-white">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Transaction Details</h3>
                  <p className="text-xs text-white/50 font-mono mt-0.5">
                    ID: {selectedEntry.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Amount Banner */}
              <div
                className={`p-5 rounded-xl border text-center ${
                  selectedEntry.direction === 'credit'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
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
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/60">Date & Time</span>
                  <span className="font-medium text-white">
                    {toDate(selectedEntry.created_at)?.toLocaleString() || '—'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/60">Direction</span>
                  <span className="font-medium capitalize text-white">
                    {selectedEntry.direction}
                  </span>
                </div>

                {selectedEntry.metadata?.patient_name && (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-white/60">Patient</span>
                    <span className="font-medium text-white">
                      {selectedEntry.metadata.patient_name}
                    </span>
                  </div>
                )}

                {selectedEntry.metadata?.duration_seconds ? (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-white/60">Call Duration</span>
                    <span className="font-medium text-white">
                      {formatWorkedSeconds(selectedEntry.metadata.duration_seconds)}
                    </span>
                  </div>
                ) : null}

                {selectedEntry.metadata?.consultation_id && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10 gap-2">
                    <span className="text-white/60 shrink-0">Consultation ID</span>
                    <span className="font-mono text-xs text-white/80 break-all text-right">
                      {selectedEntry.metadata.consultation_id}
                    </span>
                  </div>
                )}

                {selectedEntry.metadata?.appointment_id && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10 gap-2">
                    <span className="text-white/60 shrink-0">Appointment ID</span>
                    <span className="font-mono text-xs text-white/80 break-all text-right">
                      {selectedEntry.metadata.appointment_id}
                    </span>
                  </div>
                )}

                {selectedEntry.metadata?.reason && (
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-white/60">Reason / Notes</span>
                    <span className="font-medium text-white">
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
                      className="inline-flex items-center space-x-2 text-xs font-semibold text-[#FFD3AC] hover:underline"
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
                  className="w-full py-3 bg-[#FFD3AC] hover:bg-[#FFD3AC]/90 text-[#1E1E1E] rounded-full text-sm font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WebLayoutWrapper>
  );
}
