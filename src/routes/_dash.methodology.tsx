import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/rl";
import { RULES } from "@/lib/verification";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/_dash/methodology")({
  head: () => meta("Methodology", "How ResultLens NG acquires, normalizes, reconciles and validates election results — and its limitations."),
  component: Page,
});

const STEPS = [
  ["Data acquisition", "Polling-unit result sheets and officially announced/collated figures are collected from public sources. In demo mode, a synthetic generator stands in for these sources."],
  ["Data normalization", "Identifiers, names and candidate fields are standardised. Raw values are preserved alongside normalized values; nothing is silently overwritten."],
  ["Result reconciliation", "For each polling unit, the uploaded (IReV) total is compared with the official total, candidate by candidate."],
  ["Rule-based validation", "Eight transparent rules check totals, accreditation, internal consistency, completeness and duplicates."],
  ["Statistical anomaly detection", "Robust statistics (median / MAD) and ward-peer comparisons surface unusual turnout and spatial patterns. ML models can be added later."],
  ["Evidence preservation", "Every flag links to source, raw values, rule, reference value and timestamp, forming an evidence chain."],
  ["Human review", "Reviewers record a decision for each flag. The system never labels a record as fraud."],
];
const LIMITS = ["Source availability — not every polling unit publishes a result.", "OCR errors — extracted values can be wrong and must be reviewed.", "Incomplete data — missing fields reduce what can be checked.", "Differences in reporting formats across forms and elections.", "Statistical false positives — unusual is not the same as wrong.", "Every flag needs human verification before any conclusion."];

function Page() {
  return (
    <>
      <PageHeader title="Methodology" sub="How records are checked, and what the checks can and cannot tell you." />
      <div className="mb-5 rounded-sm border border-primary/25 bg-accent px-4 py-3 text-[13px] text-accent-foreground">
        <b>ResultLens NG identifies records that warrant verification. A discrepancy or anomaly is not, by itself, proof of electoral wrongdoing.</b>
      </div>
      <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-2">
        {STEPS.map(([t, d], i) => (
          <div key={t} className="bg-panel p-5"><div className="num text-[11px] text-primary">{String(i + 1).padStart(2, "0")}</div><h3 className="mt-1 text-[14px] font-semibold">{t}</h3><p className="mt-1 text-[13px] text-muted-foreground">{d}</p></div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Verification rules" bodyClass="p-0">
          <ul className="divide-y divide-border text-[12px]">{RULES.map((r, i) => <li key={r.code} className="flex gap-3 px-4 py-2"><span className="num text-muted-foreground">R{i + 1}</span><span className="font-medium">{r.name}</span><span className="ml-auto text-right text-muted-foreground">{r.test}</span></li>)}</ul>
          <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Severity (LOW / MEDIUM / HIGH) indicates verification priority, not evidence of wrongdoing.</p>
        </Panel>
        <Panel title="Limitations"><ul className="list-disc space-y-1.5 pl-5 text-[13px] text-muted-foreground">{LIMITS.map((l) => <li key={l}>{l}</li>)}</ul></Panel>
      </div>
    </>
  );
}
