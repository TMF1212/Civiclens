// Verification rule engine. Pure functions — no UI. Mirrors what the Python service will compute.
// Flags describe records that warrant human review; they are never findings of wrongdoing.
import type { Flag, ResultRecord, Severity, VerifiedRecord } from "./types";

export const RULES = [
  { code: "TOTAL_MISMATCH", name: "Result total mismatch", test: "IReV total ≠ official total" },
  { code: "OVER_ACCREDITATION", name: "Votes exceed accredited voters", test: "Votes cast > accredited voters" },
  { code: "CANDIDATE_SUM", name: "Candidate total inconsistency", test: "Sum of candidate votes ≠ reported total" },
  { code: "MISSING_RESULT", name: "Missing result", test: "No IReV upload for polling unit" },
  { code: "INCOMPLETE_RESULT", name: "Incomplete result", test: "Upload exists but extracted values incomplete" },
  { code: "DUPLICATE_RECORD", name: "Duplicate record", test: "Polling-unit identifier appears more than once" },
  { code: "UNUSUAL_TURNOUT", name: "Unusual turnout pattern", test: "Turnout > 85% or robust z-score > 3" },
  { code: "UNUSUAL_SPATIAL", name: "Unusual spatial pattern", test: "Leading share deviates > 30 pts from ward peers" },
] as const;

const sum = (o: Record<string, number | null>) =>
  Object.values(o).reduce<number>((a, b) => a + (b ?? 0), 0);
const fmt = (n: number) => n.toLocaleString("en-NG");

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function leaderShare(r: ResultRecord): number | null {
  if (!r.irev) return null;
  const vals = Object.values(r.irev.candidates).map((v) => v ?? 0);
  const t = vals.reduce((a, b) => a + b, 0);
  return t ? Math.max(...vals) / t : null;
}

