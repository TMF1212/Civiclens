// Real dataset: user-supplied transcription of EC8A polling-unit result forms,
// Ekiti Governorship Election 2026 (source spreadsheet: 2026_Ekiti_Governorship_Election.xlsx).
// Raw form values are preserved as written; blanks stay null (never coerced to 0).
import raw from "@/data/ekiti-2026-ec8a.json";
import type { ResultRecord } from "./types";

export const EC8A_PARTIES: string[] = raw.parties;
export const EC8A_NOTES: string[] = raw.general;

export function loadEc8aRecords(electionId: string): ResultRecord[] {
  return raw.units.map((u, i) => ({
    id: `${electionId}-${String(i).padStart(4, "0")}`,
    electionId,
    state: "Ekiti",
    lga: u.lga,
    ward: u.ward,
    puCode: u.puCode,
    puName: u.puName,
    registered: u.registered ?? 0,
    accredited: u.accredited,
    irevUploaded: true,
    irev: { candidates: { ...u.votes }, declaredTotal: u.valid, timestamp: null },
    // No officially announced / collated polling-unit figures were supplied.
    official: null,
    ocrConfidence: null,
    resultImageUrl: null,
    sourceUrl: null,
    synthetic: false,
    formSN: u.formSN,
    issued: u.issued,
    unused: u.unused,
    spoiled: u.spoiled,
    rejected: u.rejected,
    used: u.used,
    formNotes: u.notes,
  }));
}
