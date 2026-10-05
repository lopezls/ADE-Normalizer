# Rx Call Aide

*Live checklist and decision support for pharmacist patient check-in calls.*

> **Demo project.** Built on my own time and separate from any employer's systems. It uses scripted, fictional calls only, stores no patient identifiers, and is not a clinical decision tool.

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
| 2 | Live microphone, WebSocket, and streaming transcription | Planned |

## Scope

- Browser-based demo, not real phone calls
- Pharmacist-authored rules for three drugs, starting with Dupixent (asthma)
- Advisory only; the tool drafts a note and never submits anything

## Privacy

- No patient identifiers are collected; entered IDs are replaced with a sequential number
- Date of birth and name spoken on a call are used only to tick the identity step and are not saved
- The transcript is shown during the call and discarded when the session ends

See [Privacy & Safety](https://github.com/lopezls/ADE-Normalizer/wiki/Privacy) for details.

## Built with

Next.js, deployed on Vercel. Stage 2 adds a separate persistent service for the WebSocket connection and a streaming speech-to-text provider.


## Documentation

- [Business requirements and use cases](https://github.com/lopezls/ADE-Normalizer/wiki)
- [Screen layout](https://github.com/lopezls/ADE-Normalizer/wiki/Screen-Layout)
- [Rules table](https://github.com/lopezls/ADE-Normalizer/wiki/Rules)
- [Demo call script](https://github.com/lopezls/ADE-Normalizer/wiki/Demo-Call)
- [Privacy & safety](https://github.com/lopezls/ADE-Normalizer/wiki/Privacy)

## Author

Lorelei Lopez, PharmD, MBA, [github.com/lopezls](https://github.com/lopezls)
