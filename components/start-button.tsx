"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { CandidateDTO, ChallengeDTO } from "@/lib/types";

interface StartButtonProps {
  candidate: CandidateDTO;
  challenges: ChallengeDTO[];
  onStarted: (updated: CandidateDTO) => void;
  size?: "sm" | "default";
}

export function StartButton({ candidate, challenges, onStarted, size = "sm" }: StartButtonProps) {
  const [open, setOpen] = useState(false);
  const [challengeId, setChallengeId] = useState(candidate.challengeId ?? "");
  const [loading, setLoading] = useState(false);

  async function start(withChallengeId: string) {
    setLoading(true);
    try {
      const updated = await api.startChallenge(candidate.id, withChallengeId);
      onStarted(updated);
      toast.success(`Challenge started for ${updated.name}`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start challenge");
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    // If a challenge is already assigned, start immediately; otherwise ask.
    if (candidate.challengeId) {
      void start(candidate.challengeId);
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <Button size={size === "sm" ? "sm" : "default"} onClick={handleClick} disabled={loading}>
        <Play className="size-3.5" />
        Start
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start challenge</DialogTitle>
            <DialogDescription>
              Choose a challenge type for {candidate.name}. The 5-hour timer starts immediately.
            </DialogDescription>
          </DialogHeader>
          <Select value={challengeId} onValueChange={(v) => setChallengeId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select challenge type" />
            </SelectTrigger>
            <SelectContent>
              {challenges.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!challengeId || loading} onClick={() => start(challengeId)}>
              <Play className="size-3.5" />
              Start timer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
