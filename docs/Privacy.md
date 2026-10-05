# Privacy & Safety

*Rx Call Aide is a demo project. It is not a clinical decision tool and is not intended for use with real patient information.*

## What this project is

An AI assistant that supports a pharmacist during a patient check-in call. It keeps a checklist, suggests talking points from a rules table, and drafts a chart note. The pharmacist makes every decision.

## Data handling

- The demo uses scripted, fictional calls only. No real calls, no real patient information, and no information from any employer.
- The original encounter form does not store the entered patient ID itself. It stores a keyed one-way hash of it (pseudonymous, not anonymous) and shows a sequential patient number. The live call screen collects no patient ID at all.
- While a call plays, each line of text is sent to the Anthropic Claude API so it can be analyzed. In the demo that text is a fictional script, including a fictional date of birth. Anthropic's own data handling applies to what it receives. This app keeps none of it.
- The date of birth and name spoken on a call are used only to tick the identity-verification step. They are not saved by this app, and the safety checks remove anything that looks like a date of birth from the AI's answer.
- The transcript is shown on screen during the call so the pharmacist can verify what the AI heard. It lives only in the browser's memory and is discarded when the page is closed or refreshed.

## What the AI is not allowed to decide

- Whether an event is serious. The pharmacist decides.
- Whether a drug caused an event. Events are recorded as the patient states them, including the patient's own explanation.
- What goes in the chart. Nothing is finalized without pharmacist review.
- Whether anything is reported. The tool drafts a note and never submits anything.

## How the tool stays explainable

- Every suggestion shows the rule that triggered it.
- The patient's exact words stay in the note beside the standardized label.
- If nothing matches, the tool says so and does not guess.
- Rules are written by a licensed pharmacist and cite their sources.

## Known limitations

- Transcription can mishear drug names or symptoms, so the pharmacist reviews everything.
- The rules cover one drug and one indication in this demo. They do not replace clinical judgment or the prescribing information.
- General recommendations (for example for diarrhea) do not fit every patient or every drug.
- Currently, the rules cover one drug (Dupixent) and one indication (asthma), with two more drugs planned.



