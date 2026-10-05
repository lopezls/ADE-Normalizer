import type { Metadata } from "next";
import ChecklistPanel from "@/components/call/ChecklistPanel";
import EncounterPanel from "@/components/call/EncounterPanel";
import TranscriptStrip from "@/components/call/TranscriptStrip";
import RecommendationsPanel from "@/components/call/RecommendationsPanel";
import {
  SAMPLE_CHECKLIST,
  SAMPLE_RECOMMENDATION,
  SAMPLE_TRANSCRIPT,
} from "@/components/call/sampleData";

export const metadata: Metadata = { title: "Live Call | Rx Call Aide" };

export default function CallPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Live Call</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Layout preview with placeholder content. Dupixent (asthma), fictional call.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          End call
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        <ChecklistPanel items={SAMPLE_CHECKLIST} />
        <div className="space-y-4">
          <EncounterPanel />
          <TranscriptStrip transcript={SAMPLE_TRANSCRIPT} />
        </div>
        <RecommendationsPanel recommendations={[SAMPLE_RECOMMENDATION]} />
      </div>
    </main>
  );
}
