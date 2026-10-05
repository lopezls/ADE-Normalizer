// Converts docs/Rules.md into content/rules.json.
// Rules.md is the file the pharmacist edits; rules.json is generated. Run: npm run rules:build
// Self-contained on purpose so Node can run it directly (no bundler, no imports).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(root, "docs/Rules.md");
const OUT = resolve(root, "content/rules.json");

type Kind = "ade" | "missed-dose" | "call-step" | "general";
type Rule = {
  id: string;
  kind: Kind;
  drug: string | null;
  triggerPhrases: string[];
  label: string | null;
  recommendation: string | null;
  contactPhysicianWhen: string | null;
  description: string | null;
  source: { name: string; url?: string };
};

const ID_RE = /^(D\d+-\w{2}|S-\d{2}|G-\d{2})$/;

const cells = (line: string) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

const strip = (s: string) => s.replace(/\*\*/g, "").trim();

function parseSource(raw: string): Rule["source"] {
  const m = raw.match(/^\[(.+?)\]\((.+?)\)$/);
  return m ? { name: m[1], url: m[2] } : { name: raw.trim() };
}

function sectionKind(heading: string): Kind | null {
  const h = heading.toLowerCase();
  if (h.startsWith("ade rules")) return "ade";
  if (h.startsWith("missed-dose rule")) return "missed-dose";
  if (h.startsWith("call steps")) return "call-step";
  if (h.startsWith("rules that apply to every drug")) return "general";
  return null; // counseling topics etc. are not rules in stage 1
}

function build(md: string) {
  const lines = md.split(/\r?\n/);
  const rules: Rule[] = [];
  let drug: string | null = null;
  let kind: Kind | null = null;
  let header: string[] | null = null;
  let indication = "";
  let reviewed = "";

  const col = (row: string[], prefix: string) => {
    const i = header!.findIndex((h) => h.toLowerCase().startsWith(prefix));
    return i >= 0 ? (row[i] ?? "") : "";
  };

  for (const line of lines) {
    const rev = line.match(/Last reviewed:\s*(\d{2})\/(\d{2})\/(\d{4})/);
    if (rev) reviewed = `${rev[3]}-${rev[1]}-${rev[2]}`;
    const ind = line.match(/^\*\*Indication\(s\):\*\*\s*(.+?)\s*$/);
    if (ind) indication = ind[1];

    const drugH = line.match(/^## Drug \d+:\s*(.+?)\s*$/);
    if (drugH) { drug = drugH[1]; kind = null; header = null; continue; }
    const h = line.match(/^#{2,3}\s+(.+?)\s*$/);
    if (h) {
      kind = sectionKind(h[1]);
      if (h[1].toLowerCase().startsWith("rules that apply")) drug = null;
      header = null;
      continue;
    }
    if (!kind || !line.startsWith("|")) continue;
    if (!header) { header = cells(line); continue; }
    if (/^\|[\s\-|:]+\|?$/.test(line)) continue;

    const row = cells(line);
    const id = strip(col(row, "rule id") || col(row, "id"));
    if (!ID_RE.test(id)) throw new Error(`Bad or missing rule ID "${id}" in row: ${line.slice(0, 80)}`);

    const base: Rule = {
      id, kind, drug: kind === "call-step" || kind === "general" ? null : drug,
      triggerPhrases: [], label: null, recommendation: null,
      contactPhysicianWhen: null, description: null, source: { name: "Not cited" },
    };
    if (kind === "ade") {
      base.triggerPhrases = col(row, "patient might say").split(",").map((s) => s.trim()).filter(Boolean);
      base.label = col(row, "standardized label");
      base.recommendation = col(row, "recommendation");
      base.contactPhysicianWhen = col(row, "contact physician");
      base.source = parseSource(col(row, "source"));
    } else if (kind === "missed-dose") {
      base.label = "Missed dose";
      base.description = col(row, "situation");
      base.recommendation = col(row, "recommendation");
      base.source = parseSource(col(row, "source"));
    } else if (kind === "call-step") {
      base.label = strip(col(row, "step"));
      base.description = col(row, "key points");
      base.source = parseSource(col(row, "source"));
    } else {
      base.label = strip(col(row, "rule"));
      base.description = col(row, "behavior");
    }
    rules.push(base);
  }

  const seen = new Set<string>();
  for (const r of rules) {
    if (seen.has(r.id)) throw new Error(`Duplicate rule ID ${r.id}`);
    seen.add(r.id);
  }
  if (!reviewed) throw new Error("Could not find 'Last reviewed: MM/DD/YYYY' in Rules.md");
  return { generatedFrom: "docs/Rules.md", reviewed, indication, rules };
}

const result = build(readFileSync(SRC, "utf8"));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
console.log(`Wrote ${result.rules.length} rules to content/rules.json`);
