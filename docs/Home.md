# Rx Call Aide

*Live checklist and decision support for pharmacist patient check-in calls.*

> **Demo project.** This is my own project, built on my own time and separate from any employer's systems. The call demo uses scripted, fictional conversations. No patient identifiers are collected or stored, and this is not a clinical decision tool.

---
# Business Requirements & Use Cases


## Problem Statement

Specialty pharmacy patient management programs (PMPs) make regular check-in calls to patients on high-cost, high-risk medications. On every call, the pharmacist has to do several things at once:

- verify who they are speaking with,
- obtain consent for follow-up contact,
- ask about side effects and missed doses,
- recognize reportable adverse drug events (ADEs),
- offer appropriate guidance, and
- document all of it afterward, in the required format, within tight reporting timelines.

As of today, this depends on memory and manual charting in an Excel spreadsheet. Required steps get missed, ADE details are recorded inconsistently, and the pharmacist's attention is split between listening to the patient, writing the note, and making sure every point is covered.

**This project is intended to use an AI assistant to listen to the call, keep a live checklist, suggest guidance when an ADE comes up, and produce a chart-ready note, while the pharmacist stays fully in control.**

## Background

- ADEs reported by patients are passed to manufacturers for post-marketing safety surveillance. Reports are submitted verbatim, as the patient stated them, and the manufacturer's safety team interprets and classifies them.
- Accreditation standards for specialty pharmacy (for example URAC) emphasize documented patient touchpoints and documented clinical assessments. Missing or inconsistent documentation is a common finding.
- Manufacturers often require ADE reporting through contract terms, so documentation gaps can have real consequences for a pharmacy.

## Existing Foundation

The deployed encounter form already provides:

- Drug selection (Dupixent, Jascayd, and Tymlos) with indication options that depend on the drug
- Start of therapy, medication-list changes, events reported, and interventions provided
- A privacy-by-design patient identifier: the entered ID is never stored and is replaced with a sequential patient number

**The new work adds a live layer on top of this form.** The form becomes the structured chart note that the call produces.

## Goals & Success Measures

| Goal | How I'll know it worked (demo scale) |
|---|---|
| Fewer missed required steps | The checklist shows every required step as done or not done at the end of the call, which keeps the pharmacist on track |
| ADEs captured consistently | Each reported event has the patient's verbatim wording and a standardized label |
| Less after-call charting | A complete, copy-ready note exists the moment the call ends |
| Pharmacist is in control | Nothing is charted or finalized without pharmacist review |
| Explainable suggestions | Every recommendation shows which rule triggered it |

## Stakeholders & Users

| Role | Interest |
|---|---|
| **Pharmacist (primary user)** | Completes the call, decides what to say, reviews and approves the note |
| **Patient (indirect)** | Gets consistent counseling and has their reports captured accurately |
| **Pharmacy leadership / QA** | Needs complete, auditable documentation |
| **Manufacturer safety team (downstream)** | Receives reports with the patient's original wording intact |

## Scope

### In scope (v1)
- Browser-based demo, not real phone calls
- Three drugs with pharmacist-authored ADE rules and recommendations
- Live checklist, live recommendation panel, and end-of-call note
- Simulated call mode (scripted transcript) and live microphone mode

### Out of scope (v1)
- Real telephony (for example Twilio) and integration with any pharmacy system
- Automatic submission to manufacturers or the FDA (the tool produces a chart-ready note and does not submit anything)
- Full MedDRA coding (v1 uses simple plain-English standardized labels; a production version would map to MedDRA)
- Statistical signal detection and trend analysis across patients
- Any real patient data

## Business Requirements

Priority: **M** = must have, **S** = should have.
Stage: **1** = simulated call, **2** = live audio.

| ID | Requirement | Priority | Stage |
|---|---|---|---|
| BR-01 | Build the chart note live in the center panel as the call progresses: drug, consent, missed doses, events (verbatim and standardized), and interventions appear as they are detected | M | 1 |
| BR-02 | Track identity verification (name and date of birth confirmed) on the checklist | M | 1 |
| BR-03 | Capture the patient's contact consent: contact me, contact my doctor, both, or neither | M | 1 |
| BR-04 | Record the drug being discussed | M | 1 |
| BR-05 | Capture reported side effects and missed doses | M | 1 |
| BR-06 | Detect when a reported symptom matches a known ADE for the drug, and show a recommendation in the right panel | M | 1 |
| BR-07 | Record the guidance the pharmacist actually gave as the documented intervention | M | 1 |
| BR-08 | Preserve the patient's verbatim wording alongside a standardized label for each event | M | 1 |
| BR-09 | Show each checklist item in red until completed and green when done; any step missed stays visibly red at the end of the call | M | 1 |
| BR-10 | Generate a complete, copy-paste-ready chart note at the end of the call | M | 1 |
| BR-11 | Keep the pharmacist in control: suggestions are advisory, and nothing is finalized without review | M | 1 |
| BR-12 | Store no patient identifiers; the transcript is not saved after the session | M | 1 |
| BR-13 | Show which rule triggered each recommendation | S | 1 |
| BR-14 | Capture live audio from the browser microphone and transcribe it in near real time | M | 2 |
| BR-15 | Update the checklist, chart note, and recommendation panel while the call is still in progress | M | 2 |
| BR-16 | Display a clear "demo, not for clinical use" notice | M | 1 |
| BR-17 | Add checklist items triggered by what the patient reports (for example, adherence support after a missed dose); leave them red if not covered by the end of the call, and flag them in the chart note | M | 1 |
| BR-18 | Show a ✓ / ✗ label on each checklist item, so color is not the only signal | S | 1 |
| BR-19 | Let the pharmacist edit any entry in the chart note during and after the call | S | 1 |
| BR-20 | Show the call transcript in a collapsible strip below the chart note, so the pharmacist can verify what the AI heard; session only, not stored | S | 1 |

