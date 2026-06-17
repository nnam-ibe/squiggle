"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PickStep } from "@/components/PickStep";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Catalog } from "@/server/catalog";
import type { PreviewResult } from "@/upload/preview";

const STEPS = ["Pick", "File", "Preview", "Confirm"] as const;
const RED = "#ff6b6b";

export function UploadWizard({ catalog }: { catalog: Catalog }) {
  const router = useRouter();
  // Upload is soccer-only for now (the commit/validate routes are soccer-only).
  const sports = catalog.sports.filter((s) => s.id === "soccer");

  const [step, setStep] = useState(0); // 0..3
  const [leagueId, setLeagueId] = useState(sports[0]?.leagues[0]?.id ?? "");
  const [season, setSeason] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const sport = sports[0];
  const league = sport?.leagues.find((l) => l.id === leagueId) ?? sport?.leagues[0];
  const seasonObj = league?.seasons.find((s) => s.season === season) ?? null;
  const willReplace = !!seasonObj?.hasData;

  function form() {
    const fd = new FormData();
    fd.append("file", file!);
    fd.append("leagueId", leagueId);
    fd.append("season", season!);
    return fd;
  }

  async function runValidate() {
    if (!file || !season) return;
    setBusy(true);
    try {
      const res = await fetch("/api/datasets/validate", { method: "POST", body: form() });
      setPreview((await res.json()) as PreviewResult);
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    if (!file || !season) return;
    setBusy(true);
    setCommitError(null);
    try {
      const res = await fetch("/api/datasets", { method: "POST", body: form() });
      const data = await res.json();
      if (data.ok && data.permalink) {
        router.push(data.permalink);
        return;
      }
      setCommitError(data.errors?.[0]?.message ?? "Upload failed. Please try again.");
    } catch {
      setCommitError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const canPreview = !!file && !!season && !busy;
  const hasErrors = !!preview && !preview.ok;

  return (
    <div className="mx-auto max-w-[680px] px-[18px] pb-[60px] pt-[22px]">
      <header className="mb-[26px] flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back to home"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-field border-[1.5px] border-line bg-panel text-fg2 transition-colors hover:border-line2 hover:text-fg"
        >
          <Icon name="back" size={20} />
        </Link>
        <span className="font-head text-[17px] font-extrabold tracking-[-0.01em]">Upload data</span>
        <ThemeToggle />
      </header>

      {/* step indicator */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`flex size-[22px] flex-none items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                  active
                    ? "bg-accent text-acc-ink"
                    : done
                      ? "bg-[color-mix(in_oklab,var(--accent)_22%,var(--panel))] text-accent"
                      : "border border-line bg-panel2 text-fg3"
                }`}
              >
                {i + 1}
              </span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.1em] ${active ? "text-fg" : "text-fg3"}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
            </li>
          );
        })}
      </ol>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <PickStep
            n={1}
            label="League"
            value={leagueId}
            onPick={(id) => {
              setLeagueId(id);
              setSeason(null);
            }}
            options={(sport?.leagues ?? []).map((l) => ({ id: l.id, name: l.name, meta: l.country }))}
          />
          <PickStep
            n={2}
            label="Season"
            value={season ?? ""}
            onPick={setSeason}
            options={(league?.seasons ?? []).map((s) => ({
              id: s.season,
              name: s.season,
              meta: s.hasData ? "has data" : null,
            }))}
          />
        </div>
      )}

      {step === 1 && (
        <FileStep file={file} onFile={setFile} />
      )}

      {step === 2 && preview && <PreviewStep preview={preview} />}

      {step === 3 && (
        <ConfirmStep
          league={league?.name ?? ""}
          season={season ?? ""}
          willReplace={willReplace}
          rounds={preview?.roundsPresent ?? 0}
          error={commitError}
        />
      )}

      {/* footer nav */}
      <div className="mt-7 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || busy}
          className="rounded-field border-[1.5px] border-line bg-panel px-5 py-3 font-head text-[14px] font-bold text-fg2 transition-colors hover:border-line2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>

        {step === 0 && (
          <NextButton disabled={!season} onClick={() => setStep(1)}>
            Next
          </NextButton>
        )}
        {step === 1 && (
          <NextButton disabled={!canPreview} onClick={runValidate}>
            {busy ? "Checking…" : "Preview"}
          </NextButton>
        )}
        {step === 2 && (
          <NextButton disabled={hasErrors} onClick={() => setStep(3)} title={hasErrors ? "Fix the errors first" : undefined}>
            Continue
          </NextButton>
        )}
        {step === 3 && (
          <NextButton disabled={busy} onClick={runCommit}>
            {busy ? "Uploading…" : willReplace ? "Replace & open" : "Upload & open"}
            <Icon name="chev" size={16} />
          </NextButton>
        )}
      </div>
    </div>
  );
}

