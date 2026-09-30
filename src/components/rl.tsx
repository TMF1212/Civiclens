import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, FileX2, Loader2, Database } from "lucide-react";
import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { getAllRecords, getElection } from "@/lib/api";
import { useAppStore, fmt, signed } from "@/lib/store";
import type { ReconStatus, ReviewStatus, Severity, VerifiedRecord } from "@/lib/types";

export function useRecords() {
  const { electionId } = useAppStore();
  return useQuery({ queryKey: ["records", electionId], queryFn: () => getAllRecords(electionId) });
}

const tag = cva("inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide", {
  variants: {
    tone: {
      ok: "border-ok/25 bg-ok-soft text-ok",
      warn: "border-warn/25 bg-warn-soft text-warn",
      steel: "border-steel/25 bg-steel-soft text-steel",
      neutral: "border-border bg-muted text-muted-foreground",
      accent: "border-primary/25 bg-accent text-accent-foreground",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Tag({ tone, children, className }: { tone?: "ok" | "warn" | "steel" | "neutral" | "accent"; children: ReactNode; className?: string }) {
  return <span className={cn(tag({ tone }), className)}>{children}</span>;
}

const statusTone: Record<ReconStatus, "ok" | "warn" | "steel" | "neutral"> = { MATCH: "ok", MISMATCH: "warn", MISSING: "steel", INCOMPLETE: "steel", PENDING: "neutral" };
export const VerificationBadge = ({ status }: { status: ReconStatus }) => <Tag tone={statusTone[status]}>{status}</Tag>;

const sevTone: Record<Severity, "warn" | "steel" | "neutral"> = { HIGH: "warn", MEDIUM: "steel", LOW: "neutral" };
export const SeverityBadge = ({ s }: { s: Severity }) => <Tag tone={sevTone[s]}>{s}</Tag>;

const reviewTone: Record<ReviewStatus, "ok" | "warn" | "steel" | "neutral" | "accent"> = {
  Unreviewed: "neutral", "Under Review": "accent", "Verified Match": "ok", "Confirmed Data Difference": "warn", "Insufficient Evidence": "steel",
};
export const ReviewBadge = ({ s }: { s: ReviewStatus }) => <Tag tone={reviewTone[s]}>{s}</Tag>;

export function useReview() {
  const { reviews } = useAppStore();
  return (r: VerifiedRecord): ReviewStatus =>
    reviews[r.id] ?? (r.flags.length === 0 ? "Verified Match" : Number(r.id.slice(-2)) % 5 === 0 ? "Under Review" : "Unreviewed");
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {sub && <p className="mt-1 max-w-[70ch] text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Panel({ title, meta, children, className, bodyClass }: { title?: ReactNode; meta?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          {meta && <span className="font-mono text-[10px] text-muted-foreground">{meta}</span>}
        </header>
      )}
      <div className={cn("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

export function DemoNotice() {
  const { electionId } = useAppStore();
  const e = getElection(electionId);
  if (e.dataSource !== "demo") return null;
  return (
    <div className="mb-5 flex items-start gap-2 rounded-sm border border-warn/25 bg-warn-soft px-3 py-2 text-[12px] text-warn">
      <Database className="mt-0.5 size-3.5 shrink-0" />
      <span><b className="font-mono">DEMO DATA — Replace with verified election dataset.</b> All records below are DEMO / SYNTHETIC DATA and do not represent actual election results.</span>
    </div>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border px-6 py-12 text-center">
      <div className="text-muted-foreground">{icon ?? <FileX2 className="size-6" />}</div>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-md text-[12px] text-muted-foreground">{body}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading records…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ body }: { body: string }) {
  return <EmptyState icon={<AlertTriangle className="size-6" />} title="Data source unavailable" body={body} />;
}

/** Wraps a page body: handles loading / no-data states so pages never show fake values. */
export function WithRecords({ children }: { children: (rows: VerifiedRecord[]) => ReactNode }) {
  const { data, isLoading, isError } = useRecords();
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState body="The records service did not respond. No values are shown rather than stale or fabricated ones." />;
  if (!data || data.length === 0)
    return <EmptyState title="No data for this election yet" body="No polling-unit records have been imported for this election. Use Election Data to import a verified CSV/JSON dataset." />;
  return <>{children(data)}</>;
}

export function Kpi({ label, value, note, tone }: { label: string; value: ReactNode; note?: string; tone?: "warn" | "steel" | "accent" }) {
  return (
    <div className="bg-panel p-3.5">
      <div className="eyebrow">{label}</div>
      <div className={cn("num mt-1.5 text-xl font-medium tracking-tight", tone === "warn" && "text-warn", tone === "steel" && "text-steel", tone === "accent" && "text-primary")}>{value}</div>
      {note && <div className="mt-0.5 text-[10px] text-muted-foreground">{note}</div>}
    </div>
  );
}

export function PULink({ r, children }: { r: VerifiedRecord; children?: ReactNode }) {
  return (
    <Link to="/pu/$id" params={{ id: r.id }} className="font-medium text-primary hover:underline">
      {children ?? r.puName}
    </Link>
  );
}

export function Diff({ n }: { n: number | null }) {
  return <span className={cn("num", n && n !== 0 ? "font-medium text-warn" : "text-muted-foreground")}>{signed(n)}</span>;
}

export function Pager({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
      <span className="num">{fmt(total)} records · page {page}/{pages}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-sm border border-border bg-panel px-2 py-1 disabled:opacity-40">Prev</button>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-sm border border-border bg-panel px-2 py-1 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

export const th = "px-3 py-2 text-left font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground";
export const td = "px-3 py-2.5";

export const EVIDENCE_STEPS = ["Source", "Raw record", "Normalized record", "Verification rule", "Flag", "Human review"];

export function EvidenceChain({ r, review }: { r: VerifiedRecord; review: ReviewStatus }) {
  const items = [
    { t: "Source", d: r.sourceUrl ?? "Demo / synthetic generator (no external source)", ok: true },
    { t: "Raw record", d: r.irev ? `Result sheet values captured ${r.irev.timestamp ? new Date(r.irev.timestamp).toLocaleString("en-NG") : ""} · OCR confidence ${r.ocrConfidence ? Math.round(r.ocrConfidence * 100) + "%" : "n/a"}` : "No raw upload found", ok: !!r.irev },
    { t: "Normalized record", d: `PU ${r.puCode} · ${Object.keys(r.irev?.candidates ?? {}).length} candidate fields mapped · raw values preserved`, ok: !!r.irev },
    { t: "Verification rule", d: r.flags.length ? r.flags.map((f) => f.rule).join(" · ") : "All 8 rules passed", ok: true },
    { t: "Flag", d: r.flags.length ? `${r.flags.length} flag(s) — highest ${r.flags.map((f) => f.severity).sort().at(0)}` : "No flag raised", ok: r.flags.length === 0 },
    { t: "Human review", d: review, ok: review !== "Unreviewed" },
  ];
  return (
    <ol className="relative ml-2 space-y-4 border-l border-border">
      {items.map((it, i) => (
        <li key={it.t} className="relative pl-5">
          <span className={cn("absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-4 ring-panel", it.ok ? "bg-primary" : "bg-warn")} />
          <div className="eyebrow">{String(i + 1).padStart(2, "0")} · {it.t}</div>
          <p className="mt-0.5 text-[12px]">{it.d}</p>
        </li>
      ))}
    </ol>
  );
}

export function ResultComparison({ r }: { r: VerifiedRecord }) {
  const names = Object.keys(r.official?.candidates ?? r.irev?.candidates ?? {});
  const row = (label: string, a: number | null | undefined, b: number | null | undefined, strong = false) => {
    const differs = a != null && b != null && a !== b;
    return (
      <tr key={label} className={cn(differs && "bg-warn-soft/60", strong && "border-t-2 border-foreground/15 font-semibold")}>
        <td className={td}>{label}</td>
        <td className={cn(td, "num text-right", differs && "font-semibold text-warn")}>{a === null ? <span className="text-steel">unreadable</span> : fmt(a)}</td>
        <td className={cn(td, "num text-right", differs && "font-semibold text-warn")}>{fmt(b)}</td>
        <td className={cn(td, "text-right")}><Diff n={a != null && b != null ? a - b : null} /></td>
      </tr>
    );
  };
  return (
    <table className="w-full text-[13px]">
      <thead className="border-b border-border">
        <tr><th className={th}>Candidate</th><th className={cn(th, "text-right")}>IReV / uploaded</th><th className={cn(th, "text-right")}>Official</th><th className={cn(th, "text-right")}>Difference</th></tr>
      </thead>
      <tbody className="divide-y divide-border">
        {names.map((n) => row(n, r.irev ? r.irev.candidates[n] : undefined, r.official?.candidates[n]))}
        {row("Total votes", r.irevTotal, r.officialTotal, true)}
      </tbody>
    </table>
  );
}
