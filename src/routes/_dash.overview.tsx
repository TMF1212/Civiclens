import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DemoNotice, Diff, Kpi, PageHeader, Panel, PULink, ReviewBadge, SeverityBadge, WithRecords, td, th, useReview } from "@/components/rl";
import { fmt, pct } from "@/lib/store";
import { meta } from "@/lib/meta";
import { severityRank } from "@/lib/api";
import type { VerifiedRecord } from "@/lib/types";

export const Route = createFileRoute("/_dash/overview")({
  head: () => meta("Overview", "Election result verification metrics: uploads, reconciliation status, turnout and discrepancies by LGA."),
  component: Overview,
});

const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tip = { contentStyle: { fontSize: 12, borderRadius: 4, border: "1px solid var(--border)", background: "var(--panel)" } };

function Overview() {
  return (
    <>
      <PageHeader title="Election Result Verification" sub="Evidence-based reconciliation of polling-unit results and official election data." />
      <DemoNotice />
      <WithRecords>{(rows) => <Body rows={rows} />}</WithRecords>
    </>
  );
}

function Body({ rows }: { rows: VerifiedRecord[] }) {
  const review = useReview();
  const n = (s: string) => rows.filter((r) => r.status === s).length;
  const flagged = rows.filter((r) => r.flags.length);
  const needs = flagged.filter((r) => ["Unreviewed", "Under Review"].includes(review(r)));
  const available = rows.filter((r) => r.irev).length;

  const completeness = [
    { name: "Uploaded", value: available - n("INCOMPLETE") },
    { name: "Incomplete", value: n("INCOMPLETE") },
    { name: "Missing", value: n("MISSING") },
  ];
  const recon = [
    { name: "Matched", value: n("MATCH") },
    { name: "Mismatched", value: n("MISMATCH") },
    { name: "Pending", value: n("PENDING") + n("MISSING") + n("INCOMPLETE") },
  ];
  const buckets = Array.from({ length: 10 }, (_, i) => ({ name: `${i * 10}–${i * 10 + 10}%`, units: 0 }));
  rows.forEach((r) => r.turnout != null && buckets[Math.min(9, Math.floor(r.turnout * 10))].units++);
  const lgas = [...new Set(rows.map((r) => r.lga))].map((l) => ({ name: l, flags: rows.filter((r) => r.lga === l).reduce((a, r) => a + r.flags.length, 0) }));
  const reviewCounts = ["Unreviewed", "Under Review", "Verified Match", "Confirmed Data Difference", "Insufficient Evidence"].map((s) => ({ name: s, value: rows.filter((r) => review(r) === s).length })).filter((x) => x.value);

  const attention = flagged
    .map((r) => ({ r, top: [...r.flags].sort((a, b) => severityRank[b.severity] - severityRank[a.severity])[0] }))
    .sort((a, b) => severityRank[b.top.severity] - severityRank[a.top.severity] || Math.abs(b.r.difference ?? 0) - Math.abs(a.r.difference ?? 0))
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-sm border border-border md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total polling units" value={fmt(rows.length)} note="in dataset" />
        <Kpi label="Results available" value={fmt(available)} note={`${pct(available / rows.length)} uploaded`} tone="accent" />
        <Kpi label="Results missing" value={fmt(n("MISSING"))} note="no upload found" tone="steel" />
        <Kpi label="Records reconciled" value={fmt(n("MATCH") + n("MISMATCH"))} note="both sources present" />
        <Kpi label="Discrepancies flagged" value={fmt(rows.reduce((a, r) => a + r.flags.length, 0))} note={`across ${flagged.length} units`} tone="warn" />
        <Kpi label="Requires verification" value={fmt(needs.length)} note="open review items" tone="steel" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Result upload completeness" meta="units">
          <Donut data={completeness} />
        </Panel>
        <Panel title="Reconciliation status" meta="units">
          <Donut data={recon} />
        </Panel>
        <Panel title="Verification status" meta="human review">
          <Donut data={reviewCounts} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Turnout distribution" meta="accredited / registered">
          <div className="h-56">
            <ResponsiveContainer><BarChart data={buckets}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} /><Tooltip {...tip} /><Bar dataKey="units" fill="var(--chart-1)" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Discrepancies by LGA" meta="flags raised">
          <div className="h-56">
            <ResponsiveContainer><BarChart data={lgas}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} /><Tooltip {...tip} /><Bar dataKey="flags" fill="var(--chart-2)" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Attention required" meta={`${flagged.length} flagged units · by priority`} bodyClass="p-0 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="border-b border-border"><tr><th className={th}>Polling unit</th><th className={th}>Ward</th><th className={th}>LGA</th><th className={th}>Issue</th><th className={`${th} text-right`}>Difference</th><th className={th}>Priority</th><th className={th}>Status</th><th className={th}></th></tr></thead>
          <tbody className="divide-y divide-border">
            {attention.map(({ r, top }) => (
              <tr key={r.id} className="hover:bg-accent/40">
                <td className={td}><PULink r={r} /><div className="num text-[10px] text-muted-foreground">{r.puCode}</div></td>
                <td className={td}>{r.ward}</td><td className={td}>{r.lga}</td><td className={td}>{top.rule}</td>
                <td className={`${td} text-right`}><Diff n={r.difference} /></td>
                <td className={td}><SeverityBadge s={top.severity} /></td>
                <td className={td}><ReviewBadge s={review(r)} /></td>
                <td className={`${td} text-right`}><Link to="/evidence" search={{ id: r.id }} className="text-primary hover:underline">View evidence</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <p className="text-[11px] text-muted-foreground">Priority indicates verification priority, not evidence of wrongdoing.</p>
    </div>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="flex items-center gap-4">
      <div className="size-32 shrink-0">
        <ResponsiveContainer><PieChart><Pie data={data} dataKey="value" innerRadius={36} outerRadius={60} strokeWidth={1} stroke="var(--panel)">{data.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5 text-[12px]">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: C[i % C.length] }} /><span className="flex-1">{d.name}</span><span className="num">{d.value}</span></li>
        ))}
      </ul>
    </div>
  );
}
