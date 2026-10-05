// Hard-coded placeholder content for the static /call shell (step 2).
// Replaced by real call state in later steps.

export type SampleItem = {
  id: string;
  label: string;
  done: boolean;
  conditional?: boolean;
};

export const SAMPLE_CHECKLIST: SampleItem[] = [
  { id: "S-01", label: "Self-identify", done: true },
  { id: "S-02", label: "Recording disclosure", done: true },
  { id: "S-03", label: "Verify patient identity", done: true },
  { id: "S-04", label: "Manufacturer reporting and consent", done: false },
  { id: "S-05", label: "Closing reminder", done: false },
  { id: "S-06", label: "Asked about ER visit / hospitalization", done: false },
  {
    id: "G-01",
    label: "Offer adherence tips (alarms, pill boxes, calendars)",
    done: false,
    conditional: true,
  },
];

export const SAMPLE_TRANSCRIPT = [
  { speaker: "Pharmacist", text: "Have you had any side effects or missed any doses?" },
  {
    speaker: "Patient",
    text: "Yes, I missed last night's dose. I've also had some diarrhea.",
  },
];
