"use client";

import { useEffect } from "react";
import { useClock } from "@/lib/store";

/**
 * Mounts a single 1-second interval that updates the global clock.
 * Every countdown reads stored timestamps against this clock, so timers stay
 * correct across refresh / restart — the interval only triggers re-renders.
 */
export function ClockProvider({ children }: { children: React.ReactNode }) {
  const tick = useClock((s) => s.tick);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  return <>{children}</>;
}
