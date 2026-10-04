// Service layer. UI depends only on these functions. Today they read the synthetic demo dataset;
// later swap implementations for FastAPI (API_BASE_URL) / database calls without touching UI.
import { ELECTIONS, generateDemoRecords } from "./demo-data";
import { verifyRecords } from "./verification";
import { loadEc8aRecords } from "./ec8a-data";
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

export const severityRank: Record<Severity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
