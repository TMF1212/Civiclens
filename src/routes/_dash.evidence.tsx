import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { DemoNotice, EmptyState, EvidenceChain, PageHeader, Panel, ResultComparison, SeverityBadge, VerificationBadge, WithRecords, useReview } from "@/components/rl";
import { pct } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { VerifiedRecord } from "@/lib/types";

export const Route = createFileRoute("/_dash/evidence")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => ({ id: typeof s.id === "string" ? s.id : undefined }),
  head: () => meta("Evidence Viewer", "Result-sheet evidence, provenance and the full evidence chain behind every verification flag."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Evidence" sub="See exactly how the system arrived at a flag: source → raw record → normalized record → rule → flag → human review." />
      <DemoNotice />
      <WithRecords>{(rows) => <Body rows={rows} />}</WithRecords>
    </>
  );
}

function Body({ rows }: { rows: VerifiedRecord[] }) {
  const { id } = Route.useSearch();
  const nav = useNavigate({ from: "/evidence" });
  const review = useReview();
  const flagged = rows.filter((r) => r.flags.length);
  const r = rows.find((x) => x.id === id) ?? flagged[0];
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Panel title="Flagged units" meta={flagged.length} className="lg:col-span-3" bodyClass="p-0 max-h-[70vh] overflow-y-auto">
        <ul className="divide-y divide-border">
          {flagged.map((x) => (
            <li key={x.id}><button onClick={() => nav({ search: { id: x.id } })} className={`w-full px-3 py-2 text-left text-[12px] hover:bg-muted ${x.id === r?.id ? "bg-accent" : ""}`}>
              <div className="font-medium">{x.puName} · {x.ward}</div><div className="num text-[10px] text-muted-foreground">{x.puCode} · {x.flags.length} flag(s)</div>
            </button></li>
          ))}
        </ul>
      </Panel>
      {r ? (
        <div className="space-y-4 lg:col-span-9">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="1 · Result-sheet image / document">
              {r.resultImageUrl ? <img src={r.resultImageUrl} alt={`Result sheet ${r.puCode}`} className="w-full rounded-sm" /> : <EmptyState icon={<ImageOff className="size-6" />} title="Evidence unavailable in demo dataset." body="No result-sheet image is attached. Real sheets will appear here once the source collector is connected." />}
            </Panel>
            <Panel title="Provenance">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[12px]">
                <dt className="eyebrow">2 · Source</dt><dd>{r.sourceUrl ?? "Synthetic generator — not a real source"}</dd>
                <dt className="eyebrow">3 · Polling unit</dt><dd><Link to="/pu/$id" params={{ id: r.id }} className="text-primary hover:underline">{r.puCode}</Link> · {r.puName}, {r.ward}, {r.lga}</dd>
                <dt className="eyebrow">7 · Timestamp</dt><dd className="num">{r.irev?.timestamp ? new Date(r.irev.timestamp).toLocaleString("en-NG") : "Not available"}</dd>
                <dt className="eyebrow">OCR confidence</dt><dd className="num">{r.ocrConfidence ? pct(r.ocrConfidence, 0) : "—"}</dd>
                <dt className="eyebrow">Status</dt><dd><VerificationBadge status={r.status} /></dd>
                <dt className="eyebrow">8 · Data provenance</dt><dd>Raw values preserved separately from normalized values. DEMO / SYNTHETIC DATA.</dd>
              </dl>
            </Panel>
          </div>
          <Panel title="4–6 · Extracted vs official values" bodyClass="p-0"><ResultComparison r={r} /></Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Evidence chain"><EvidenceChain r={r} review={review(r)} /></Panel>
            <Panel title="Why it was flagged" bodyClass="space-y-3">
              {r.flags.map((f) => (
                <div key={f.code} className="rounded-sm border border-border p-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold">{f.rule}<SeverityBadge s={f.severity} /></div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{f.explanation}</p>
                  <p className="num mt-1.5 text-[11px]">Detected {f.detected} · Reference {f.expected}</p>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">Severity indicates verification priority, not evidence of wrongdoing.</p>
            </Panel>
          </div>
        </div>
      ) : <div className="lg:col-span-9"><EmptyState title="No flagged records" body="Nothing requires evidence review for this election." /></div>}
    </div>
  );
}
