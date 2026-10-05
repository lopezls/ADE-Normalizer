# Progress

*Last updated: 2026-10-05. Stage 1 (scripted call) is built and tested; not yet deployed.*

## Finished this session

| Piece | Commit |
|---|---|
| Rebrand to Rx Call Aide, demo banner, drug list cut to Dupixent / Jascayd / Tymlos, nav, `/data` page, docs added | `809791d` |
| Static `/call` page: checklist, encounter form in the middle, recommendations | `e552c17` |
| Rule IDs added to Rules.md; `npm run rules:build` makes `content/rules.json`; drift tests; vitest | `3d2a699` |
| Demo Call 1 script file and line-by-line playback | `7ea8866` |
| Call state, reducer, replay mode, final chart note | `054c2c6` |
| `/api/analyze`: Claude reads one line, code checks the answer | `e0ca61f` |
| Screen wired to live AI (Live / Replay switch, retry, skip); `npm run eval` | `4dcb74b` |
| Wording-variant live tests, consent rule, README, Privacy and Home fixes | `8bf2e78` |

Checks: 47 offline tests pass, build passes. Live model: all 24 rows of the Demo-Call table and all 13 wording variants passed 3 runs in a row.

## In progress or half-done

- **Not deployed.** The public site still shows the old form. Before deploying: set a monthly spend limit in the Anthropic console, add `ANTHROPIC_API_KEY` to Vercel as a sensitive variable.
- **Call page saves nothing.** End call gives a copyable note only. Saving encounters in sequence needs `patient_id` made optional in the database (not done, needs your OK).
- **Original form at `/` still asks for a Patient ID** and still saves the old way.
- **Small step-8 leftovers:** no manual checklist toggle; if you edit the Events box, a second event later in the call is not added to your text.
- **Replay file is hand-written** to match Demo-Call.md, not recorded from the model.
- **Wiki not synced.** `docs/` is the working copy; `ADE-Normalizer.wiki/` is out of date (new rule IDs, Privacy and Home edits).

## Exact next step

Open `/call` in the browser and run Demo Call 1 in **Live AI** and **Replay**, then force a failure (blank the key in `.env.local`) to see the Retry banner. Tell me anything that looks or behaves wrong. After that: spend limit, then deploy.

Then stage 2, in small pieces: typed-line mode, audio file upload, live microphone.

## Decisions and why

- **The AI only labels; code decides.** Claude returns IDs and quotes. Recommendation text comes from `rules.json` and is never shown to the model, so it can't rewrite advice.
- **No seriousness, cause or advice fields exist** in the AI's answer. A prompt is a request; a missing field is a wall.
- **Seriousness default is set by code**, only when the patient reports no ER visit or hospitalization, and you must confirm it at End call.
- **Rules.md is the source of truth.** A script builds `rules.json` from it; a test fails if they drift.
- **Encounter form is the center panel,** AI-typed and editable. Fields you edit are never overwritten.
- **Patient ID removed from the call page.** Stage 1 stores nothing.
- **Three drugs only.** The two extra drugs were removed from the list.
- **Server only analyzes text from the script,** so the public URL can't be used as a free chatbot.
- **Default model is Haiku 4.5** for speed (about 1.5 s per line); override with `ANTHROPIC_MODEL`.
- **Any consent answer completes S-04 in code,** after a prompt-only fix made other steps worse.

## Open questions for you

1. Replace the original `/` form with the call page, or keep both?
2. Save call encounters to the database (needs the schema change and a fix so `/data` reads standardized labels)?
3. Review the new IDs I added to Rules.md (S-01 to S-06, G-01 to G-05).
4. Trim Dupixent's indications in the form to asthma, or leave all three?
5. Speech-to-text provider for stage 2 (open in your docs).
6. Are rules D1-02 / D1-03 / D1-06 trigger phrases too close ("itchy", "redness", "swelling")?

## Broken or unsure

- **Nothing known broken,** but I have not seen the UI in a browser. Only code, tests and API calls were verified.
- **Prompt changes can regress other lines.** One extra sentence dropped S-04 and S-06 to 0 to 1 out of 3. Re-run `RUNS=3 npm run eval` after any prompt edit.
- **Only one call and 13 single lines are tested,** 3 runs each. Real speech will be messier.
- **Nemluvio and Rezdiffra rows are hidden from `/data`** (still in the database).
- **Spoken text goes to Anthropic.** Fine for fictional data; Privacy.md says so.
- **Project lives in OneDrive,** so `.env.local` syncs to the cloud.
- **`rules:build` needs Node 24;** `@types/node` was bumped to 24 for vitest 5.
- **First request after a dev-server start took about 9 s** (compile), later ones 1 to 2 s.
