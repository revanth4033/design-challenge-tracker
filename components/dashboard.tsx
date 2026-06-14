"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { useClock, useTracker, useDashboardUi, type StatusFilter } from "@/lib/store";
import { exportCandidatesToExcel } from "@/lib/export-excel";
import { useMounted } from "@/lib/use-mounted";
import {
  alertLevel,
  compareCandidates,
  effectiveStatus,
  formatTime,
} from "@/lib/time";
import { STATUS_FILTER_OPTIONS } from "@/lib/status-display";
import type { StatsDTO } from "@/lib/types";
import { StatCards } from "@/components/stat-cards";
import { StatusBadge } from "@/components/status-badge";
import { Countdown } from "@/components/countdown";
import { StartButton } from "@/components/start-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const router = useRouter();
  const mounted = useMounted();
  const candidates = useTracker((s) => s.candidates);
  const challenges = useTracker((s) => s.challenges);
  const loaded = useTracker((s) => s.loaded);
  const error = useTracker((s) => s.error);
  const ready = mounted && loaded;

  const { search, statusFilter, batchFilter, sortBy, setSearch, setStatusFilter, setBatchFilter } =
    useDashboardUi();
  const now = useClock((s) => s.now);
  const reference = now || Date.now();

  const batches = useMemo(
    () =>
      Array.from(new Set(candidates.map((c) => c.batch).filter(Boolean) as string[])).sort(),
    [candidates],
  );

  const stats = useMemo<StatsDTO>(() => {
    const s: StatsDTO = {
      total: candidates.length,
      running: 0,
      completed: 0,
      submitted: 0,
      selected: 0,
      rejected: 0,
      absent: 0,
      notStarted: 0,
    };
    for (const c of candidates) {
      const eff = effectiveStatus(c.status, c.endsAt, reference);
      if (eff === "RUNNING") s.running++;
      else if (eff === "COMPLETED") s.completed++;
      else if (eff === "SUBMITTED") s.submitted++;
      else if (eff === "SELECTED") s.selected++;
      else if (eff === "REJECTED") s.rejected++;
      else if (eff === "ABSENT") s.absent++;
      else if (eff === "NOT_STARTED") s.notStarted++;
    }
    return s;
  }, [candidates, reference]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates
      .filter((c) => {
        if (q) {
          const hay = `${c.name} ${c.email} ${c.mobile}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (statusFilter !== "ALL") {
          const eff = effectiveStatus(c.status, c.endsAt, reference);
          if (eff !== statusFilter) return false;
        }
        if (batchFilter !== "ALL" && c.batch !== batchFilter) return false;
        return true;
      })
      .sort((a, b) => compareCandidates(a, b, sortBy));
  }, [candidates, search, statusFilter, batchFilter, sortBy, reference]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live tracking for all design challenges.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!ready || visible.length === 0}
            onClick={() => {
              exportCandidatesToExcel(visible, reference);
              toast.success(
                `Exported ${visible.length} candidate${visible.length === 1 ? "" : "s"}`,
              );
            }}
          >
            <Download className="size-3.5" />
            Export
          </Button>
          <Button render={<Link href="/candidates/new" />} size="sm">
            Add candidate
          </Button>
        </div>
      </header>

      <StatCards stats={ready ? stats : null} />

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v as StatusFilter) ?? "ALL")}>
          <SelectTrigger className="sm:w-44">
            <SelectValue>
              {(v: string | null) =>
                STATUS_FILTER_OPTIONS.find((o) => o.value === v)?.label ?? "All statuses"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={batchFilter} onValueChange={(v) => setBatchFilter(v ?? "ALL")}>
          <SelectTrigger className="sm:w-40">
            <SelectValue>
              {(v: string | null) => (v && v !== "ALL" ? v : "All batches")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Candidate</TableHead>
              <TableHead>Challenge</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!ready ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {mounted && error ? (
                    <span className="text-red-600">{error}</span>
                  ) : (
                    "Loading…"
                  )}
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No candidates match your filters.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((c) => {
                const alert = alertLevel(c.status, c.endsAt, reference);
                return (
                  <TableRow
                    key={c.id}
                    onClick={() => router.push(`/candidates/${c.id}`)}
                    className={cn(
                      "cursor-pointer",
                      alert === "expired" &&
                        "bg-red-50/60 hover:bg-red-50 dark:bg-red-950/40 dark:hover:bg-red-950/60",
                      alert === "critical" &&
                        "bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/40 dark:hover:bg-amber-950/55",
                    )}
                  >
                    <TableCell>
                      <Link
                        href={`/candidates/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {c.email || c.mobile || c.batch || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.challenge?.name ?? (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.batch ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTime(c.startedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTime(c.endsAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {alert === "critical" && (
                          <AlertTriangle className="size-3.5 text-amber-500" />
                        )}
                        <Countdown status={c.status} endsAt={c.endsAt} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} endsAt={c.endsAt} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.status === "NOT_STARTED" && (
                          <StartButton candidate={c} challenges={challenges} />
                        )}
                        <Button
                          render={<Link href={`/candidates/${c.id}`} />}
                          variant="ghost"
                          size="sm"
                        >
                          View
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {ready ? `Showing ${visible.length} of ${candidates.length} candidates · ` : ""}
          Timers update every second and are calculated from stored start times. Synced live across
          all devices.
        </p>
        <p className="border-t pt-4 text-center text-base text-muted-foreground">
          Designed &amp; developed by{" "}
          <a
            href="https://www.linkedin.com/in/revanth-banisetti-9401ba21a/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            Revanth Banisetti
          </a>{" "}
          (UI Designer @ Lollypop Design Studio)
        </p>
      </div>
    </div>
  );
}
