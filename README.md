# Rx Call Aide

*Live checklist and decision support for pharmacist patient check-in calls.*

> **Demo project.** Built on my own time and separate from any employer's systems. It is for fictional calls only (scripted, or spoken by you), stores no patient identifiers, and is not a clinical decision tool.

**Live demo (encounter form):** https://ade-normalizer.vercel.app
**Full documentation:** [Project wiki](https://github.com/lopezls/ADE-Normalizer/wiki)

*The repository name (`ADE-Normalizer`) comes from the project's first idea, which grew into the live-call tool described here.*

## The problem

Specialty pharmacists make regular check-in calls to patients on high-cost medications. On every call they have to verify identity, get consent, ask about side effects and missed doses, recognize adverse drug events (ADEs), offer guidance, and document everything. Steps get missed, and ADE details get recorded inconsistently.

## What it does

An AI assistant supports the pharmacist during the call. The pharmacist stays in control.

- **Left: Checklist.** Required steps turn from red to green as the pharmacist completes them. Steps triggered by what the patient says (for example, adherence support after a missed dose) appear in red and are flagged if not covered.
- **Center: Live chart note.** The note builds as the call goes, keeping the patient's exact words next to a standardized label. A collapsible strip shows what the AI heard.
- **Right: Recommendations.** When something the patient reports matches a rule, a suggestion appears with the rule that triggered it.

Nothing is charted, finalized, or reported without the pharmacist's review.

## Status

| Stage | What it is | Status |
|---|---|---|
| Pre-stage | Encounter form with a privacy-by-design patient number | Done |
| 1 | Scripted call streams in; checklist, recommendations, and chart note work | In progress |
| 2 | Live microphone with streaming transcription (Deepgram) | In progress: microphone mode works; speaker labels still being tuned |

## Scope

- Browser-based demo, not real phone calls
- Pharmacist-authored rules for three drugs, starting with Dupixent (asthma)
- Advisory only; the tool drafts a note and never submits anything

## Privacy

- No patient identifiers are collected; saved encounters have no patient ID
- Date of birth and name spoken on a call are used only to tick the identity step and are not saved
- The transcript is shown during the call and discarded when the session ends; only the pharmacist-reviewed ADEs are saved on Submit

See [Privacy & Safety](https://github.com/lopezls/ADE-Normalizer/wiki/Privacy) for details.

## Built with

Next.js on Vercel, Claude for reading each line, Neon Postgres for saved ADEs, and Deepgram for live speech-to-text. The browser streams audio straight to Deepgram using a short-lived token from the server.


## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000, the call screen is the home page
```

| Variable | Needed for |
|---|---|
| `ANTHROPIC_API_KEY` | Live AI on the call screen (server only; never prefix with `NEXT_PUBLIC_`). Without it, use the Replay switch. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-haiku-4-5`. |
| `DEEPGRAM_API_KEY` | Microphone mode: live speech-to-text with speaker labels (server only). |
| `LIVE_CALL_PASSCODE` | Microphone mode passcode. Required in production, optional in local development. |
| `STORAGE_DATABASE_URL` (or `DATABASE_URL`) | Saving encounters and `/data` (Neon Postgres). |

## Commands

| Command | What it does |
|---|---|
| `npm test` | Offline tests: rules, script, reducer, safety checks. Free and deterministic. |
| `npm run eval` | Plays Demo Call 1 and wording variants through the **real** model. Costs money. `RUNS=3 npm run eval` repeats. |
| `npm run rules:build` | Regenerates `content/rules.json` from `docs/Rules.md`. Run after editing the rules. |
| `npm run lint` | ESLint. |

## How the AI part works

The model only reads and labels. For each line, the server (`/api/analyze`) asks Claude what the line shows and gets back structured JSON containing IDs only. Code then checks it (quotes must be word-for-word, speaker rules, no dates of birth) and decides the checklist and recommendations. Recommendation text always comes from `content/rules.json`; the model never sees it. See `lib/call/`.

## Documentation

- [Business requirements and use cases](https://github.com/lopezls/ADE-Normalizer/wiki)
- [Screen layout](https://github.com/lopezls/ADE-Normalizer/wiki/Screen-Layout)
- [Rules table](https://github.com/lopezls/ADE-Normalizer/wiki/Rules)
- [Demo call script](https://github.com/lopezls/ADE-Normalizer/wiki/Demo-Call)
- [Privacy & safety](https://github.com/lopezls/ADE-Normalizer/wiki/Privacy)

## Author

Lorelei Lopez, PharmD, MBA, [github.com/lopezls](https://github.com/lopezls)
