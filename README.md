# Rx Call Aide

Demo of live checklist and decision support for pharmacist patient check-in calls. A fictional scripted call plays line by line; an AI reads each line, and the screen fills in a checklist, an encounter form and rule-based recommendations. **Demo only, not for clinical use. No real patient information.**

Requirements and design live in [docs/](docs/): `Home.md` (requirements), `Rules.md` (pharmacist-authored rules), `Demo-Call.md` (the script and expected behavior), `Privacy.md`, `Screen-Layout.md`, and `PROGRESS.md` (where the build stands).

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000, call screen at /call
```

| Variable | Needed for |
|---|---|
| `ANTHROPIC_API_KEY` | Live AI on `/call` (server only; never prefix with `NEXT_PUBLIC_`). Without it, use the Replay switch. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-haiku-4-5`. |
| `STORAGE_DATABASE_URL` (or `DATABASE_URL`) | The original encounter form and `/data` (Neon Postgres). |
| `PATIENT_ID_SECRET` | The original encounter form (hashes the patient ID). |

## Commands

| Command | What it does |
|---|---|
| `npm test` | Offline tests: rules, script, reducer, safety checks. Free and deterministic. |
| `npm run eval` | Plays Demo Call 1 and wording variants through the **real** model. Costs money. `RUNS=3 npm run eval` repeats. |
| `npm run rules:build` | Regenerates `content/rules.json` from `docs/Rules.md`. Run after editing the rules. |
| `npm run lint` | ESLint. |

## How the AI part works

The model only reads and labels. For each line, the server (`/api/analyze`) asks Claude what the line shows and gets back structured JSON containing IDs only. Code then checks it (quotes must be word-for-word, speaker rules, no dates of birth) and decides the checklist and recommendations. Recommendation text always comes from `content/rules.json`; the model never sees it. See `lib/call/`.
