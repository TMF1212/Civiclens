import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSharedData, saveSharedAudit, saveSharedImport, saveSharedReview } from "./api";
import type { ReviewStatus } from "./types";

export interface AuditEntry { at: string; action: string; detail: string }
export interface ImportEntry { id?: string; at: string; file: string; kind: string; rows: number; valid: number; status: string }

interface Ctx {
  electionId: string;
  setElectionId: (id: string) => void;
  reviews: Record<string, ReviewStatus>;
  setReview: (id: string, s: ReviewStatus, note?: string) => Promise<void>;
  audit: AuditEntry[];
  log: (action: string, detail: string) => void;
  imports: ImportEntry[];
  addImport: (i: ImportEntry, rows: Record<string, string>[]) => Promise<void>;
  sharedDataLoading: boolean;
  sharedDataError: boolean;
}

const C = createContext<Ctx | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [electionId, setE] = useState("ekiti-gov-2026-ec8a");
  const [reviews, setReviews] = useState<Record<string, ReviewStatus>>({});
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [imports, setImports] = useState<ImportEntry[]>([]);
  const [sharedDataLoading, setSharedDataLoading] = useState(true);
  const [sharedDataError, setSharedDataError] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("rl-election2");
    if (s) setE(s);
  }, []);

  useEffect(() => {
    let current = true;
    setSharedDataLoading(true);
    void getSharedData(electionId).then((data) => {
      if (!current) return;
      setReviews(data.reviews);
      setImports(data.imports);
      setAudit(data.audit);
      setSharedDataError(false);
    }).catch(() => {
      if (current) setSharedDataError(true);
    }).finally(() => {
      if (current) setSharedDataLoading(false);
    });
    return () => { current = false; };
  }, [electionId]);

  const log = (action: string, detail: string) => {
    const entry = { at: new Date().toISOString(), action, detail };
    setAudit((a) => [entry, ...a]);
    void saveSharedAudit(electionId, action, detail).catch(() => setSharedDataError(true));
  };

  return (
    <C.Provider
      value={{
        electionId,
        setElectionId: (id) => {
          setE(id);
          localStorage.setItem("rl-election2", id);
          const entry = { at: new Date().toISOString(), action: "Election selected", detail: id };
          setAudit((a) => [entry, ...a]);
          void saveSharedAudit(id, entry.action, entry.detail).catch(() => setSharedDataError(true));
        },
        reviews,
        setReview: async (id, s, note) => {
          setReviews((r) => ({ ...r, [id]: s }));
          try {
            await saveSharedReview(electionId, id, s, note);
            setSharedDataError(false);
          } catch (error) {
            setSharedDataError(true);
            throw error;
          }
        },
        audit,
        log,
        imports,
        addImport: async (i, rows) => {
          try {
            const saved = await saveSharedImport({ electionId, file: i.file, kind: i.kind, rows: i.rows, valid: i.valid, status: i.status, records: rows });
            setImports((x) => [saved, ...x]);
            setAudit((a) => [{ at: saved.at, action: "Data imported", detail: `${i.file} (${i.valid}/${i.rows} valid rows)` }, ...a]);
            setSharedDataError(false);
          } catch (error) {
            setSharedDataError(true);
            throw error;
          }
        },
        sharedDataLoading,
        sharedDataError,
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useAppStore() {
  const c = useContext(C);
  if (!c) throw new Error("AppStoreProvider missing");
  return c;
}

export const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("en-NG"));
export const pct = (n: number | null | undefined, d = 1) => (n == null ? "—" : `${(n * 100).toFixed(d)}%`);
export const signed = (n: number | null | undefined) => (n == null ? "—" : n === 0 ? "0" : `${n > 0 ? "+" : "−"}${Math.abs(n).toLocaleString("en-NG")}`);
