"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, ChevronRight, AlertTriangle } from "lucide-react";
import {
  useClock,
  useTracker,
  useDashboardUi,
  type SortKey,
  type StatusFilter,
} from "@/lib/store";
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

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "remaining", label: "Remaining time" },
  { value: "startTime", label: "Start time" },
  { value: "endTime", label: "End time" },
  { value: "name", label: "Name" },
];

export function Dashboard() {
  const mounted = useMounted();
  const candidates = useTracker((s) => s.candidates);
  const challenges = useTracker((s) => s.challenges);

  const { search, statusFilter, sortBy, setSearch, setStatusFilter, setSortBy } =
    useDashboardUi();
  const now = useClock((s) => s.now);
  const reference = now || Date.now();

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
        return true;
      })
      .sort((a, b) => compareCandidates(a, b, sortBy));
  }, [candidates, search, statusFilter, sortBy, reference]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live tracking for all design challenges.
          </p>
        </div>
        <Button render={<Link href="/candidates/new" />} size="sm">
          Add candidate
        </Button>
      </header>

      <StatCards stats={mounted ? stats : null} />

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
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy((v as SortKey) ?? "remaining")}>
          <SelectTrigger className="sm:w-44">
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
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
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!mounted ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No candidates match your filters.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((c) => {
                const alert = alertLevel(c.status, c.endsAt, reference);
                return (
                  <TableRow
                    key={c.id}
                    className={cn(
                      alert === "expired" && "bg-red-50/60 hover:bg-red-50",
                      alert === "critical" && "bg-amber-50/60 hover:bg-amber-50",
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
                      <div className="flex items-center justify-end gap-2">
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

      <p className="text-xs text-muted-foreground">
        {mounted ? `Showing ${visible.length} of ${candidates.length} candidates · ` : ""}
        Timers update every second and are calculated from stored start times. All data is saved in
        this browser.
      </p>
    </div>
  );
}
