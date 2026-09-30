import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { DemoNotice, Diff, PageHeader, Pager, Panel, ReviewBadge, SeverityBadge, WithRecords, td, th, useReview } from "@/components/rl";
import { fmt, useAppStore } from "@/lib/store";
import { getElection, severityRank } from "@/lib/api";
import { RULES } from "@/lib/verification";
import { meta } from "@/lib/meta";
import type { Flag, VerifiedRecord } from "@/lib/types";

export const Route = createFileRoute("/_dash/discrepancies")({
  head: () => meta("Discrepancy Review", "Filter, sort and review every flagged polling-unit record by issue type, severity and status."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Discrepancy Review" sub="Every flag raised by the rule engine. Click a row to open the polling-unit verification page." />
      <DemoNotice />
      <WithRecords>{(rows) => <Body rows={rows} />}</WithRecords>
    </>
  );
}

type Key = "pu" | "lga" | "diff" | "sev";
const sel = "h-8 rounded-sm border border-input bg-panel px-2 text-[12px]";

function Body({ rows }: { rows: VerifiedRecord[] }) {
  const review = useReview();
  const { electionId } = useAppStore();
  const nav = useNavigate();
  const [f, setF] = useState({ lga: "", ward: "", issue: "", sev: "", status: "" });
  const [sort, setSort] = useState<{ k: Key; d: 1 | -1 }>({ k: "sev", d: -1 });
  const [page, setPage] = useState(1);
  const all = useMemo(() => rows.flatMap((r) => r.flags.map((fl) => ({ ...fl, r }))), [rows]);
  const lgas = [...new Set(rows.map((r) => r.lga))];
  const wards = [...new Set(rows.filter((r) => !f.lga || r.lga === f.lga).map((r) => r.ward))];
  const list = all
    .filter((x) => (!f.lga || x.r.lga === f.lga) && (!f.ward || x.r.ward === f.ward) && (!f.issue || x.code === f.issue) && (!f.sev || x.severity === f.sev) && (!f.status || review(x.r) === f.status))
    .sort((a, b) => {
      const v = (x: Flag & { r: VerifiedRecord }) => sort.k === "pu" ? x.r.puCode : sort.k === "lga" ? x.r.lga : sort.k === "diff" ? Math.abs(x.r.difference ?? 0) : severityRank[x.severity];
      const A = v(a), B = v(b);
      return (A > B ? 1 : A < B ? -1 : 0) * sort.d;
    });
  const size = 15;
  const upd = (p: Partial<typeof f>) => { setPage(1); setF({ ...f, ...p }); };
  const H = ({ k, children, right }: { k: Key; children: string; right?: boolean }) => (
    <th className={`${th} ${right ? "text-right" : ""}`}><button className="inline-flex items-center gap-1" onClick={() => setSort({ k, d: sort.k === k ? (-sort.d as 1 | -1) : -1 })}>{children}<ArrowUpDown className="size-3" /></button></th>
  );
  return (
    <Panel title="Flags" meta={`${list.length} of ${all.length}`} bodyClass="p-0">
      <div className="flex flex-wrap gap-2 border-b border-border p-3">
        <select className={sel} disabled><option>{getElection(electionId).name}</option></select>
        <select className={sel} disabled><option>{rows[0].state}</option></select>
        <select className={sel} value={f.lga} onChange={(e) => upd({ lga: e.target.value, ward: "" })}><option value="">All LGAs</option>{lgas.map((l) => <option key={l}>{l}</option>)}</select>
        <select className={sel} value={f.ward} onChange={(e) => upd({ ward: e.target.value })}><option value="">All wards</option>{wards.map((l) => <option key={l}>{l}</option>)}</select>
        <select className={sel} value={f.issue} onChange={(e) => upd({ issue: e.target.value })}><option value="">All issue types</option>{RULES.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select>
        <select className={sel} value={f.sev} onChange={(e) => upd({ sev: e.target.value })}><option value="">All severities</option>{["HIGH", "MEDIUM", "LOW"].map((s) => <option key={s}>{s}</option>)}</select>
        <select className={sel} value={f.status} onChange={(e) => upd({ status: e.target.value })}><option value="">All statuses</option>{["Unreviewed", "Under Review", "Verified Match", "Confirmed Data Difference", "Insufficient Evidence"].map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="border-b border-border"><tr><H k="pu">Polling unit</H><H k="lga">LGA</H><th className={th}>Issue</th><th className={`${th} text-right`}>IReV</th><th className={`${th} text-right`}>Official</th><H k="diff" right>Difference</H><H k="sev">Severity</H><th className={th}>Status</th><th className={th}></th></tr></thead>
          <tbody className="divide-y divide-border">
            {list.slice((page - 1) * size, page * size).map((x) => (
              <tr key={x.r.id + x.code} onClick={() => nav({ to: "/pu/$id", params: { id: x.r.id } })} className="cursor-pointer hover:bg-accent/40">
                <td className={td}><div className="font-medium">{x.r.puName}</div><div className="num text-[10px] text-muted-foreground">{x.r.puCode} · {x.r.ward}</div></td>
                <td className={td}>{x.r.lga}</td><td className={td}>{x.rule}</td>
                <td className={`${td} num text-right`}>{fmt(x.r.irevTotal)}</td><td className={`${td} num text-right`}>{fmt(x.r.officialTotal)}</td>
                <td className={`${td} text-right`}><Diff n={x.r.difference} /></td>
                <td className={td}><SeverityBadge s={x.severity} /></td><td className={td}><ReviewBadge s={review(x.r)} /></td>
                <td className={`${td} text-primary`}>View</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} total={list.length} size={size} onChange={setPage} />
    </Panel>
  );
}
