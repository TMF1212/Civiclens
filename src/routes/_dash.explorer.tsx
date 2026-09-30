import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DemoNotice, Diff, PageHeader, Pager, Panel, PULink, VerificationBadge, WithRecords, td, th } from "@/components/rl";
import { fmt } from "@/lib/store";
import { meta } from "@/lib/meta";
import type { VerifiedRecord } from "@/lib/types";

type S = { q?: string; lga?: string; ward?: string };
export const Route = createFileRoute("/_dash/explorer")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s.q === "string" ? s.q : undefined,
    lga: typeof s.lga === "string" ? s.lga : undefined,
    ward: typeof s.ward === "string" ? s.ward : undefined,
  }),
  head: () => meta("Result Explorer", "Browse results State → LGA → Ward → Polling Unit and compare IReV totals with official totals."),
  component: Explorer,
});

function Explorer() {
  return (
    <>
      <PageHeader title="Result Explorer" sub="Navigate State → LGA → Ward → Polling Unit. Click a polling unit to open its verification page." />
      <DemoNotice />
      <WithRecords>{(rows) => <Body rows={rows} />}</WithRecords>
    </>
  );
}

function Body({ rows }: { rows: VerifiedRecord[] }) {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/explorer" });
  const [page, setPage] = useState(1);
  const set = (p: S) => { setPage(1); nav({ search: (o) => ({ ...o, ...p }) }); };
  const state = rows[0].state;
  const lgas = [...new Set(rows.map((r) => r.lga))];
  const wards = s.lga ? [...new Set(rows.filter((r) => r.lga === s.lga).map((r) => r.ward))] : [];
  const q = s.q?.toLowerCase().trim();
  const filtered = rows.filter((r) => (!s.lga || r.lga === s.lga) && (!s.ward || r.ward === s.ward) && (!q || [r.puCode, r.puName, r.ward, r.lga].some((x) => x.toLowerCase().includes(q))));
  const size = 15;
  const pageRows = filtered.slice((page - 1) * size, page * size);

  const Col = ({ title, items, active, onPick, count }: { title: string; items: string[]; active?: string; onPick: (v?: string) => void; count: (v: string) => number }) => (
    <div className="min-w-0">
      <div className="eyebrow px-2 pb-1.5">{title}</div>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it}>
            <button onClick={() => onPick(active === it ? undefined : it)} className={cn("flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-muted", active === it && "bg-accent text-accent-foreground font-medium")}>
              <span className="truncate">{it}</span><span className="num flex items-center gap-1 text-[10px] text-muted-foreground">{count(it)}<ChevronRight className="size-3" /></span>
            </button>
          </li>
        ))}
        {!items.length && <li className="px-2 py-1.5 text-[12px] text-muted-foreground">Select a level to the left</li>}
      </ul>
    </div>
  );

  return (
    <div className="space-y-4">
      <Panel title="Hierarchy" meta={[state, s.lga, s.ward].filter(Boolean).join(" → ")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Col title="State" items={[state]} active={state} onPick={() => set({ lga: undefined, ward: undefined })} count={() => rows.length} />
          <Col title="LGA" items={lgas} active={s.lga} onPick={(v) => set({ lga: v, ward: undefined })} count={(v) => rows.filter((r) => r.lga === v).length} />
          <Col title="Ward" items={wards} active={s.ward} onPick={(v) => set({ ward: v })} count={(v) => rows.filter((r) => r.lga === s.lga && r.ward === v).length} />
        </div>
      </Panel>
      <Panel title="Polling units" meta={`${filtered.length} matching`} bodyClass="p-0">
        <div className="border-b border-border p-3">
          <input defaultValue={s.q} onKeyDown={(e) => e.key === "Enter" && set({ q: (e.target as HTMLInputElement).value || undefined })} placeholder="Search by PU ID, name, ward or LGA — press Enter" className="h-8 w-full max-w-md rounded-sm border border-input bg-background px-2 text-[12px] outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="border-b border-border"><tr>
              <th className={th}>Polling unit</th><th className={th}>Ward</th><th className={th}>LGA</th><th className={`${th} text-right`}>Accredited</th><th className={`${th} text-right`}>Votes cast</th><th className={th}>Uploaded</th><th className={`${th} text-right`}>IReV total</th><th className={`${th} text-right`}>Official total</th><th className={`${th} text-right`}>Difference</th><th className={th}>Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((r) => (
                <tr key={r.id} className="hover:bg-accent/40">
                  <td className={td}><PULink r={r} /><div className="num text-[10px] text-muted-foreground">{r.puCode}</div></td>
                  <td className={td}>{r.ward}</td><td className={td}>{r.lga}</td>
                  <td className={`${td} num text-right`}>{fmt(r.accredited)}</td>
                  <td className={`${td} num text-right`}>{fmt(r.irevTotal)}</td>
                  <td className={td}>{r.irevUploaded ? "Yes" : <span className="text-steel">No</span>}</td>
                  <td className={`${td} num text-right`}>{fmt(r.irevTotal)}</td>
                  <td className={`${td} num text-right`}>{fmt(r.officialTotal)}</td>
                  <td className={`${td} text-right`}><Diff n={r.difference} /></td>
                  <td className={td}><VerificationBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} total={filtered.length} size={size} onChange={setPage} />
      </Panel>
    </div>
  );
}
