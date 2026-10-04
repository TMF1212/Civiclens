import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DemoNotice, EmptyState, EvidenceChain, LoadingState, PageHeader, Panel, ResultComparison, ReviewBadge, SeverityBadge, VerificationBadge, useReview } from "@/components/rl";
import { getResult } from "@/lib/api";
import { fmt, pct, signed, useAppStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { ReviewStatus, VerifiedRecord } from "@/lib/types";

export const Route = createFileRoute("/_dash/pu/$id")({
  head: () => meta("Polling Unit Verification", "Side-by-side comparison of uploaded and official polling-unit results with rule-based flags."),
  component: PU,
});

function PU() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({ queryKey: ["pu", id], queryFn: () => getResult(id) });
  if (isLoading) return <LoadingState />;
  if (!data) return <EmptyState title="Invalid record" body={`No polling-unit record with id ${id} exists in the current dataset.`} />;
  return <Body r={data} />;
}

const REVIEWS: ReviewStatus[] = ["Unreviewed", "Under Review", "Verified Match", "Confirmed Data Difference", "Insufficient Evidence"];

function reason(r: VerifiedRecord) {
  if (r.status === "MISSING") return "No polling-unit result upload was found, so reconciliation could not be performed.";
  if (r.status === "PENDING") return "The polling-unit result is available, but no officially announced/collated figure for this unit has been supplied, so totals cannot be reconciled yet. Form-level checks below still apply.";
  if (r.status === "INCOMPLETE") return "The result sheet exists but one or more values could not be extracted; manual review of the sheet is needed.";
  if (r.status === "MISMATCH") return `IReV total differs from the corresponding official total by ${fmt(Math.abs(r.difference ?? 0))} votes.`;
  return "IReV total matches the corresponding official total.";
}

function Body({ r }: { r: VerifiedRecord }) {
  const review = useReview()(r);
  const { setReview } = useAppStore();
  return (
    <>
      <PageHeader
        title="Polling Unit Verification"
        sub={`${r.puName} · ${r.ward} · ${r.lga} · ${r.state}`}
        right={<div className="flex gap-2 text-[12px]"><Link to="/evidence" search={{ id: r.id }} className="rounded-sm border border-border bg-panel px-3 py-1.5 hover:bg-muted">Open evidence</Link><Link to="/trace" search={{ id: r.id }} className="rounded-sm border border-border bg-panel px-3 py-1.5 hover:bg-muted">Trace the result</Link></div>}
      />
      <DemoNotice />
      <div className="mb-4 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-sm border border-border bg-panel sm:grid-cols-5">
        {[["Polling unit ID", r.puCode], ["Name", r.puName], ["Ward", r.ward], ["LGA", r.lga], ["State", r.state]].map(([k, v]) => (
          <div key={k} className="p-3"><div className="eyebrow">{k}</div><div className="mt-1 text-[13px] font-medium">{v}</div></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Panel title="IReV / uploaded result vs official result" meta={`Registered ${fmt(r.registered)} · Accredited ${fmt(r.accredited)} · Turnout ${pct(r.turnout)}`} bodyClass="p-0">
            {r.irev || r.official ? <ResultComparison r={r} /> : <div className="p-4"><EmptyState title="No result data" body="Neither source has values for this polling unit." /></div>}
          </Panel>
          {r.used !== undefined && (
            <Panel title="EC8A ballot accounting (as written on the form)" bodyClass="p-0">
              <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4">
                {([["#1 Registered", r.registered], ["#2 Accredited", r.accredited], ["#3 Issued", r.issued], ["#4 Unused", r.unused], ["#5 Spoiled", r.spoiled], ["#6 Rejected", r.rejected], ["#7 Valid", r.irevTotal], ["#8 Used", r.used]] as const).map(([k, v]) => (
                  <div key={k} className="p-3"><div className="eyebrow">{k}</div><div className="num mt-1 text-[15px]">{v == null ? <span className="text-steel text-[12px]">blank on form</span> : fmt(v)}</div></div>
                ))}
              </div>
            </Panel>
          )}
          <Panel title="Verification summary">
            <div className="flex flex-wrap items-center gap-6">
              <div><div className="eyebrow">Status</div><div className="mt-1"><VerificationBadge status={r.status} /></div></div>
              <div><div className="eyebrow">Difference</div><div className="num mt-1 text-lg font-medium">{signed(r.difference)}</div></div>
              <div><div className="eyebrow">Flags</div><div className="num mt-1 text-lg font-medium">{r.flags.length}</div></div>
            </div>
            <p className="mt-3 text-[13px]"><span className="eyebrow mr-2">Reason</span>{reason(r)}</p>
          </Panel>
          <Panel title="Rule flags" meta="Severity indicates verification priority, not evidence of wrongdoing." bodyClass="p-0">
            {r.flags.length === 0 ? <p className="p-4 text-[13px] text-muted-foreground">All verification rules passed.</p> : (
              <ul className="divide-y divide-border">
                {r.flags.map((f) => (
                  <li key={f.code} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex items-center gap-2"><span className="text-[13px] font-semibold">{f.rule}</span><SeverityBadge s={f.severity} /></div>
                      <p className="mt-1 text-[12px] text-muted-foreground">{f.explanation}</p>
                      <div className="num mt-2 flex flex-wrap gap-4 text-[11px]"><span>Detected: <b>{f.detected}</b></span><span>Reference: <b>{f.expected}</b></span></div>
                    </div>
                    <Link to="/evidence" search={{ id: r.id }} className="self-start text-[12px] text-primary hover:underline">Evidence →</Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <Panel title="Human review" meta={<ReviewBadge s={review} />}>
            <div className="grid gap-1.5">
              {REVIEWS.map((s) => (
                <button key={s} onClick={() => setReview(r.id, s)} className={`rounded-sm border px-2.5 py-1.5 text-left text-[12px] ${s === review ? "border-primary bg-accent text-accent-foreground font-medium" : "border-border hover:bg-muted"}`}>{s}</button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Decisions are written to the audit log. Records can never be labelled as fraud.</p>
          </Panel>
          <Panel title="Evidence chain"><EvidenceChain r={r} review={review} /></Panel>
        </div>
      </div>
    </>
  );
}
