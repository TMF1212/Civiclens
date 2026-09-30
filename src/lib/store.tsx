import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ReviewStatus } from "./types";

export interface AuditEntry { at: string; action: string; detail: string }
export interface ImportEntry { at: string; file: string; kind: string; rows: number; valid: number; status: string }

interface Ctx {
  electionId: string;
  setElectionId: (id: string) => void;
  reviews: Record<string, ReviewStatus>;
  setReview: (id: string, s: ReviewStatus, note?: string) => void;
  audit: AuditEntry[];
  log: (action: string, detail: string) => void;
  imports: ImportEntry[];
  addImport: (i: ImportEntry) => void;
}

const C = createContext<Ctx | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [electionId, setE] = useState("ekiti-gov-2026");
  const [reviews, setReviews] = useState<Record<string, ReviewStatus>>({});
  const [audit, setAudit] = useState<AuditEntry[]>([
    { at: new Date().toISOString(), action: "Data imported", detail: "Demo / synthetic dataset loaded (session)" },
    { at: new Date().toISOString(), action: "Verification performed", detail: "8 rules executed on all records" },
  ]);
  const [imports, setImports] = useState<ImportEntry[]>([]);

  useEffect(() => {
    const s = localStorage.getItem("rl-election");
    if (s) setE(s);
  }, []);

  const log = (action: string, detail: string) =>
    setAudit((a) => [{ at: new Date().toISOString(), action, detail }, ...a]);

  return (
    <C.Provider
      value={{
        electionId,
        setElectionId: (id) => {
          setE(id);
          localStorage.setItem("rl-election", id);
          log("Election selected", id);
        },
        reviews,
        setReview: (id, s, note) => {
          setReviews((r) => ({ ...r, [id]: s }));
          log("Reviewer decision", `${id} → ${s}${note ? ` — ${note}` : ""}`);
        },
        audit,
        log,
        imports,
        addImport: (i) => {
          setImports((x) => [i, ...x]);
          log("Data imported", `${i.file} (${i.valid}/${i.rows} valid rows)`);
        },
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
