import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { DemoNotice, PageHeader, Panel, PULink, ReviewBadge, Tag, WithRecords, td, th, useReview } from "@/components/rl";
import { pct } from "@/lib/store";
import { CANDIDATES } from "@/lib/demo-data";
import { meta } from "@/lib/meta";
import type { VerifiedRecord } from "@/lib/types";

export const Route = createFileRoute("/_dash/anomalies")({
  head: () => meta("Anomaly Analysis", "Turnout, votes-to-accreditation ratio, vote distribution and neighbouring-unit comparisons that require human review."),
  component: Page,
});

const tip = { contentStyle: { fontSize: 12, borderRadius: 4, border: "1px solid var(--border)", background: "var(--panel)" } };
const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function Page() {
  return (
    <>
      <PageHeader title="Anomaly Analysis" sub="Statistically unusual patterns. An anomaly score measures how far a record sits from its peers — it requires human review and is not a probability of wrongdoing." />
      <DemoNotice />
      <WithRecords>{(rows) => <Body rows={rows} />}</WithRecords>
    </>
  );
}

function Body({ rows }: { rows: VerifiedRecord[] }) {
  const review = useReview();
  const scatter = rows.filter((r) => r.accredited && r.irevTotal != null).map((r) => ({ x: r.accredited!, y: r.irevTotal!, name: r.puCode }));
  const maxX = Math.max(...scatter.map((s) => s.x), 1);
  const turnout = rows.filter((r) => r.turnout != null).map((r) => ({ name: r.puCode.split("/").slice(-2).join("/"), t: +(r.turnout! * 100).toFixed(1) }));
  const lgas = [...new Set(rows.map((r) => r.lga))].map((l) => {
    const lr = rows.filter((r) => r.lga === l && r.irev);
    const o: Record<string, number | string> = { name: l };
    CANDIDATES.forEach((c) => (o[c] = lr.reduce((a, r) => a + (r.irev!.candidates[c] ?? 0), 0)));
    return o;
  });
  const wards = [...new Set(rows.map((r) => `${r.lga}|${r.ward}`))].map((k) => {
    const [l, w] = k.split("|");
    const wr = rows.filter((r) => r.lga === l && r.ward === w && r.turnout != null);
    const ts = wr.map((r) => r.turnout!);
    return { l, w, n: wr.length, avg: ts.reduce((a, b) => a + b, 0) / (ts.length || 1), min: Math.min(...ts), max: Math.max(...ts) };
  });
  const anomalies = rows.flatMap((r) => r.flags.filter((f) => ["UNUSUAL_TURNOUT", "UNUSUAL_SPATIAL", "OVER_ACCREDITATION"].includes(f.code)).map((f) => ({ r, f })));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Turnout by polling unit" meta="%, line = 85% threshold">
          <div className="h-60"><ResponsiveContainer><BarChart data={turnout}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={false} /><YAxis tick={{ fontSize: 10 }} width={28} domain={[0, 100]} /><Tooltip {...tip} /><ReferenceLine y={85} stroke="var(--warn)" strokeDasharray="4 3" /><Bar dataKey="t" name="Turnout %" fill="var(--chart-1)" /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Votes vs accredited voters" meta="points above the line exceed accreditation">
          <div className="h-60"><ResponsiveContainer><ScatterChart><CartesianGrid stroke="var(--border)" /><XAxis type="number" dataKey="x" name="Accredited" tick={{ fontSize: 10 }} /><YAxis type="number" dataKey="y" name="Votes" tick={{ fontSize: 10 }} width={36} /><ZAxis range={[30, 30]} /><Tooltip {...tip} /><ReferenceLine segment={[{ x: 0, y: 0 }, { x: maxX, y: maxX }]} stroke="var(--warn)" strokeDasharray="4 3" /><Scatter data={scatter} fill="var(--chart-1)" /></ScatterChart></ResponsiveContainer></div>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Candidate vote distribution by LGA" meta="IReV values">
          <div className="h-60"><ResponsiveContainer><BarChart data={lgas}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={40} /><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 11 }} />{CANDIDATES.map((c, i) => <Bar key={c} dataKey={c} stackId="a" fill={C[i]} />)}</BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Ward-level turnout" bodyClass="p-0 overflow-x-auto">
          <table className="w-full text-[12px]"><thead className="border-b border-border"><tr><th className={th}>LGA</th><th className={th}>Ward</th><th className={`${th} text-right`}>Units</th><th className={`${th} text-right`}>Avg</th><th className={`${th} text-right`}>Range</th></tr></thead>
            <tbody className="num divide-y divide-border">{wards.map((w) => <tr key={w.l + w.w}><td className={`${td} font-sans`}>{w.l}</td><td className={`${td} font-sans`}>{w.w}</td><td className={`${td} text-right`}>{w.n}</td><td className={`${td} text-right`}>{pct(w.avg)}</td><td className={`${td} text-right ${w.max - w.min > 0.3 ? "text-warn font-medium" : ""}`}>{pct(w.min, 0)}–{pct(w.max, 0)}</td></tr>)}</tbody>
          </table>
        </Panel>
      </div>
      <Panel title="Anomaly table" meta="Requires human review" bodyClass="p-0 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="border-b border-border"><tr><th className={th}>Polling unit</th><th className={th}>Metric</th><th className={th}>Observed</th><th className={th}>Expected / reference</th><th className={`${th} text-right`}>Anomaly score</th><th className={th}>Explanation</th><th className={th}>Review status</th></tr></thead>
          <tbody className="divide-y divide-border">
            {anomalies.map(({ r, f }) => (
              <tr key={r.id + f.code}>
                <td className={td}><PULink r={r} /><div className="num text-[10px] text-muted-foreground">{r.puCode}</div></td>
                <td className={td}>{f.rule}</td><td className={`${td} num`}>{f.detected}</td><td className={`${td} num`}>{f.expected}</td>
                <td className={`${td} text-right`}><Tag tone={r.anomalyScore > 0.6 ? "warn" : "neutral"}>{r.anomalyScore.toFixed(2)}</Tag></td>
                <td className={`${td} max-w-[280px] text-muted-foreground`}>{f.explanation}</td>
                <td className={td}><ReviewBadge s={review(r)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="Model roadmap">
        <p className="text-[12px] text-muted-foreground">Current scores use robust statistics (median / MAD z-scores and ward-peer deviation). The service layer is prepared for a Python / scikit-learn service providing Isolation Forest, Local Outlier Factor and DBSCAN outputs through the same <span className="num">getAnomalies()</span> contract.</p>
      </Panel>
    </div>
  );
}
