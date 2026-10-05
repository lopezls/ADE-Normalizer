# Privacy & Safety

*Rx Call Aide is a demo project. It is not a clinical decision tool and is not intended for use with real patient information.*

## What this project is

An AI assistant that supports a pharmacist during a patient check-in call. It keeps a checklist, suggests talking points from a rules table, and drafts a chart note. The pharmacist makes every decision.

## Data handling

- The demo uses scripted, fictional calls only. No real calls, no real patient information, and no information from any employer.
- The encounter form does not store the patient identifier. The entered ID is replaced with a sequential number.
- The date of birth and name spoken on a call are used only to tick the identity-verification step. They are not saved.
- The transcript is shown on screen during the call so the pharmacist can verify what the AI heard. It is discarded when the session ends.

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



