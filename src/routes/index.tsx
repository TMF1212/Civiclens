import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVIDENCE_STEPS } from "@/components/rl";
import { RULES } from "@/lib/verification";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResultLens NG — Verify Election Results at Scale" },
      { name: "description", content: "Compare polling-unit results with official figures, flag discrepancies and missing uploads, and preserve the evidence for human review." },
      { property: "og:title", content: "ResultLens NG — Verify Election Results at Scale" },
      { property: "og:description", content: "Evidence-based reconciliation of polling-unit results and official election data in Nigeria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  ["Discrepancy checker", "Cross-references each polling-unit result sheet against the officially announced tally for the same unit."],
  ["Upload tracker", "Shows which polling units have missing, delayed, or incomplete result uploads."],
  ["Unusual patterns", "Surfaces turnout beyond accreditation and results inconsistent with neighbouring units."],
  ["Evidence chain", "Every flag links back to its source, raw values, rule and reviewer decision."],
  ["Trace the result", "Follow a polling unit through ward, LGA and state aggregation."],
  ["Human review", "Reviewers record decisions; nothing is labelled as wrongdoing automatically."],
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-sm bg-primary font-mono text-[10px] text-primary-foreground">RL</span>
            <span className="text-[14px] font-semibold">ResultLens NG</span>
          </div>
          <nav className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <Link to="/methodology" className="hidden hover:text-foreground sm:inline">Methodology</Link>
            <Link to="/about" className="hidden hover:text-foreground sm:inline">About</Link>
            <Button asChild size="sm" className="rounded-sm"><Link to="/overview">Explore Demo</Link></Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-7">
          <div className="eyebrow">Civic technology · Politically neutral</div>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">Verify Election Results at Scale.</h1>
          <p className="mt-5 max-w-[56ch] text-[15px] leading-relaxed text-muted-foreground">
            ResultLens NG brings polling-unit results, official figures, validation rules and evidence into one transparent verification workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-sm"><Link to="/overview">Explore Demo <ArrowRight /></Link></Button>
            <Button asChild variant="outline" className="rounded-sm"><a href="#how">How It Works</a></Button>
          </div>
        </div>
        <div className="panel lg:col-span-5">
          <div className="border-b border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Example · PU EK/01/01/003 (synthetic)</div>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border font-mono text-[10px] uppercase text-muted-foreground"><th className="px-4 py-2 text-left font-medium">Candidate</th><th className="px-4 py-2 text-right font-medium">IReV</th><th className="px-4 py-2 text-right font-medium">Official</th></tr></thead>
            <tbody className="num divide-y divide-border">
              <tr><td className="px-4 py-2 font-sans">Candidate A</td><td className="px-4 py-2 text-right">214</td><td className="px-4 py-2 text-right">214</td></tr>
              <tr className="bg-warn-soft/60 text-warn"><td className="px-4 py-2 font-sans font-medium">Candidate B</td><td className="px-4 py-2 text-right font-semibold">131</td><td className="px-4 py-2 text-right font-semibold">154</td></tr>
              <tr><td className="px-4 py-2 font-sans">Candidate C</td><td className="px-4 py-2 text-right">58</td><td className="px-4 py-2 text-right">58</td></tr>
            </tbody>
          </table>
          <p className="border-t border-border px-4 py-3 text-[12px] text-muted-foreground"><b className="text-warn">Discrepancy detected · requires verification.</b> IReV total differs from the official total by 23 votes.</p>
        </div>
      </section>

      <section className="border-y border-border bg-panel">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-2">
          <div>
            <div className="eyebrow">The problem</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Tens of thousands of result sheets. Very little time.</h2>
          </div>
          <p className="text-[14px] leading-relaxed text-muted-foreground">Polling-unit result sheets are published, and collated totals are announced — but checking one against the other by hand does not scale. Observers, journalists and researchers need a systematic way to find the records worth a closer look, with the evidence attached.</p>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-14">
        <div className="eyebrow">How it works · Verification workflow</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">From source to human review</h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {EVIDENCE_STEPS.map((s, i) => (
            <li key={s} className="bg-panel p-4"><div className="num text-[11px] text-primary">{String(i + 1).padStart(2, "0")}</div><div className="mt-1 text-[13px] font-medium">{s}</div></li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="eyebrow">Key features</div>
        <div className="mt-4 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-3">
          {FEATURES.map(([t, d]) => (
            <div key={t} className="bg-panel p-5"><h3 className="text-[14px] font-semibold">{t}</h3><p className="mt-1.5 text-[13px] text-muted-foreground">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-panel">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-2">
          <div>
            <div className="eyebrow">Evidence-based verification</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Eight transparent rules</h2>
            <p className="mt-3 text-[13px] text-muted-foreground">Every flag states the rule, the detected value, the reference value and an explanation. Severity indicates verification priority, not evidence of wrongdoing.</p>
            <p className="mt-4 text-[13px] text-muted-foreground"><b className="text-foreground">Technology:</b> React + TypeScript front end, PostgreSQL-ready data model, and a service layer prepared for a Python verification and ingestion service.</p>
          </div>
          <ul className="divide-y divide-border rounded-sm border border-border">
            {RULES.map((r, i) => (
              <li key={r.code} className="flex gap-3 px-4 py-2.5 text-[13px]"><span className="num text-muted-foreground">R{i + 1}</span><span className="font-medium">{r.name}</span><span className="ml-auto hidden text-muted-foreground sm:inline">{r.test}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-[12px] text-muted-foreground">
        <span>ResultLens NG identifies records that warrant verification. A discrepancy is not, by itself, proof of wrongdoing.</span>
        <span className="flex gap-4"><Link to="/methodology">Methodology</Link><Link to="/about">About</Link></span>
      </footer>
    </div>
  );
}
