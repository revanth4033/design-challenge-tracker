import { useEffect, useState } from "react";

/**
 * Returns true only after the component has mounted on the client.
 * Used to gate rendering of persisted (localStorage) + time-based data so the
 * server-rendered HTML and the first client render always match.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
