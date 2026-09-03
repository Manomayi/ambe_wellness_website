'use client';

/**
 * Compact "Consultation Rates" strip for the doctor earnings page.
 *
 * Deliberately small: three rate chips on one line, with the explanations
 * hidden behind a "Details" toggle so the strip does not compete with the
 * balance cards above it. Rates come from `admin_settings/general` (the same
 * source the ledger uses) rather than being hardcoded, so an admin rate change
 * shows up here without a release.
 */

import React, { useEffect, useState } from 'react';
import { ChevronDownIcon, ScaleIcon } from '@heroicons/react/24/outline';
import {
  DEFAULT_EARNINGS_POLICY,
  fetchEarningsPolicy,
  formatCents,
} from '@/lib/doctorEarnings';

export default function EarningsPolicyStrip() {
  const [policy, setPolicy] = useState(DEFAULT_EARNINGS_POLICY);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchEarningsPolicy().then((next) => {
      if (!cancelled) setPolicy(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    {
      key: 'consultation',
      label: 'Consultation',
      amount: `+${formatCents(policy.consultationEarningCents)}`,
      tone: 'text-emerald-700',
      detail:
        'Paid for each consultation where you and the patient both join and complete the video call.',
    },
    {
      key: 'no-show',
      label: 'Patient no-show',
      amount: `+${formatCents(policy.noShowEarningCents)}`,
      tone: 'text-blue-700',
      detail:
        'Paid when you join on time but the patient does not attend. If you do not join, nothing is earned.',
    },
    {
      key: 'late-cancel',
      label: 'Late cancellation',
      amount: `-${formatCents(policy.lateCancellationFineCents)}`,
      tone: 'text-amber-700',
      detail: `Charged when you cancel with less than ${policy.lateCancellationWindowHours} hours notice (${policy.lateCancellationFinePercent}% of the ${formatCents(policy.hourlyRateCents)} base rate). Cancelling ${policy.lateCancellationWindowHours} hours or more ahead carries no fine.`,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E7E2D9] shadow-sm px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2 text-[#6B6862] shrink-0">
          <ScaleIcon className="h-4 w-4 text-[#C8996A]" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Consultation Rates
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 flex-1 min-w-0">
          {items.map((item) => (
            <div key={item.key} className="flex items-baseline gap-1.5">
              <span className={`text-sm font-bold tabular-nums ${item.tone}`}>
                {item.amount}
              </span>
              <span className="text-xs text-[#8C827A]">{item.label}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-1 text-xs font-medium text-[#6B6862] hover:text-[#1A1A1A] transition-colors shrink-0"
        >
          Details
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && (
        <ul className="mt-3 pt-3 border-t border-[#E7E2D9]/70 space-y-2">
          {items.map((item) => (
            <li key={item.key} className="text-xs leading-relaxed text-[#6B6862]">
              <span className={`font-semibold ${item.tone}`}>
                {item.amount} {item.label}
              </span>
              {' — '}
              {item.detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
