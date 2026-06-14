"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { parseWorkbook } from "@/lib/import-excel";
import { useTracker } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImportResult {
  created: number;
  skipped: number;
  batches: string[];
  total: number;
}

export function ImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importCandidates = useTracker((s) => s.importCandidates);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);

  function pick(f: File | null) {
    if (f && !/\.(xlsx|xls)$/i.test(f.name)) {
      toast.error("Please choose an .xlsx or .xls file");
      return;
    }
    setFile(f);
    setResult(null);
  }

  async function importFile() {
    if (!file) return;
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseWorkbook(buf);
      if (parsed.candidates.length === 0) {
        toast.error("No candidate rows found in the workbook.");
        return;
      }
      const { created, skipped } = importCandidates(
        parsed.candidates.map((c) => ({
          name: c.name,
          email: c.email,
          mobile: c.mobile,
          designation: c.designation,
          totalExperience: c.totalExperience,
          relevantExperience: c.relevantExperience,
          location: c.location,
          noticePeriod: c.noticePeriod,
          portfolioUrl: c.portfolioUrl,
          resumeUrl: c.resumeUrl,
          batch: c.batch,
          challengeName: c.challengeName,
          status: c.status,
        })),
      );
      setResult({ created, skipped, batches: parsed.batches, total: parsed.candidates.length });
      toast.success(`Imported ${created} candidate${created === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read the Excel file");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 md:p-6">
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
        <h1 className="text-xl font-semibold tracking-tight">Import from Excel</h1>
        <p className="text-sm text-muted-foreground">
          Upload your tracking workbook. Columns are mapped automatically, batch sheets are
          preserved, and challenge names are normalized. Everything stays in this browser.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload workbook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragging ? "border-foreground bg-muted/50" : "border-muted-foreground/25"
            }`}
          >
            <FileSpreadsheet className="size-7 text-muted-foreground" />
            {file ? (
              <div className="text-sm font-medium">{file.name}</div>
            ) : (
              <>
                <div className="text-sm font-medium">Click to choose or drag a file here</div>
                <div className="text-xs text-muted-foreground">.xlsx or .xls</div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex justify-end gap-2">
            {file && (
              <Button variant="outline" onClick={() => pick(null)} disabled={uploading}>
                Clear
              </Button>
            )}
            <Button onClick={importFile} disabled={!file || uploading}>
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Import candidates
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle2 className="mt-0.5 size-5 text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-1 text-sm">
              <div className="font-medium text-emerald-900 dark:text-emerald-300">
                Import complete
              </div>
              <ul className="text-emerald-800 dark:text-emerald-400/90">
                <li>{result.created} candidates imported</li>
                {result.skipped > 0 && <li>{result.skipped} skipped (already existed)</li>}
                {result.batches.length > 0 && <li>Batches: {result.batches.join(", ")}</li>}
              </ul>
              <Button render={<Link href="/" />} size="sm" className="mt-2">
                View dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
