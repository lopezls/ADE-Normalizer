# Demo Call 1: Diarrhea after a missed dose (Dupixent, asthma)

*Fictional scripted call. No real patient information.*

**Setup:** Adult patient on Dupixent 300 mg pen every 2 weeks. Rules exercised: D1-01 (diarrhea), D1-MD (missed dose), the adherence support rule (not offered on this call, so the flag fires), plus the call steps and the other rules that apply to every drug.

## Script

1. **Pharmacist:** Hi, this is Alex, a pharmacist with the patient management program at Demo Specialty Pharmacy. Is this Jordan?
2. **Patient:** Hi, yes, this is Jordan.
3. **Pharmacist:** Great, and just so you know, this call is being recorded.
4. **Pharmacist:** Before we continue, can you confirm your date of birth for privacy?
5. **Patient:** Sure, it's January 1st, 2002.
6. **Pharmacist:** Thank you for confirming that. Let's review your directions: you take one 300 mg Dupixent injection under the skin every 2 weeks. Have there been any changes to your medication list, and do you have any barriers to giving your injection?
7. **Patient:** No changes, and no problems giving it.
8. **Pharmacist:** Okay, thanks. Have you had any side effects or missed any doses?
9. **Patient:** Yes, I missed last night's dose. I usually take my shot on Friday every other week, but last night I got out of work late. I've also had some diarrhea.
10. **Pharmacist:** I'm sorry to hear that. Working late is understandable. How long has the diarrhea been going on?
11. **Patient:** About a day, just today and yesterday.
12. **Pharmacist:** Have you tried anything?
13. **Patient:** Not really.
14. **Pharmacist:** I understand. Just remember with diarrhea to keep replacing fluids and electrolytes. Bland foods like bananas and applesauce can help, and you can use Imodium if needed. If it lasts more than two days, or you get a fever of 102 or higher or signs of dehydration, contact your doctor. Since you missed last night's dose, you can inject it now because it's within 7 days, and then keep your regular schedule.
15. **Patient:** Okay, that makes sense.
16. **Pharmacist:** Have you been to the ER or hospital recently?
17. **Patient:** Nope.
18. **Pharmacist:** Good to hear. Remember to tell your doctor about any side effects, and call 911 if you ever have a serious emergency. Do you have any questions for me?
19. **Patient:** No, I don't have any questions. Thank you.
20. **Pharmacist:** Thank you so much for speaking with me today. We'll check back in a couple of months, but you can always reach out if needed. Have a good day.

## What the tool should do

| Turn | Expected behavior |
|---|---|
| 1 | Self-identify: checked |
| 3 | Recording disclosure: checked |
| 4-5 | Identity verification: checked (date of birth is not stored) |
| 6 | Drug recorded as Dupixent, 300 mg every 2 weeks. Directions (SIG) reviewed, ask about medication list changes and barriers to administration: all checked |
| 8 | Ask about missed doses: checked |
| 9 | Missed dose captured, with the patient's reason (got out of work late) and schedule (every other week, usually Fridays). Event captured with verbatim wording ("I've also had some diarrhea") and standardized label "Diarrhea." Rules D1-01 and D1-MD appear in the right side panel with their rule IDs. The patient's stated schedule tells the tool to use the every-other-week missed-dose rule. Because a missed dose was reported, "Offer adherence tips (alarms, pill boxes, calendars)" is added to the checklist as a pending item |
| 10-13 | Duration recorded (about 1 day); treatments tried: none |
| 14 | Pharmacist's actual guidance documented as the intervention. No adherence suggestion is detected, so the pending item stays unchecked |
| 16-17 | ER visit or hospitalization: none reported |
| 18 | "Any questions" asked: checked |
| 20 | Closing: follow-up timeline given and told to reach out with questions: checked |
| End | Chart note generated for pharmacist review. The adherence item is flagged as not covered. No serious outcome was identified, so the event is recorded as non-serious |

## Expected chart note (sample)

**Call steps:** Self-identified, recording disclosed, identity verified (using date of birth), reviewed directions (SIG), asked about medication list changes, barriers to administration and missed doses, closing timeline given, asked about questions.

**Drug:** Dupixent 300 mg pen, every 2 weeks (patient usually injects on Fridays).

**Event reported:** Verbatim: "I've also had some diarrhea." Standardized: Diarrhea. Duration about 1 day. Treatments tried: none. No ER visit or hospitalization. Non-serious (no serious outcome identified).

**Missed dose:** Last night's dose. Reason per patient: "last night I got out of work late."

**Intervention provided:** Advised replacing fluids and electrolytes, bland foods (bananas, applesauce), and Imodium if needed; contact doctor if diarrhea lasts more than 2 days, fever of 102°F or higher, or signs of dehydration; inject the missed dose now (within 7 days) and continue the regular schedule.

**Flag:** Adherence support (alarms, pill boxes, calendars) not covered after reported missed dose.