## Use Cases

### UC-01: Routine check-in, no adverse event
**Actor:** Pharmacist
**Preconditions:** Call started, drug selected.
**Main flow:**
1. Pharmacist asks for the patient's name and date of birth. Patient confirms.
2. System checks off identity verification.
3. Pharmacist explains the purpose of the call and the reporting of side effects. Patient gives consent for follow-up contact.
4. System records the consent choice.
5. Pharmacist asks about side effects and missed doses. Patient reports none.
6. Call ends. System generates the chart note.

**Postcondition:** Note shows verification done, consent recorded, no events reported.
**Requirements:** BR-01 to BR-05, BR-09, BR-10

### UC-02: Patient reports an adverse event
**Actor:** Pharmacist
**Preconditions:** Identity verified, consent captured.
**Main flow:**
1. Patient says they missed last night's dose and had "a lot of diarrhea."
2. System records the verbatim statement and the missed dose.
3. System matches the symptom to a known ADE for the drug and shows a recommendation panel: *ADE detected: diarrhea. Suggested guidance: replace fluids, anti-diarrheal if needed, contact the doctor if it worsens or if fever develops.*
4. Pharmacist decides what to tell the patient and speaks it.
5. System documents the guidance actually given as the intervention.



**Alternate flow:** Patient attributes the event to something else (for example food poisoning). The event is recorded as reported, including the patient's own attribution. The tool does not decide causality.
**Postcondition:** Verbatim text, standardized label, missed dose, and intervention are all in the note.
**Requirements:** BR-05 to BR-08, BR-11, BR-13

### UC-03: Pharmacist skips a required step
**Actor:** Pharmacist
**Main flow:**
1. Call proceeds, but the pharmacist never obtains contact consent.
2. System leaves "consent captured" unchecked on the checklist.
3. At call end, the unchecked item is clearly visible, and the note reflects that consent was not documented.

**Postcondition:** The gap is visible before the note is finalized.
**Requirements:** BR-03, BR-09, BR-10

### UC-04: Consent variations
**Actor:** Pharmacist
**Main flow:** The patient answers the consent question in one of four ways: contact me, contact my doctor instead, contact either, or no contact. The system records which one, together with the drug name.
**Requirements:** BR-03, BR-04

### UC-05: Review and finalize the note
**Actor:** Pharmacist
**Main flow:**
1. System presents the generated note with the checklist status and every captured event (verbatim and standardized).
2. Pharmacist edits anything incorrect.
3. Pharmacist copies the note into the chart. The system does not submit anything automatically.

**Requirements:** BR-10, BR-11

### UC-06: Conditional step not covered

**Actor:** Pharmacist
**Main flow:**
1. Patient reports a missed dose.
2. System adds "offer adherence tips" to the checklist as a red item.
3. Pharmacist does not offer any adherence suggestion before the call ends.
4. System leaves the item red and flags it in the chart note.

**Postcondition:** The gap is visible before the note is finalized.
**Requirements:** BR-09, BR-10, BR-17

## Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Responsiveness** | In live mode, checklist and recommendations should update within a few seconds (target to be tested) |
| **Explainability** | Each recommendation cites its triggering rule |
| **Privacy** | No identifiers collected; no transcript retention |
| **Safety** | Advisory only; pharmacist always decides |
| **Clarity** | Demo and not-for-clinical-use notices are always visible |

## Assumptions & Constraints

- One-week bootcamp timeline
- Browser microphone only
- Rules and recommendation text are authored by me, a licensed pharmacist, and are demo content, not clinical guidance
- Stack: Next.js on Vercel, plus a separate persistent service for the WebSocket connection (serverless functions cannot hold a live connection)
- Speech-to-text provider to be chosen (streaming-capable)
- An AI model performs the extraction and rule matching, using my rules table

## Delivery Stages

| Stage | What exists | Demoable? |
|---|---|---|
| **Pre-Stage** | Deployed encounter form with privacy-by-design patient number | Yes (done) |
| **1** | Scripted call streams in; checklist, recommendations, and note all work | Yes |
| **2** | Live microphone, WebSocket, and streaming transcription replace the script | Yes, if time allows |

## Traceability

| Use case | Requirements covered |
|---|---|
| UC-01 | BR-01 to BR-05, BR-09, BR-10 |
| UC-02 | BR-05 to BR-08, BR-11, BR-13 |
| UC-03 | BR-03, BR-09, BR-10 |
| UC-04 | BR-03, BR-04 |
| UC-05 | BR-10, BR-11 |
| UC-06 | BR-09, BR-10, BR-17 |
| Live mode (all calls) | BR-14, BR-15 |
| Privacy and demo notice | BR-12, BR-16 |
| Screen layout and accessibility | BR-18, BR-19, BR-20 |