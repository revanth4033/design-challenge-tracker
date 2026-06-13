import type { AlertLevel } from "./time";
import type { EffectiveStatus } from "./types";

export interface StatusDisplay {
  label: string;
  className: string;
}

/**
 * Visual priority system from the spec:
 *  Running .............. green
 *  Running (< 1h left) .. orange
 *  Completed (expired) .. red
 *  Submitted ............ blue
 *  Selected ............. solid green (success)
 *  Rejected ............. red
 *  Absent ............... gray
 */
export function statusDisplay(
  effective: EffectiveStatus,
  alert: AlertLevel = "none",
): StatusDisplay {
  switch (effective) {
    case "RUNNING":
      if (alert === "critical" || alert === "warning") {
        return {
          label: "Running",
          className: "bg-amber-100 text-amber-700 border-amber-200",
        };
      }
      return {
        label: "Running",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case "COMPLETED":
      return {
        label: "Time Up",
        className: "bg-red-100 text-red-700 border-red-200",
      };
    case "SUBMITTED":
      return {
        label: "Submitted",
        className: "bg-blue-100 text-blue-700 border-blue-200",
      };
    case "SELECTED":
      return {
        label: "Selected",
        className: "bg-emerald-600 text-white border-emerald-600",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-red-100 text-red-700 border-red-200",
      };
    case "ABSENT":
      return {
        label: "Absent",
        className: "bg-zinc-200 text-zinc-600 border-zinc-300",
      };
    case "NOT_STARTED":
    default:
      return {
        label: "Not Started",
        className: "bg-zinc-100 text-zinc-500 border-zinc-200",
      };
  }
}

export const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "RUNNING", label: "Running" },
  { value: "COMPLETED", label: "Time Up" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "SELECTED", label: "Selected" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ABSENT", label: "Absent" },
  { value: "NOT_STARTED", label: "Not Started" },
];
