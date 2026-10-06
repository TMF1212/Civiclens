// Service layer. UI depends only on these functions. Today they read the synthetic demo dataset;
// later swap implementations for FastAPI (API_BASE_URL) / database calls without touching UI.
import { ELECTIONS, generateDemoRecords } from "./demo-data";
import { verifyRecords } from "./verification";
import { loadEc8aRecords } from "./ec8a-data";
import { supabase } from "@/integrations/supabase/client";
import type { AuditEntry, ImportEntry } from "./store";
import type { ReviewStatus } from "./types";
import type { Flag, Severity, VerifiedRecord } from "./types";

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 60));
const store = new Map<string, VerifiedRecord[]>();

function all(electionId: string) {
  if (!store.has(electionId)) store.set(electionId, verifyRecords(electionId === "ekiti-gov-2026-ec8a" ? loadEc8aRecords(electionId) : generateDemoRecords(electionId)));
  return store.get(electionId)!;
}

export const getElections = () => delay(ELECTIONS);
export const getElection = (id: string) => ELECTIONS.find((e) => e.id === id) ?? ELECTIONS[0];
export const getStates = (e: string) => delay([...new Set(all(e).map((r) => r.state))]);
export const getLGAs = (e: string) => delay([...new Set(all(e).map((r) => r.lga))]);
export const getWards = (e: string, lga: string) => delay([...new Set(all(e).filter((r) => r.lga === lga).map((r) => r.ward))]);

export interface PUQuery { lga?: string; ward?: string; q?: string; page?: number; pageSize?: number }
export function getPollingUnits(e: string, f: PUQuery = {}) {
  const q = f.q?.toLowerCase().trim();
  const rows = all(e).filter(
    (r) =>
      (!f.lga || r.lga === f.lga) &&
      (!f.ward || r.ward === f.ward) &&
      (!q || [r.puCode, r.puName, r.ward, r.lga].some((x) => x.toLowerCase().includes(q))),
  );
  const pageSize = f.pageSize ?? 15;
  const page = f.page ?? 1;
  return delay({ rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize });
}
export const getAllRecords = (e: string) => delay(all(e));
export const getResult = (id: string) => {
  const e = id.replace(/-\d{4}$/, "");
  return delay(all(e).find((r) => r.id === id) ?? null);
};
export const getEvidence = (id: string) =>
  getResult(id).then((r) => (r ? { record: r, file: r.resultImageUrl, source: r.sourceUrl } : null));

export interface DiscrepancyRow extends Flag { record: VerifiedRecord }
export const getDiscrepancies = (e: string) =>
  delay(all(e).flatMap((r) => r.flags.map((f) => ({ ...f, record: r }) as DiscrepancyRow)));
export const getAnomalies = (e: string) =>
  delay(all(e).filter((r) => r.flags.some((f) => f.code === "UNUSUAL_TURNOUT" || f.code === "UNUSUAL_SPATIAL")));
export const runVerification = (e: string) => {
  store.delete(e);
  return delay(all(e));
};

export async function getSharedData(electionId: string) {
  const [reviews, imports, audit] = await Promise.all([
    supabase.from("election_reviews").select("record_id, review_status").eq("election_id", electionId),
    supabase.from("election_imports").select("id, created_at, file_name, kind, row_count, valid_count, status").eq("election_id", electionId).order("created_at", { ascending: false }).limit(100),
    supabase.from("election_audit").select("created_at, action, detail").eq("election_id", electionId).order("created_at", { ascending: false }).limit(100),
  ]);
  if (reviews.error) throw reviews.error;
  if (imports.error) throw imports.error;
  if (audit.error) throw audit.error;
  return {
    reviews: Object.fromEntries((reviews.data ?? []).map((r) => [r.record_id, r.review_status as ReviewStatus])),
    imports: (imports.data ?? []).map((i) => ({ id: i.id, at: i.created_at, file: i.file_name, kind: i.kind, rows: i.row_count, valid: i.valid_count, status: i.status } satisfies ImportEntry)),
    audit: (audit.data ?? []).map((a) => ({ at: a.created_at, action: a.action, detail: a.detail } satisfies AuditEntry)),
  };
}

export async function saveSharedAudit(electionId: string, action: string, detail: string) {
  const { error } = await supabase.from("election_audit").insert({ election_id: electionId, action, detail });
  if (error) throw error;
}

export async function saveSharedReview(electionId: string, recordId: string, status: ReviewStatus, note?: string) {
  const { error } = await supabase.from("election_reviews").upsert(
    { election_id: electionId, record_id: recordId, review_status: status, note: note ?? null },
    { onConflict: "election_id,record_id" },
  );
  if (error) throw error;
  await saveSharedAudit(electionId, "Reviewer decision", `${recordId} → ${status}${note ? ` — ${note}` : ""}`);
}

export async function saveSharedImport(input: {
  electionId: string;
  file: string;
  kind: string;
  rows: number;
  valid: number;
  status: string;
  records: Record<string, string>[];
}) {
  const { data, error } = await supabase.from("election_imports").insert({
    election_id: input.electionId,
    file_name: input.file,
    kind: input.kind,
    row_count: input.rows,
    valid_count: input.valid,
    status: input.status,
    records: input.records,
  }).select("id, created_at, file_name, kind, row_count, valid_count, status").single();
  if (error) throw error;
  await saveSharedAudit(input.electionId, "Data imported", `${input.file} (${input.valid}/${input.rows} valid rows)`);
  return { id: data.id, at: data.created_at, file: data.file_name, kind: data.kind, rows: data.row_count, valid: data.valid_count, status: data.status } satisfies ImportEntry;
}

export const severityRank: Record<Severity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