function NextButton({
  children,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-2 rounded-field bg-accent px-[22px] py-3 font-head text-[15px] font-extrabold text-acc-ink transition-[filter,transform] hover:brightness-[1.06] active:translate-y-px disabled:cursor-not-allowed disabled:bg-panel2 disabled:text-fg3 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

function FileStep({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-panel border-[1.5px] border-dashed px-6 py-12 text-center transition-colors ${
          drag ? "border-accent bg-[color-mix(in_oklab,var(--accent)_8%,var(--panel))]" : "border-line2 bg-panel"
        }`}
      >
        <span className="text-fg3">
          <Icon name="upload" size={28} />
        </span>
        {file ? (
          <span className="font-head text-[15px] font-bold">{file.name}</span>
        ) : (
          <>
            <span className="font-head text-[15.5px] font-bold">Drop your CSV here</span>
            <span className="text-[13px] text-fg2">or click to browse · max 2 MB / 5,000 rows</span>
          </>
        )}
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {/* A real file download from an API route (attachment), not page navigation. */}
      <a
        href="/api/datasets/template"
        download
        className="self-start font-mono text-[12.5px] text-accent underline-offset-2 hover:underline"
      >
        ↓ Download the CSV template
      </a>
    </div>
  );
}

function IssueList({ title, issues, color }: { title: string; issues: { code: string; message: string; row?: number }[]; color: string }) {
  if (!issues.length) return null;
  return (
    <div
      className="rounded-card border-[1.5px] px-4 py-3"
      style={{ borderColor: `color-mix(in oklab, ${color} 45%, transparent)`, background: `color-mix(in oklab, ${color} 10%, transparent)` }}
    >
      <div className="mb-2 font-head text-[13px] font-extrabold" style={{ color }}>
        {title} ({issues.length})
      </div>
      <ul className="flex flex-col gap-1">
        {issues.map((e, i) => (
          <li key={i} className="font-mono text-[12px] text-fg2">
            {e.row != null ? `Row ${e.row}: ` : ""}
            {e.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewStep({ preview }: { preview: PreviewResult }) {
  const table = preview.previewTable;
  return (
    <div className="flex flex-col gap-4">
      <IssueList title="Errors" issues={preview.errors} color={RED} />
      <IssueList title="Warnings" issues={preview.warnings} color="#e0894a" />

      {preview.ok && (
        <div className="font-mono text-[12px] text-fg2">
          {preview.rowCount} rows · {preview.roundsPresent} rounds · {preview.isComplete ? "complete" : "in progress"}
        </div>
      )}

      {table.length > 0 && (
        <div className="overflow-hidden rounded-panel border border-line bg-panel">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-fg3 [&>th]:px-2 [&>th]:py-[9px] [&>th]:font-mono [&>th]:text-[10.5px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-[0.06em]">
                <th className="text-right">#</th>
                <th className="text-left">Team</th>
                <th className="text-right">P</th>
                <th className="text-right">W</th>
                <th className="text-right">D</th>
                <th className="text-right">L</th>
                <th className="text-right">GD</th>
                <th className="text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="[&>tr>td]:px-2 [&>tr>td]:py-[7px] [&_td:not(:nth-child(2))]:font-mono [&_td:not(:nth-child(2))]:[font-variant-numeric:tabular-nums]">
              {table.map((r) => (
                <tr key={r.team} className="border-b border-line last:border-0">
                  <td className="text-right text-fg3">{r.position}</td>
                  <td className="font-head font-bold">{r.team}</td>
                  <td className="text-right text-fg2">{r.played}</td>
                  <td className="text-right text-fg2">{r.won}</td>
                  <td className="text-right text-fg2">{r.drawn}</td>
                  <td className="text-right text-fg2">{r.lost}</td>
                  <td className="text-right text-fg2">{r.gd >= 0 ? `+${r.gd}` : r.gd}</td>
                  <td className="text-right font-bold">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ConfirmStep({
  league,
  season,
  willReplace,
  rounds,
  error,
}: {
  league: string;
  season: string;
  willReplace: boolean;
  rounds: number;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-panel border border-line bg-panel p-5">
        <div className="font-head text-[16px] font-extrabold">
          {league} · {season}
        </div>
        <div className="mt-1 text-[13px] text-fg2">{rounds} rounds ready to chart.</div>
      </div>

      {willReplace && (
        <div
          className="rounded-card border-[1.5px] px-4 py-3"
          style={{ borderColor: "color-mix(in oklab, #e0894a 50%, transparent)", background: "color-mix(in oklab, #e0894a 10%, transparent)" }}
        >
          <div className="font-head text-[13px] font-extrabold" style={{ color: "#e0894a" }}>
            Replaces existing data
          </div>
          <div className="mt-1 text-[12.5px] text-fg2">
            A dataset already exists for {league} · {season}. Uploading replaces it.
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-card border-[1.5px] px-4 py-3 font-mono text-[12.5px]"
          style={{ borderColor: `color-mix(in oklab, ${RED} 45%, transparent)`, background: `color-mix(in oklab, ${RED} 10%, transparent)`, color: RED }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
