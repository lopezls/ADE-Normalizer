# Rules Table

*Pharmacist-authored demo content. Not clinical guidance.*  
*Last reviewed: 10/04/2026*

## How to read this

The AI matches what the patient says against the trigger phrases in each rule. Trigger phrases are examples. The AI matches meaning, not exact words, so "the runs" or "my stomach is a mess" should still match the diarrhea rule. When a rule matches, the pharmacist sees the recommendation and the name of the rule that triggered it. Recommendations are talking points, and the pharmacist explains them in their own words. The pharmacist decides what to say and whether an event meets seriousness criteria. The tool only prompts.

### Seriousness criteria

In order to maintain the scope of the project and reflect common practice, if it is *not a serious event*, it will be categorized as *non-serious*.

A report is *serious* when the patient outcome is one of (FDA MedWatch definition):

- Death
- Life-threatening
- Hospitalization (initial or prolonged)
- Disability or permanent damage
- Congenital anomaly / birth defect
- Required intervention to prevent permanent impairment or damage
- Other serious (important medical event)

Source: <https://www.fda.gov/safety/reporting-serious-problems-fda/what-serious-adverse-event>

---

Note: to remain within scope and timeline constraints, we will only construct rules for selected indications, adults 18+, and speaking directly to the patient. If multiple loading doses are available based on weight or other criteria, one treatment regimen will be selected.

## Drug 1: Dupixent

**Indication(s):** Asthma  
**Product Information:** 1 box that includes 2 pens; each pen is 300 mg/2 mL  
**Route / frequency:** Initial loading dose: 2 pens for a total of 600 mg; then maintenance dosing: 1 pen for a total of 300 mg every 2 weeks, starting on day 15

### ADE rules

