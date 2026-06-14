"use client";

import { Users, Play, AlarmClockOff, CheckCircle2, XCircle, UserX } from "lucide-react";
import type { StatsDTO } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CARDS: {
  key: keyof StatsDTO;
  label: string;
  icon: typeof Users;
  accent: string;
}[] = [
  { key: "total", label: "Total Candidates", icon: Users, accent: "text-foreground" },
  { key: "absent", label: "Absent", icon: UserX, accent: "text-zinc-500" },
  { key: "running", label: "Running", icon: Play, accent: "text-emerald-600" },
  { key: "completed", label: "Time Up", icon: AlarmClockOff, accent: "text-red-600" },
  { key: "selected", label: "Selected", icon: CheckCircle2, accent: "text-emerald-600" },
  { key: "rejected", label: "Rejected", icon: XCircle, accent: "text-red-600" },
];

export function StatCards({ stats }: { stats: StatsDTO | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="rounded-xl border bg-background p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <Icon className={cn("size-4", card.accent)} />
            </div>
            {stats ? (
              <div className="mt-2 text-2xl font-semibold tabular-nums">{stats[card.key]}</div>
            ) : (
              <Skeleton className="mt-2 h-8 w-10" />
            )}
          </div>
        );
      })}
    </div>
  );
}