export function verifyRecords(records: ResultRecord[]): VerifiedRecord[] {
  // Election-wide turnout baseline using median/MAD (robust to outliers).
  const turnouts = records.filter((r) => r.accredited != null).map((r) => r.accredited! / r.registered);
  const med = turnouts.length ? median(turnouts) : 0;
  const mad = turnouts.length ? median(turnouts.map((t) => Math.abs(t - med))) || 0.01 : 0.01;

  const codeCount = new Map<string, number>();
  records.forEach((r) => codeCount.set(r.puCode, (codeCount.get(r.puCode) ?? 0) + 1));

  return records.map((r) => {
    const flags: Flag[] = [];
    const add = (f: Omit<Flag, "recordId">) => flags.push({ ...f, recordId: r.id });
    const irevTotal = r.irev?.declaredTotal ?? null;
    const officialTotal = r.official?.declaredTotal ?? null;
    const difference = irevTotal != null && officialTotal != null ? irevTotal - officialTotal : null;
    const turnout = r.accredited != null ? r.accredited / r.registered : null;

    // Rule 4 — Missing result
    if (!r.irevUploaded || !r.irev) {
      add({ code: "MISSING_RESULT", rule: "Missing result", detected: "No upload", expected: "Uploaded result sheet", explanation: "No polling-unit result upload was found for this unit in the source dataset.", severity: "MEDIUM" });
    }
    // Rule 5 — Incomplete result
    if (r.irev && (r.irev.declaredTotal == null || Object.values(r.irev.candidates).some((v) => v == null))) {
      const missing = Object.entries(r.irev.candidates).filter(([, v]) => v == null).map(([k]) => k);
      add({ code: "INCOMPLETE_RESULT", rule: "Incomplete result", detected: `${missing.length} field(s) unreadable${r.irev.declaredTotal == null ? " + total" : ""}`, expected: "All candidate values and total extracted", explanation: `The result sheet exists but values could not be fully extracted (${missing.join(", ") || "total"}). OCR confidence ${r.ocrConfidence ? Math.round(r.ocrConfidence * 100) + "%" : "n/a"}.`, severity: "LOW" });
    }
    // Rule 1 — Total mismatch
    if (difference != null && difference !== 0) {
      const sev: Severity = Math.abs(difference) >= 100 ? "HIGH" : Math.abs(difference) >= 20 ? "MEDIUM" : "LOW";
      add({ code: "TOTAL_MISMATCH", rule: "Result total mismatch", detected: `IReV ${fmt(irevTotal!)}`, expected: `Official ${fmt(officialTotal!)}`, explanation: `IReV total differs from the corresponding official total by ${fmt(Math.abs(difference))} votes.`, severity: sev });
    }
    // Rule 2 — Votes exceed accreditation
    if (irevTotal != null && r.accredited != null && irevTotal > r.accredited) {
      add({ code: "OVER_ACCREDITATION", rule: "Votes exceed accredited voters", detected: `${fmt(irevTotal)} votes`, expected: `≤ ${fmt(r.accredited)} accredited`, explanation: `Reported votes exceed accredited voters by ${fmt(irevTotal - r.accredited)}.`, severity: "HIGH" });
    }
    // Rule 3 — Candidate sum inconsistency
    if (r.irev && r.irev.declaredTotal != null && !Object.values(r.irev.candidates).some((v) => v == null)) {
      const s = sum(r.irev.candidates);
      if (s !== r.irev.declaredTotal) {
        add({ code: "CANDIDATE_SUM", rule: "Candidate total inconsistency", detected: `Sum ${fmt(s)}`, expected: `Declared ${fmt(r.irev.declaredTotal)}`, explanation: `Candidate votes add up to ${fmt(s)} but the sheet declares ${fmt(r.irev.declaredTotal)} total valid votes.`, severity: "MEDIUM" });
      }
    }
    // Rule 6 — Duplicate identifier
    if ((codeCount.get(r.puCode) ?? 0) > 1) {
      add({ code: "DUPLICATE_RECORD", rule: "Duplicate record", detected: `${codeCount.get(r.puCode)} records`, expected: "1 record per PU code", explanation: `Polling-unit identifier ${r.puCode} appears more than once in the dataset.`, severity: "MEDIUM" });
    }
    // Rule 7 — Unusual turnout (robust z-score)
    let z = 0;
    if (turnout != null) {
      z = (turnout - med) / (1.4826 * mad);
      if (turnout > 0.85 || Math.abs(z) > 3) {
        add({ code: "UNUSUAL_TURNOUT", rule: "Unusual turnout pattern", detected: `${(turnout * 100).toFixed(1)}%`, expected: `~${(med * 100).toFixed(1)}% (median)`, explanation: `Turnout is ${Math.abs(z).toFixed(1)} robust deviations from the election median.`, severity: turnout > 0.9 ? "HIGH" : "MEDIUM" });
      }
    }
    return { ...r, status: "MATCH" as VerifiedRecord["status"], irevTotal, officialTotal, difference, turnout, flags, anomalyScore: Math.min(1, Math.abs(z) / 6) };
  }).map((v, _i, all) => {
    // Rule 8 — Spatial: compare with ward peers
    const own = leaderShare(v);
    const peers = all.filter((p) => p.ward === v.ward && p.lga === v.lga && p.id !== v.id).map(leaderShare).filter((x): x is number => x != null);
    if (own != null && peers.length >= 2) {
      const ref = median(peers);
      if (Math.abs(own - ref) > 0.3) {
        v.flags.push({ recordId: v.id, code: "UNUSUAL_SPATIAL", rule: "Unusual spatial pattern", detected: `Leader share ${(own * 100).toFixed(0)}%`, expected: `Ward peers ~${(ref * 100).toFixed(0)}%`, explanation: "Leading-candidate share differs sharply from neighbouring polling units in the same ward.", severity: "LOW" });
        v.anomalyScore = Math.max(v.anomalyScore, Math.min(1, Math.abs(own - ref) * 1.5));
      }
    }
    // Reconciliation status
    v.status = !v.irev ? "MISSING" : v.flags.some((f) => f.code === "INCOMPLETE_RESULT") ? "INCOMPLETE" : !v.official ? "PENDING" : v.difference !== 0 ? "MISMATCH" : "MATCH";
    return v;
  });
}