| Rule ID | Patient might say (trigger phrases) | Standardized label | Recommendation to show the pharmacist | Contact Physician When | Source |
|---|---|---|---|---|---|
| D1-01 | diarrhea, loose stool(s), increased bowel movements | Diarrhea | Hydration, replace electrolytes, Imodium, BRAT diet | Diarrhea lasting more than 2 days, signs of dehydration, fever of 102°F or higher, stools containing blood or pus | [Cleveland Clinic](https://my.clevelandclinic.org/health/diseases/4108-diarrhea) |
| D1-02 | redness, swelling, lump where injected, injection site reaction, warm, itching | Injection site reactions | Warm compress, ice pack, OTC pain medication, OTC allergy medication, movement | Keeps getting worse, lasts more than 1 to 2 days, signs of infection | [GoodRx](https://www.goodrx.com/conditions/allergies/injection-site-reaction?srsltid=AU7gw4UDfhiF378KHTScNdVAeP-Nv7pkqioaWarm6cPUVIEWA-20xxNW) |
| D1-03 | itchy eyes, eyelid inflammation, red eyelids, blurry vision | Eye and eyelid problems | Contact physician or optometrist as soon as possible; in the meantime, can try OTC artificial tears or OTC antihistamine drops | Contact physician as soon as possible | [Medical News Today](https://www.medicalnewstoday.com/articles/dupixent-side-effects-eyes#ways-to-manage) |
| D1-04 | cold, cold symptoms, flu like symptoms, upper respiratory infections, sinus infections | Infections | Contact physician as soon as possible; can use OTC cold/flu medicine in the meantime | Contact physician as soon as possible | [GoodRx](https://www.goodrx.com/dupixent/dupixent-side-effects) |
| D1-05 | joint pain, muscle pain, back pain, aches | Joint pain, muscle pain, or back pain | OTC pain relief, topical pain relief creams/patches, hot compress | Pain that gets worse | [GoodRx](https://www.goodrx.com/drugs/side-effects/common-medications-that-cause-joint-pain-cholesterol-drugs-asthma-inhalers?srsltid=AU7gw4XVNxEeoMl7fCgN723OQJslN1QBmniX0jA66H5znsvvrOlXrZVr) |
| D1-06 | hives after my shot, swelling after injecting, trouble breathing after my last dose, rash all over | Reported allergic reaction | Advise holding the next dose until the prescriber is contacted; call 911 if breathing trouble or swelling of the face, lips, tongue, or throat occurs | Contact the prescriber right away | Label |

### Missed-dose rule

| Rule ID | Situation | Recommendation to show the pharmacist | Source |
|---|---|---|---|
| D1-MD | Patient says they missed a dose | Inject within 7 days of the missed dose and continue the original schedule; if more than 7 days, wait for the next scheduled dose | Label |

### Call steps (all drugs, every check-in)

| ID | Step | Key points | Source |
|---|---|---|---|
| S-01 | Self-identify | State your name, title, and where you're calling from | Standard practice (demo) |
| S-02 | Recording disclosure | Tell the patient the call is being recorded | Standard practice (demo) |
| S-03 | Verify patient identity | Confirm the patient's date of birth before discussing any PHI | Standard practice (demo) |
| S-11 | Review medication directions (SIG) | Review the directions for use with the patient: dose, route, and how often | Standard practice (demo) |
| S-08 | Ask about medication list changes | Ask whether anything on the patient's medication list has changed | Standard practice (demo) |
| S-10 | Ask about barriers to administration | Ask whether the patient has any barriers or difficulty giving the medication (injection technique, cost, access, storage, refills) | Standard practice (demo) |
| S-07 | Ask about missed doses | Ask whether the patient has missed any doses recently | Standard practice (demo) |
| S-05 | Closing: follow-up timeline | Tell the patient when you will reach out again, and to call us if they have any questions | Standard practice (demo) |
| S-09 | Ask if the patient has any questions | Ask whether the patient has any questions before ending the call | Standard practice (demo) |
| S-06 | Ask about ER visit / hospitalization | Ask whether the patient has been to the ER or hospital recently (see G-02) | Standard practice (demo) |

### Dupixent counseling topics (Indication: Asthma)

| Topic | When it applies | Key points to cover | Source |
|---|---|---|---|
| How it works | New start, or if asked | Blocks signals from two proteins (IL-4 and IL-13) that drive airway inflammation; helps reduce asthma attacks and improve breathing | Label |
| Common side effects | Every check-in | Injection site reactions, eye and eyelid problems, infections, joint pain, muscle pain, or back pain | Label |
| Serious side effects | New start, or if asked | Allergic reactions (trouble breathing; swelling of the face, lips, tongue, or throat; fainting; hives; rash); new or worsening eye problems; joint pain that limits walking; signs of blood vessel inflammation (rash, chest pain, worse shortness of breath, numbness or tingling) | Label |
| Storage | New start, or if asked | Keep refrigerated in the original carton; if needed, room temperature up to 25°C (77°F) for at most 14 days, then use or discard; protect from heat and sunlight | Label |
| Before injecting | New start, or if asked | Let it reach room temperature with the cap on (about 45 minutes for the 300 mg/2 mL) | Label |
| Injection technique | New start, or if asked | Thigh or abdomen, staying 2 inches from the navel; upper arm only if someone else gives it | Label / IFU |
| Missed dose, every other week | New start, if asked, and every check-in | Inject within 7 days of the missed dose and continue the original schedule; if more than 7 days, wait for the next scheduled dose | Manufacturer patient FAQ |

---

## Drug 2: Jascayd

*(coming soon)*

## Drug 3: Tymlos

*(coming soon)*

---

## Rules that apply to every drug

| ID | Rule | Behavior |
|---|---|---|
| G-01 | **Missed dose: adherence support** | If a missed dose is reported, the pharmacist should suggest ways to support adherence, such as alarms, pill boxes, and calendars. This appears as a pending checklist item, and if it is not covered by the end of the call, it is flagged as not covered |
| G-02 | **Seriousness prompts** | Always ask about ER visits and hospitalization |
| G-03 | **Patient's own attribution** | If the patient blames something else (food poisoning, a new supplement), record it as stated; do not decide causality |
| G-04 | **Unmatched symptom** | If nothing matches, record the verbatim text and show "no rule matched; pharmacist to assess" |
| G-05 | **Verbatim first** | The patient's exact words always stay in the note next to the standardized label |