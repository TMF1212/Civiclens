// DEMO / SYNTHETIC DATA — generated deterministically. These are NOT real election results.
// Replace via src/lib/api.ts once the IReV collector / database is connected.
import type { Election, ResultRecord, SourceResult } from "./types";

export const CANDIDATES = ["Candidate A", "Candidate B", "Candidate C", "Candidate D"];

export const ELECTIONS: Election[] = [
  {
    id: "ekiti-gov-2026",
    name: "Ekiti Governorship Election 2026",
    type: "governorship",
    date: "2026-06-20",
    states: ["Ekiti"],
    candidates: CANDIDATES,
    dataSource: "demo",
    lastUpdated: "2026-06-21T14:32:00+01:00",
    hasData: true,
  },
  {
    id: "osun-gov-2026",
    name: "Osun Governorship Election 2026",
    type: "governorship",
    date: "2026-08-08",
    states: ["Osun"],
    candidates: CANDIDATES,
    dataSource: "demo",
    lastUpdated: "2026-08-09T11:05:00+01:00",
    hasData: true,
  },
  {
    id: "ng-general-2023",
    name: "Nigeria General Election 2023",
    type: "general",
    date: "2023-02-25",
    states: [],
    candidates: [],
    dataSource: "demo",
    lastUpdated: null,
    hasData: false,
  },
];

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Scenario =
  | "match"
  | "mismatch"
  | "missing"
  | "over"
  | "sum"
  | "turnout"
  | "incomplete"
  | "spatial"
  | "duplicate"
  | "pending";

interface Layout {
  state: string;
  code: string;
  lgas: { name: string; wards: number }[];
  pusPerWard: number;
  scenarios: Record<number, [Scenario, number?]>;
  seed: number;
}

const LAYOUTS: Record<string, Layout> = {
  "ekiti-gov-2026": {
    state: "Ekiti",
    code: "EK",
    lgas: [
      { name: "Ado Ekiti", wards: 3 },
      { name: "Ikere", wards: 2 },
      { name: "Ijero", wards: 2 },
      { name: "Oye", wards: 2 },
    ],
    pusPerWard: 4,
    seed: 2026,
    scenarios: {
      1: ["match"],
      2: ["mismatch", 23],
      5: ["missing"],
      8: ["over"],
      11: ["sum"],
      14: ["turnout"],
      17: ["incomplete"],
      20: ["mismatch", 118],
      23: ["missing"],
      26: ["spatial"],
      29: ["duplicate"],
      32: ["mismatch", 6],
      34: ["missing"],
      35: ["pending"],
    },
  },
  "osun-gov-2026": {
    state: "Osun",
    code: "OS",
    lgas: [
      { name: "Osogbo", wards: 2 },
      { name: "Ilesa East", wards: 2 },
      { name: "Ede North", wards: 2 },
    ],
    pusPerWard: 3,
    seed: 808,
    scenarios: {
      3: ["mismatch", 41],
      6: ["missing"],
      9: ["turnout"],
      12: ["over"],
      15: ["incomplete"],
    },
  },
};

function split(total: number, weights: number[], r: () => number) {
  const w = weights.map((x) => x * (0.8 + r() * 0.4));
  const s = w.reduce((a, b) => a + b, 0);
  const out = w.map((x) => Math.floor((x / s) * total));
  out[0] += total - out.reduce((a, b) => a + b, 0);
  return out;
}

function toRecord(names: string[], votes: number[]) {
  return Object.fromEntries(names.map((n, i) => [n, votes[i]])) as Record<string, number | null>;
}

const cache = new Map<string, ResultRecord[]>();

export function generateDemoRecords(electionId: string): ResultRecord[] {
  if (cache.has(electionId)) return cache.get(electionId)!;
  const L = LAYOUTS[electionId];
  if (!L) return [];
  const r = rng(L.seed);
  const records: ResultRecord[] = [];
  let idx = 0;
  L.lgas.forEach((lga, li) => {
    const base = [0.4 + r() * 0.2, 0.3 + r() * 0.15, 0.15, 0.05];
    for (let w = 1; w <= lga.wards; w++) {
      for (let p = 1; p <= L.pusPerWard; p++) {
        const [scenario, delta = 0] = L.scenarios[idx] ?? ["match"];
        const registered = 500 + Math.floor(r() * 900);
        let accredited = Math.floor(registered * (0.3 + r() * 0.18));
        if (scenario === "turnout") accredited = Math.floor(registered * 0.97);
        const valid = accredited - Math.floor(r() * 12) - 3;
        let votes = split(valid, scenario === "spatial" ? [0.08, 0.86, 0.04, 0.02] : base, r);
        let declared = votes.reduce((a, b) => a + b, 0);
        if (scenario === "over") {
          votes = votes.map((v) => Math.floor(v * 1.18));
          declared = votes.reduce((a, b) => a + b, 0);
        }
        const irevCandidates = toRecord(CANDIDATES, votes);
        let irevDeclared = declared;
        if (scenario === "sum") irevDeclared = declared + 40;
        if (scenario === "incomplete") irevCandidates[CANDIDATES[2]] = null;

        const ts = `${L.code === "EK" ? "2026-06-20" : "2026-08-08"}T${String(15 + (idx % 5)).padStart(2, "0")}:${String((idx * 7) % 60).padStart(2, "0")}:00+01:00`;
        const irev: SourceResult | null =
          scenario === "missing" ? null : { candidates: irevCandidates, declaredTotal: scenario === "incomplete" ? null : irevDeclared, timestamp: ts };

        const offVotes = [...votes];
        if (scenario === "mismatch") offVotes[1] += delta;
        const official: SourceResult | null =
          scenario === "pending"
            ? null
            : {
                candidates: toRecord(CANDIDATES, offVotes),
                declaredTotal: offVotes.reduce((a, b) => a + b, 0) + (scenario === "sum" ? 40 : 0),
                timestamp: null,
              };

        const wardCode = String(w).padStart(2, "0");
        const puNum = String(p).padStart(3, "0");
        let puCode = `${L.code}/${String(li + 1).padStart(2, "0")}/${wardCode}/${puNum}`;
        if (scenario === "duplicate" && records.length) puCode = records[records.length - 1].puCode;

        records.push({
          id: `${electionId}-${String(idx).padStart(4, "0")}`,
          electionId,
          state: L.state,
          lga: lga.name,
          ward: `Ward ${wardCode}`,
          puCode,
          puName: `Polling Unit ${puNum}`,
          registered,
          accredited,
          irevUploaded: scenario !== "missing",
          irev,
          official,
          ocrConfidence: scenario === "missing" ? null : scenario === "incomplete" ? 0.61 : 0.88 + r() * 0.1,
          resultImageUrl: null,
          sourceUrl: null,
          synthetic: true,
        });
        idx++;
      }
    }
  });
  cache.set(electionId, records);
  return records;
}
