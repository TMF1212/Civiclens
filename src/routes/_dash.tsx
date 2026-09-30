import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ELECTIONS } from "@/lib/demo-data";
import { getElection } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { Tag } from "@/components/rl";

export const Route = createFileRoute("/_dash")({ component: DashLayout });

const NAV = [
  { to: "/overview", label: "Overview" },
  { to: "/explorer", label: "Result Explorer" },
  { to: "/discrepancies", label: "Discrepancies" },
  { to: "/uploads", label: "Upload Tracker" },
  { to: "/anomalies", label: "Anomaly Analysis" },
  { to: "/evidence", label: "Evidence" },
  { to: "/trace", label: "Trace the Result" },
  { to: "/data", label: "Election Data" },
  { to: "/methodology", label: "Methodology" },
  { to: "/about", label: "About" },
] as const;

function ElectionSelector() {
  const { electionId, setElectionId } = useAppStore();
  return (
    <Select value={electionId} onValueChange={setElectionId}>
      <SelectTrigger className="h-8 w-[280px] max-w-full rounded-sm bg-panel text-[13px] font-semibold"><SelectValue /></SelectTrigger>
      <SelectContent>
        {ELECTIONS.map((e) => (
          <SelectItem key={e.id} value={e.id} className="text-[13px]">
            {e.name}{!e.hasData && " (no data)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DashLayout() {
  const { electionId } = useAppStore();
  const e = getElection(electionId);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-panel md:flex">
        <Link to="/" className="flex items-center gap-2 border-b border-border px-4 py-4">
          <span className="grid size-7 place-items-center rounded-sm bg-primary font-mono text-[10px] font-medium text-primary-foreground">RL</span>
          <span className="leading-tight"><span className="block text-[13px] font-semibold">ResultLens NG</span><span className="block font-mono text-[10px] text-muted-foreground">Result verification</span></span>
        </Link>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3 text-[13px]">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="block rounded-sm px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "!bg-accent !text-accent-foreground font-medium" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1.5 border-t border-border px-4 py-4 font-mono text-[10px] text-muted-foreground">
          <div className="flex justify-between"><span>Source</span><span className="text-foreground">{e.dataSource === "demo" ? "Synthetic" : "IReV / INEC"}</span></div>
          <div className="flex justify-between"><span>Rules</span><span className="text-foreground">8 active</span></div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-5">
            <div className="flex flex-col"><span className="eyebrow !text-[9px]">Election</span><ElectionSelector /></div>
            {e.dataSource === "demo" ? <Tag tone="warn">Demo mode</Tag> : <Tag tone="accent">Data source: IReV / INEC</Tag>}
            <form className="relative ml-auto" onSubmit={(ev) => { ev.preventDefault(); nav({ to: "/explorer", search: { q } }); }}>
              <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="PU code, name, ward, LGA" className="h-8 w-56 rounded-sm border border-input bg-panel pl-7 pr-2 text-[12px] outline-none focus:ring-1 focus:ring-ring" />
            </form>
            <span className="hidden font-mono text-[11px] text-muted-foreground lg:inline">
              Updated {e.lastUpdated ? new Date(e.lastUpdated).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}
            </span>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-1.5 text-[12px] md:hidden">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-sm px-2 py-1 text-muted-foreground" activeProps={{ className: "!bg-accent !text-accent-foreground" }}>{n.label}</Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-5"><Outlet /></main>
      </div>
    </div>
  );
}
