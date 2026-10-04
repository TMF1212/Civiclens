import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoNotice, Kpi, PageHeader, Panel, PULink, Tag, WithRecords, td, th } from "@/components/rl";
import { fmt, pct } from "@/lib/store";
import { getElection } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { VerifiedRecord } from "@/lib/types";

export const Route = createFileRoute("/_dash/uploads")({
  head: () => meta("Upload Tracker", "Track polling units with missing, delayed or incomplete result uploads, by LGA and ward."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Upload Tracker" sub="Which polling units have missing, delayed or incomplete result uploads. Delayed = uploaded more than 3 hours after 14:30 close of polls." />
      <DemoNotice />
      <WithRecords>{(rows) => <Body rows={rows} />}</WithRecords>
    </>
  );
}

type U = "Missing" | "Delayed" | "Incomplete" | "On time" | "Time unknown";
function uploadState(r: VerifiedRecord, electionDate: string): U {
  if (!r.irev) return "Missing";
  if (r.status === "INCOMPLETE") return "Incomplete";
  if (!r.irev.timestamp) return "Time unknown";
  {
    const close = new Date(`${electionDate}T14:30:00+01:00`).getTime();
    if (new Date(r.irev.timestamp!).getTime() - close > 3 * 3600_000) return "Delayed";
  }
  return "On time";
}
const tone = { Missing: "steel", Delayed: "warn", Incomplete: "steel", "On time": "ok", "Time unknown": "neutral" } as const;

function Body({ rows }: { rows: VerifiedRecord[] }) {
  const { electionId } = useAppStore();
  const date = getElection(electionId).date;
  const [filter, setFilter] = useState<U | "">("");
  const withState = rows.map((r) => ({ r, u: uploadState(r, date) }));
  const count = (u: U) => withState.filter((x) => x.u === u).length;
  const lgas = [...new Set(rows.map((r) => r.lga))];
  const list = withState.filter((x) => (filter ? x.u === filter : x.u !== "On time" && x.u !== "Time unknown"));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-sm border border-border md:grid-cols-5">
        <Kpi label="On time" value={fmt(count("On time"))} note={pct(count("On time") / rows.length)} tone="accent" />
        <Kpi label="Delayed" value={fmt(count("Delayed"))} note="> 3h after close" tone="warn" />
        <Kpi label="Incomplete" value={fmt(count("Incomplete"))} note="values unreadable" tone="steel" />
        <Kpi label="Time unknown" value={fmt(count("Time unknown"))} note="no upload time in source" />
        <Kpi label="Missing" value={fmt(count("Missing"))} note="no upload found" tone="steel" />
      </div>
      <Panel title="Upload completeness by LGA" bodyClass="space-y-3">
        {lgas.map((l) => {
          const lr = withState.filter((x) => x.r.lga === l);
          const seg = (u: U) => (lr.filter((x) => x.u === u).length / lr.length) * 100;
          return (
            <div key={l}>
              <div className="mb-1 flex justify-between text-[11px]"><span>{l}</span><span className="num text-muted-foreground">{lr.filter((x) => x.u !== "Missing").length} / {lr.length} uploaded</span></div>
              <div className="flex h-2 overflow-hidden rounded-full bg-border">
                <div className="bg-primary" style={{ width: `${seg("On time")}%` }} />
                <div className="bg-warn" style={{ width: `${seg("Delayed")}%` }} />
                <div className="bg-steel" style={{ width: `${seg("Incomplete")}%` }} />
              </div>
            </div>
          );
        })}
        <div className="flex gap-4 pt-1 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-primary" />On time</span><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-warn" />Delayed</span><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-steel" />Incomplete</span><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-border" />Missing</span></div>
      </Panel>
      <Panel title="Units needing follow-up" meta={`${list.length} units`} bodyClass="p-0">
        <div className="flex flex-wrap gap-1.5 border-b border-border p-3 text-[12px]">
          {(["", "Missing", "Delayed", "Incomplete", "On time", "Time unknown"] as const).map((u) => (
            <button key={u} onClick={() => setFilter(u)} className={`rounded-sm border px-2 py-1 ${filter === u ? "border-primary bg-accent text-accent-foreground" : "border-border bg-panel"}`}>{u || "All issues"}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="border-b border-border"><tr><th className={th}>Polling unit</th><th className={th}>Ward</th><th className={th}>LGA</th><th className={th}>Upload time</th><th className={`${th} text-right`}>OCR confidence</th><th className={th}>Upload status</th></tr></thead>
            <tbody className="divide-y divide-border">
              {list.map(({ r, u }) => (
                <tr key={r.id} className="hover:bg-accent/40">
                  <td className={td}><PULink r={r} /><div className="num text-[10px] text-muted-foreground">{r.puCode}</div></td>
                  <td className={td}>{r.ward}</td><td className={td}>{r.lga}</td>
                  <td className={`${td} num`}>{r.irev?.timestamp ? new Date(r.irev.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className={`${td} num text-right`}>{r.ocrConfidence ? pct(r.ocrConfidence, 0) : "—"}</td>
                  <td className={td}><Tag tone={tone[u]}>{u}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
