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
import { useTracker } from "@/lib/store";
import type { CandidateDTO, ChallengeDTO } from "@/lib/types";

interface StartButtonProps {
  candidate: CandidateDTO;
  challenges: ChallengeDTO[];
  size?: "sm" | "default";
}

export function StartButton({ candidate, challenges, size = "sm" }: StartButtonProps) {
  const startChallenge = useTracker((s) => s.startChallenge);
  const [open, setOpen] = useState(false);
  const [challengeId, setChallengeId] = useState(candidate.challengeId ?? "");

  function start(withChallengeId: string) {
    startChallenge(candidate.id, withChallengeId);
    toast.success(`Challenge started for ${candidate.name}`);
    setOpen(false);
  }

  function handleClick() {
    if (candidate.challengeId) start(candidate.challengeId);
    else setOpen(true);
  }

  return (
    <>
      <Button size={size === "sm" ? "sm" : "default"} onClick={handleClick}>
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
            <Button disabled={!challengeId} onClick={() => start(challengeId)}>
              <Play className="size-3.5" />
              Start timer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
