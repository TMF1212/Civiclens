// Core domain types. Mirrors the PostgreSQL model (see supabase-schema.sql).

export type DataSource = "demo" | "irev" | "imported";

export interface Election {
  id: string;
  name: string;
  type: "governorship" | "general";
  date: string;
  states: string[];
  candidates: string[];
  dataSource: DataSource;
  /** Human-readable provenance shown in the UI. */
  sourceLabel?: string;
  /** Notes that apply to the whole dataset. */
  datasetNotes?: string[];
  lastUpdated: string | null;
  hasData: boolean;
}

export type ReconStatus = "MATCH" | "MISMATCH" | "MISSING" | "INCOMPLETE" | "PENDING";
export type ReviewStatus =
  | "Unreviewed"
  | "Under Review"
  | "Verified Match"
  | "Confirmed Data Difference"
  | "Insufficient Evidence";
export type Severity = "LOW" | "MEDIUM" | "HIGH";

export type RuleCode =
  | "TOTAL_MISMATCH"
  | "OVER_ACCREDITATION"
  | "CANDIDATE_SUM"
  | "MISSING_RESULT"
  | "INCOMPLETE_RESULT"
  | "DUPLICATE_RECORD"
  | "UNUSUAL_TURNOUT"
  | "UNUSUAL_SPATIAL"
  | "BALLOT_ACCOUNTING"
  | "ISSUED_EXCEEDS_REGISTERED"
  | "ACCREDITED_VS_USED"
  | "FORM_ANNOTATION";

export interface SourceResult {
  /** Candidate -> votes. null value = not extracted. */
  candidates: Record<string, number | null>;
  /** Total valid votes as declared on the sheet/announcement. */
  declaredTotal: number | null;
  timestamp: string | null;
}

export interface ResultRecord {
  id: string;
  electionId: string;
  state: string;
  lga: string;
  ward: string;
  puCode: string;
  puName: string;
  registered: number;
  accredited: number | null;
  irevUploaded: boolean;
  irev: SourceResult | null;
  official: SourceResult | null;
  ocrConfidence: number | null;
  resultImageUrl: string | null;
  sourceUrl: string | null;
  synthetic: boolean;
  /** Full EC8A ballot accounting, when the source provides it. */
  formSN?: string;
  issued?: number | null;
  unused?: number | null;
  spoiled?: number | null;
  rejected?: number | null;
  used?: number | null;
  /** Transcriber notes about the physical form (overwrites, blanks, corrections). */
  formNotes?: string[];
}

export interface Flag {
  code: RuleCode;
  rule: string;
  detected: string;
  expected: string;
  explanation: string;
  severity: Severity;
  recordId: string;
}

export interface VerifiedRecord extends ResultRecord {
  status: ReconStatus;
  irevTotal: number | null;
  officialTotal: number | null;
  difference: number | null;
  turnout: number | null;
  flags: Flag[];
  anomalyScore: number;
}
