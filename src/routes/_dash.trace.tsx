import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";
import { DemoNotice, PageHeader, Panel, Tag, WithRecords } from "@/components/rl";
import { fmt } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { VerifiedRecord } from "@/lib/types";

export const Route = createFileRoute("/_dash/trace")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => ({ id: typeof s.id === "string" ? s.id : undefined }),
  head: () => meta("Trace the Result", "Follow a polling unit's result up through ward, LGA and state aggregation."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Trace the Result" sub="Select a polling unit and follow how its data contributes to ward, LGA and state aggregates." />
      <DemoNotice />
      <WithRecords>{(rows) => <Body rows={rows} />}</WithRecords>
    </>
  );
}

function stats(rs: VerifiedRecord[]) {
  return {
    units: rs.length,
    votes: rs.reduce((a, r) => a + (r.irevTotal ?? 0), 0),
    matched: rs.filter((r) => r.status === "MATCH").length,
    missing: rs.filter((r) => r.status === "MISSING").length,
    flagged: rs.filter((r) => r.flags.length).length,
  };
}

function Body({ rows }: { rows: VerifiedRecord[] }) {
  const { id } = Route.useSearch();
  const nav = useNavigate({ from: "/trace" });
  const r = rows.find((x) => x.id === id) ?? rows.find((x) => x.flags.length) ?? rows[0];
  const levels = [
    { level: "Polling unit", name: `${r.puName} (${r.puCode})`, rs: [r] },
    { level: "Ward", name: r.ward, rs: rows.filter((x) => x.lga === r.lga && x.ward === r.ward) },
    { level: "LGA", name: r.lga, rs: rows.filter((x) => x.lga === r.lga) },
    { level: "State", name: r.state, rs: rows },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Panel title="Select polling unit" className="lg:col-span-4">
        <select value={r.id} onChange={(e) => nav({ search: { id: e.target.value } })} className="h-9 w-full rounded-sm border border-input bg-panel px-2 text-[13px]">
          {rows.map((x) => <option key={x.id} value={x.id}>{x.puCode} · {x.lga} {x.ward}</option>)}
        </select>
        <p className="mt-3 text-[12px] text-muted-foreground">Votes recorded are IReV declared totals. Missing units contribute nothing to aggregates, which is why missing-upload counts are shown at each level.</p>
      </Panel>
      <div className="space-y-2 lg:col-span-8">
        {levels.map((l, i) => {
          const s = stats(l.rs);
          return (
            <div key={l.level}>
              <div className="panel p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div><div className="eyebrow">{l.level}</div><div className="text-[15px] font-semibold">{l.name}</div></div>
                  {s.flagged ? <Tag tone="warn">{s.flagged} flagged</Tag> : <Tag tone="ok">No flags</Tag>}
                </div>
                <div className="num mt-3 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-5">
                  {[["Polling units", s.units], ["Votes recorded", s.votes], ["Reconciled match", s.matched], ["Missing", s.missing], ["Flagged", s.flagged]].map(([k, v]) => (
                    <div key={k as string}><div className="eyebrow">{k}</div><div className="mt-0.5 text-[15px] font-medium">{fmt(v as number)}</div></div>
                  ))}
                </div>
              </div>
              {i < levels.length - 1 && <div className="flex justify-center py-1 text-muted-foreground"><ArrowDown className="size-4" /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
