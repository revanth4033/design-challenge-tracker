"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileCheck2,
  CheckCircle2,
  XCircle,
  UserX,
  RotateCcw,
  Trash2,
  AlertTriangle,
  AlarmClockOff,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useClock, useTracker } from "@/lib/store";
import { useMounted } from "@/lib/use-mounted";
import { alertLevel, effectiveStatus, formatDateTime } from "@/lib/time";
import type { StoredStatus } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Countdown } from "@/components/countdown";
import { StartButton } from "@/components/start-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STATUS_ACTIONS: {
  status: StoredStatus;
  label: string;
  icon: typeof FileCheck2;
  variant?: "default" | "outline" | "destructive";
}[] = [
  { status: "SUBMITTED", label: "Mark Submitted", icon: FileCheck2, variant: "default" },
  { status: "SELECTED", label: "Mark Selected", icon: CheckCircle2, variant: "outline" },
  { status: "REJECTED", label: "Mark Rejected", icon: XCircle, variant: "outline" },
  { status: "ABSENT", label: "Mark Absent", icon: UserX, variant: "outline" },
];

export function CandidateDetail({ id }: { id: string }) {
  const router = useRouter();
  const mounted = useMounted();
  const candidate = useTracker((s) => s.candidates.find((c) => c.id === id));
  const challenges = useTracker((s) => s.challenges);
  const setStatusAction = useTracker((s) => s.setStatus);
  const clearStatusAction = useTracker((s) => s.clearStatus);
  const deleteCandidate = useTracker((s) => s.deleteCandidate);
  const now = useClock((s) => s.now);
  const reference = now || Date.now();

  function setStatus(status: StoredStatus) {
    setStatusAction(id, status);
    toast.success(`Marked ${status.toLowerCase().replace("_", " ")}`);
  }

  function clearStatus() {
    clearStatusAction(id);
    toast.success("Status cleared");
  }

  function remove() {
    if (!confirm("Delete this candidate? This cannot be undone.")) return;
    deleteCandidate(id);
    toast.success("Candidate deleted");
    router.push("/");
  }

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>
    );
  }
  if (!candidate) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-muted-foreground">Candidate not found.</p>
        <Button render={<Link href="/" />} variant="link" className="px-0">
          Back to dashboard
        </Button>
      </div>
    );
  }

  const eff = effectiveStatus(candidate.status, candidate.endsAt, reference);
  const alert = alertLevel(candidate.status, candidate.endsAt, reference);
  const notStarted = candidate.status === "NOT_STARTED" || candidate.status === "ABSENT";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <Button
          render={<Link href="/" />}
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
            <StatusBadge status={candidate.status} endsAt={candidate.endsAt} />
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={remove}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {candidate.designation ?? "—"} · {candidate.batch ?? "No batch"}
        </p>
      </div>

      {/* Alerts */}
      {alert === "expired" && (
        <AlertBanner
          tone="red"
          icon={AlarmClockOff}
          title="Time completed"
          message="The 5-hour window has expired. Mark the candidate's outcome below."
        />
      )}
      {alert === "critical" && (
        <AlertBanner
          tone="amber"
          icon={AlertTriangle}
          title="Less than 30 minutes left"
          message="This candidate is approaching the end of their challenge window."
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Challenge / timer */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Challenge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Info label="Challenge Type" value={candidate.challenge?.name ?? "Unassigned"} />
            <Separator />
            <div>
              <div className="text-xs font-medium text-muted-foreground">Remaining Time</div>
              <div className="mt-1">
                {candidate.status === "RUNNING" ? (
                  <Countdown status={candidate.status} endsAt={candidate.endsAt} size="lg" />
                ) : (
                  <span className="text-lg font-medium text-muted-foreground">
                    {eff === "COMPLETED" ? "Time up" : "Not running"}
                  </span>
                )}
              </div>
            </div>
            <Info label="Started At" value={formatDateTime(candidate.startedAt)} />
            <Info label="Ends At" value={formatDateTime(candidate.endsAt)} />

            {notStarted && (
              <div className="pt-1">
                <StartButton candidate={candidate} challenges={challenges} size="default" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidate info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Candidate information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Info label="Email" value={candidate.email || "—"} />
            <Info label="Mobile Number" value={candidate.mobile || "—"} />
            <Info label="Current Designation" value={candidate.designation ?? "—"} />
            <Info label="Location" value={candidate.location ?? "—"} />
            <Info label="Total Experience" value={candidate.totalExperience ?? "—"} />
            <Info label="Relevant Experience" value={candidate.relevantExperience ?? "—"} />
            <Info label="Notice Period" value={candidate.noticePeriod ?? "—"} />
            <Info label="Batch" value={candidate.batch ?? "—"} />
            <LinkInfo label="Portfolio" value={candidate.portfolioUrl} />
            <LinkInfo label="Resume" value={candidate.resumeUrl} />
          </CardContent>
        </Card>
      </div>

      {/* Status controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {STATUS_ACTIONS.map((a) => {
            const Icon = a.icon;
            const active = candidate.status === a.status;
            return (
              <Button
                key={a.status}
                variant={active ? "default" : (a.variant ?? "outline")}
                disabled={active}
                onClick={() => setStatus(a.status)}
              >
                <Icon className="size-3.5" />
                {a.label}
              </Button>
            );
          })}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            variant="ghost"
            className="text-muted-foreground"
            disabled={!["SUBMITTED", "SELECTED", "REJECTED", "ABSENT"].includes(candidate.status)}
            onClick={clearStatus}
          >
            <RotateCcw className="size-3.5" />
            Clear
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}

function LinkInfo({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {value ? (
        <a
          href={/^https?:\/\//.test(value) ? value : `https://${value}`}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline break-all"
        >
          {value}
          <ExternalLink className="size-3 shrink-0" />
        </a>
      ) : (
        <div className="mt-0.5 text-sm text-muted-foreground">—</div>
      )}
    </div>
  );
}

function AlertBanner({
  tone,
  icon: Icon,
  title,
  message,
}: {
  tone: "red" | "amber";
  icon: typeof AlertTriangle;
  title: string;
  message: string;
}) {
  const styles =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${styles}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm opacity-90">{message}</div>
      </div>
    </div>
  );
}
