"use client";

import { useClock } from "@/lib/store";
import { alertLevel, formatCountdown, remainingMs } from "@/lib/time";
import type { StoredStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CountdownProps {
  status: StoredStatus;
  endsAt: string | null;
  className?: string;
  /** Larger styling for the detail page. */
  size?: "sm" | "lg";
}

/**
 * Live countdown derived from the stored endsAt timestamp.
 * Never accumulates time in the browser, so it survives refresh / restart.
 */
export function Countdown({ status, endsAt, className, size = "sm" }: CountdownProps) {
  const now = useClock((s) => s.now);
  const reference = now || Date.now();

  // Only running challenges have a meaningful live countdown.
  if (status !== "RUNNING" || !endsAt) {
    return (
      <span className={cn("font-mono tabular-nums text-muted-foreground", className)}>—</span>
    );
  }

  const ms = remainingMs(endsAt, reference);
  const alert = alertLevel(status, endsAt, reference);
  const expired = (ms ?? 0) <= 0;

  const color = expired
    ? "text-red-600"
    : alert === "critical"
      ? "text-amber-600"
      : alert === "warning"
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <span
      className={cn(
        "font-mono font-semibold tabular-nums",
        size === "lg" ? "text-3xl" : "text-sm",
        color,
        className,
      )}
    >
      {formatCountdown(ms)}
    </span>
  );
}
