"use client";

import { useEffect } from "react";
import { useTracker } from "@/lib/store";

/**
 * Keeps this device in sync with the shared database: fetches on mount and
 * re-polls every few seconds, so status changes made on other laptops appear
 * here automatically.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const sync = useTracker((s) => s.syncFromServer);

  useEffect(() => {
    void sync();
    const id = setInterval(() => void sync(), 5000);
    const onFocus = () => void sync();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [sync]);

  return <>{children}</>;
}
