"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTracker } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FieldDef {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  full?: boolean;
}

const FIELDS: FieldDef[] = [
  { name: "name", label: "Candidate Name", required: true, placeholder: "Jane Doe" },
  { name: "email", label: "Email", type: "email", placeholder: "jane@example.com" },
  { name: "mobile", label: "Mobile Number", placeholder: "9876543210" },
  { name: "designation", label: "Current Designation", placeholder: "Senior UX Designer" },
  { name: "totalExperience", label: "Total Experience", placeholder: "6 yrs" },
  { name: "relevantExperience", label: "Relevant Experience", placeholder: "4 yrs" },
  { name: "location", label: "Location", placeholder: "Hyderabad" },
  { name: "noticePeriod", label: "Notice Period", placeholder: "30 days" },
  { name: "portfolioUrl", label: "Portfolio URL", placeholder: "https://…", full: true },
  { name: "resumeUrl", label: "Resume URL", placeholder: "https://…", full: true },
  { name: "batch", label: "Batch", placeholder: "Batch 1" },
];

export function AddCandidateForm() {
  const router = useRouter();
  const challenges = useTracker((s) => s.challenges);
  const addCandidate = useTracker((s) => s.addCandidate);
  const [challengeId, setChallengeId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});

  function update(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name?.trim()) {
      toast.error("Candidate name is required");
      return;
    }
    const created = addCandidate({
      ...values,
      name: values.name ?? "",
      challengeId: challengeId || null,
    });
    toast.success(`${created.name} added`);
    router.push(`/candidates/${created.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
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
        <h1 className="text-xl font-semibold tracking-tight">Add candidate</h1>
        <p className="text-sm text-muted-foreground">
          Create a candidate record. You can start their 5-hour challenge from here or the
          dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Candidate details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.name} className={f.full ? "sm:col-span-2" : undefined}>
                <Label htmlFor={f.name} className="mb-1.5">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </Label>
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => update(f.name, e.target.value)}
                  required={f.required}
                />
              </div>
            ))}

            <div className="sm:col-span-2">
              <Label className="mb-1.5">Challenge Type</Label>
              <Select value={challengeId} onValueChange={(v) => setChallengeId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a challenge (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {challenges.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                The timer only starts when you click “Start Challenge”.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Button render={<Link href="/" />} variant="outline" type="button">
            Cancel
          </Button>
          <Button type="submit">Add candidate</Button>
        </div>
      </form>
    </div>
  );
}
