"use client";

import { useClock } from "@/lib/store";
import { alertLevel, effectiveStatus } from "@/lib/time";
import { statusDisplay } from "@/lib/status-display";
import type { StoredStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: StoredStatus;
  endsAt: string | null;
  className?: string;
}

/** Live status badge — recolors as a running candidate crosses thresholds. */
export function StatusBadge({ status, endsAt, className }: StatusBadgeProps) {
  const now = useClock((s) => s.now);
  const reference = now || Date.now();
  const eff = effectiveStatus(status, endsAt, reference);
  const alert = alertLevel(status, endsAt, reference);
  const { label, className: colorClass } = statusDisplay(eff, alert);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
