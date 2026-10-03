import EncounterForm from "@/components/EncounterForm";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Patient Encounter</h1>
      <p className="mb-8 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Log a patient phone call. ADEs are extracted from the reported events.
      </p>
      <EncounterForm />
    </main>
  );
}
