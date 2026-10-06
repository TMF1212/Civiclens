import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, Tag, td, th } from "@/components/rl";
import { useAppStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/_dash/data")({
  head: () => meta("Election Data", "Import CSV, JSON and result-sheet images with validation, preview, OCR review and full audit history."),
  component: Page,
});

const FIELDS = ["election_id", "state", "lga", "ward", "polling_unit_id", "polling_unit_name", "accredited_voters", "votes_cast", "candidate_results", "irev_total", "official_total", "result_image_url", "source_url", "timestamp"];
const REQUIRED = ["polling_unit_id"];
const NUMERIC = ["accredited_voters", "votes_cast", "irev_total", "official_total"];

type Row = Record<string, string>;
function parseCSV(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((l) => Object.fromEntries(l.split(",").map((v, i) => [head[i], v.trim()])));
}
function validate(r: Row): string[] {
  const e: string[] = [];
  REQUIRED.forEach((f) => !r[f] && e.push(`${f} missing`));
  NUMERIC.forEach((f) => r[f] && isNaN(Number(r[f])) && e.push(`${f} not numeric`));
  if (r.votes_cast && r.accredited_voters && Number(r.votes_cast) > Number(r.accredited_voters)) e.push("votes_cast > accredited (will be flagged)");
  return e;
}

function Page() {
  const { addImport, imports, audit, sharedDataLoading, sharedDataError, electionId } = useAppStore();
  const [preview, setPreview] = useState<{ file: string; kind: string; rows: Row[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ocr, setOcr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onFile = async (f: File | undefined, kind: "CSV" | "JSON") => {
    if (!f) return;
    setErr(null);
    try {
      const text = await f.text();
      const rows: Row[] = kind === "CSV" ? parseCSV(text) : (JSON.parse(text) as Row[]);
      if (!Array.isArray(rows) || !rows.length) throw new Error("File contains no records");
      setPreview({ file: f.name, kind, rows });
    } catch (e) {
      setErr(`Import failed: ${(e as Error).message}`);
    }
  };
  const valid = preview?.rows.filter((r) => validate(r).filter((x) => !x.includes("flagged")).length === 0).length ?? 0;
  const cols = preview ? FIELDS.filter((f) => preview.rows.some((r) => r[f] != null && r[f] !== "")) : [];

  return (
    <>
      <PageHeader title="Election Data" sub="Import structured result data. Only polling_unit_id is required; other fields are optional. Source values are never silently overwritten." />
      {sharedDataError && <div className="mb-4 rounded-sm border border-warn/25 bg-warn-soft px-3 py-2 text-[12px] text-warn">Shared records could not be loaded or saved. Check your connection and try again.</div>}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Upload CSV"><input type="file" accept=".csv" onChange={(e) => onFile(e.target.files?.[0], "CSV")} className="text-[12px]" /></Panel>
        <Panel title="Upload JSON"><input type="file" accept=".json" onChange={(e) => onFile(e.target.files?.[0], "JSON")} className="text-[12px]" /></Panel>
        <Panel title="Upload result-sheet image">
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setOcr(e.target.files[0].name)} className="text-[12px]" />
        </Panel>
      </div>
      {err && <div className="mt-4 rounded-sm border border-warn/25 bg-warn-soft px-3 py-2 text-[12px] text-warn">{err}</div>}

      {ocr && (
        <Panel title={`OCR pipeline · ${ocr}`} className="mt-4">
          <ol className="flex flex-wrap items-center gap-2 text-[11px]">
            {["Result sheet image", "OCR", "Extract candidate names", "Extract vote counts", "Validate", "Human confirmation", "Database"].map((s, i) => (
              <li key={s} className="flex items-center gap-2"><Tag tone={i === 0 ? "ok" : i === 1 ? "warn" : "neutral"}>{s}</Tag>{i < 6 && <span className="text-muted-foreground">→</span>}</li>
            ))}
          </ol>
          <div className="mt-4"><EmptyState title="OCR service not connected" body="The image was received but no OCR engine is configured in demo mode, so no values were extracted. When connected, extracted values show an OCR confidence score and must be reviewed and confirmed by a person before saving." /></div>
        </Panel>
      )}

      {preview && (
        <Panel title={`Import preview · ${preview.file}`} meta={`${valid}/${preview.rows.length} valid rows`} className="mt-4" bodyClass="p-0">
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 border-b border-border bg-panel"><tr>{cols.map((c) => <th key={c} className={th}>{c}</th>)}<th className={th}>Validation</th></tr></thead>
              <tbody className="divide-y divide-border">
                {preview.rows.slice(0, 50).map((r, i) => {
                  const e = validate(r);
                  return <tr key={i}>{cols.map((c) => <td key={c} className={`${td} num`}>{r[c] ?? ""}</td>)}<td className={td}>{e.length ? <span className="text-warn">{e.join("; ")}</span> : <Tag tone="ok">OK</Tag>}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 border-t border-border p-3">
            <Button variant="outline" size="sm" className="rounded-sm" disabled={saving} onClick={() => setPreview(null)}>Cancel</Button>
            <Button size="sm" className="rounded-sm" disabled={saving || valid === 0} onClick={async () => {
              const validRows = preview.rows.filter((r) => validate(r).filter((x) => !x.includes("flagged")).length === 0);
              setSaving(true);
              try {
                await addImport({ at: new Date().toISOString(), file: preview.file, kind: preview.kind, rows: preview.rows.length, valid, status: "Saved" }, validRows);
                setPreview(null);
                toast.success("Import saved and shared.");
              } catch {
                toast.error("Could not save this import. Please try again.");
              } finally {
                setSaving(false);
              }
            }}>{saving ? "Saving…" : `Import ${valid} records`}</Button>
          </div>
        </Panel>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Import history" bodyClass="p-0">
          {sharedDataLoading ? <p className="p-4 text-[12px] text-muted-foreground">Loading shared import history…</p> : imports.length === 0 ? <p className="p-4 text-[12px] text-muted-foreground">No shared imports for this election.</p> : (
            <table className="w-full text-[12px]"><thead className="border-b border-border"><tr><th className={th}>Time</th><th className={th}>File</th><th className={th}>Rows</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-border">{imports.map((i) => <tr key={i.id ?? i.at}><td className={`${td} num`}>{new Date(i.at).toLocaleString()}</td><td className={td}>{i.file}</td><td className={`${td} num`}>{i.valid}/{i.rows}</td><td className={td}>{i.status}</td></tr>)}</tbody>
            </table>
          )}
        </Panel>
        <Panel title="Audit log" meta="append-only" bodyClass="p-0 max-h-72 overflow-y-auto">
          <ul className="divide-y divide-border text-[12px]">
            {sharedDataLoading ? <li className="px-4 py-3 text-muted-foreground">Loading shared activity…</li> : audit.map((a, i) => <li key={`${a.at}-${i}`} className="flex gap-3 px-4 py-2"><span className="num shrink-0 text-muted-foreground">{new Date(a.at).toLocaleString()}</span><span className="font-medium">{a.action}</span><span className="truncate text-muted-foreground">{a.detail}</span></li>)}
          </ul>
        </Panel>
      </div>
      <Panel title="Supported CSV fields" meta={`Shared election · ${electionId}`} className="mt-4"><p className="num text-[11px] text-muted-foreground">{FIELDS.join(", ")}</p></Panel>
    </>
  );
}
