# Survey Templates — Admin Guide

This guide explains every control in **Admin & Access → Survey Templates**, what each setting does, and how the changes affect what Fellows see and what already-submitted responses show.

---

## 1. What this feature is

The Fellowship has two questionnaires:

| Survey | Filled by | Default questions |
| --- | --- | --- |
| **Fellow Engagement Survey** | Fellows, from their profile | 28 |
| **Post Fellowship Survey (LBS)** | Fellows after the Fellowship (Look Beyond Survey) | 22 |

Until an admin customises a survey, the app serves the built-in definition. As soon as you save changes, your version is stored in the database and becomes the version Fellows fill from that moment on.

**Existing responses are never rewritten.** Editing a survey changes the form and how answers are labelled; it does not touch submitted data.

---

## 2. Where to find it

1. Open **Admin & Access** in the sidebar.
2. Choose the **Survey Templates** tab (last tab on desktop, “Survey Templates” in the section dropdown on mobile).
3. Direct link: `/admin?tab=surveys`.

Only users whose role is **ADMIN** can open this tab. Everyone else sees “Access Denied”, and the API also rejects save/reset requests from non-admins.

### The survey cards

Each card shows:

- **Question count** — number of questions currently in the template.
- **Default** or **Customised** — whether the survey is still the built-in definition or has been saved by an admin.
- **Last saved** — timestamp and the name of the admin who saved it (when customised).
- **Edit Survey** — opens the editor.
- **Reset to Default** — only appears for customised surveys. Deletes the saved version and restores the built-in questions. This cannot be undone.

---

## 3. Saving, cancelling and leaving

- **Save Survey** validates the whole template first. If something is invalid, an error message appears above the tabs and nothing is saved.
- **Cancel** / **Back to surveys** discards everything since the last save (no confirmation prompt).
- After a successful save you return to the survey list; Fellows get the new version on their next page load.

Changes take effect immediately for **new** survey submissions. Responses already on file are displayed using the template as it exists now, plus the archived questions described in section 9.

---

## 4. “Sections & Questions” tab

This is the main editor.

### 4.1 Survey details (top card)

| Field | What it does |
| --- | --- |
| **Survey title** | Heading shown at the top of the survey form, and in the response viewer / PDF header. |
| **Survey date label** | Label next to the date picker on the form. Default is “Survey Date”. Change it if the survey should ask for a different date. |
| **Intro text** | Small line under the title, shown before the first section. Leave empty to hide. |
| **Notice (optional)** | Highlighted note shown in a coloured box directly under the intro. Use it for confidentiality or consent wording. Leave empty to hide. |

### 4.2 Sections

A section is a numbered block of questions (“Section 1 — Belief Questions”, “Section 2 — Culture”, etc.).

Each section header has:

| Control | Action |
| --- | --- |
| **Section name input** | Rename the section. |
| **↑ / ↓** | Move the whole section (with all its questions) up or down. |
| **Notes icon** (document glyph) | Show/hide the section note field. |
| **Delete** | Remove the section. Blocked if it still contains questions, or if it is the only section. |

The **section note** appears as a highlighted box under the section heading, before its questions. Use it for instructions such as “reflect on your journey since the start of the academic year”.

**+ Add Section** at the bottom creates an empty section you can rename and add questions to.

### 4.3 Questions inside a section

Each row shows the question number, the question text, and a summary line:

```
14. My day-to-day experiences match the expectations …
Dropdown · required · 1 condition(s)
```

Row controls:

| Control | Action |
| --- | --- |
| **Row itself** | Expand / collapse the question editor. |
| **↑ / ↓** | Move the question up or down **within its section**. Moving across sections is done with the Section field inside the editor. |
| **Edit / collapse icon** | Same as clicking the row. |
| **Delete** | Removes the question and archives it (see section 9). If other questions were shown *only* because of this one, they are archived too, so nothing accidentally becomes always-visible. |

**+ Add question to this section** appends a blank question to that section and opens it for editing.

---

## 5. Question editor — every field explained

Open a question to see these fields.

### 5.1 Section

Which section the question belongs to. Changing it moves the question when you save. This is how you reorganise questions across sections on mobile, where drag-and-drop is not used.

### 5.2 Question type

Controls how the answer is collected. Types cannot be mixed for one question.

| Type | Rendered as | Use for |
| --- | --- | --- |
| **Dropdown** | A select box with one answer | Long option lists, or when space matters |
| **Single choice (radio)** | One radio button per option | Short lists where you want all choices visible |
| **Long text** | Multi-line text box | Open feedback |
| **Number scale (0-10 style)** | Row of clickable numbers | NPS-style ratings |
| **Multi-select with optional follow-ups** | Checkboxes, optional per-item rating and follow-up field | “Which of these did you use?” questions |
| **Ranked choices** | Tap options to assign rank 1, 2, 3 … | “Pick your top 3 pathways” questions |

Changing the type converts the question in place. Answers already submitted are not converted; the viewer still prints the stored value.

### 5.3 Question text

The main wording. Line breaks are preserved in the form.

### 5.4 Helper text (optional)

Small grey line under the question text. Use it for instructions (“Select exactly 3 options”).

### 5.5 Numbering

| Mode | Behaviour |
| --- | --- |
| **Automatic** | Uses the next running number in the survey (1, 2, 3 …). Moving questions renumbers them. |
| **Fixed number** | Always shows the number you type, e.g. `14a` or `24a`. Does not consume a running number. Use for conditional sub-questions so they read as 14a, 24a instead of 15, 25. |
| **Hidden** | No number at all. Use for indented follow-ups such as “Please specify”. |

Questions marked hidden do not use up a number; the next automatic question continues the sequence.

### 5.6 Required

When ticked, the survey cannot be submitted until the question is answered. Hidden questions are only validated while they are visible.

### 5.7 Indent

Indents the question and adds a coloured left border. Purely visual; use it for follow-up questions so they look nested under their parent.

### 5.8 Options source (Dropdown / Single choice only)

Two choices:

- **A shared option set** — reuse an existing answer list (for example “Agreement scale”). Every question using that set shows the same choices, and editing the set updates all of them.
- **Custom options for this question** — a private list that only this question uses.

Switching a question to custom options copies nothing automatically; you start from the current custom list (or one empty option). Switching to a shared set discards the private list.

### 5.9 Option list

For custom options, and in the Option Sets tab:

- Type in the field to change an option’s wording.
- **↑ / ↓** reorder options (order is what Fellows see).
- **Delete** removes the option.
- **+ Add option** appends a new one.

Option IDs are internal. Renaming an option keeps its ID, so old answers keep mapping correctly. Deleting an option and adding a new one creates a new ID, so old answers still show the old stored value but not the new label. **Prefer renaming over deleting + re-adding.**

### 5.10 Placeholder (Long text only)

Grey example text inside the empty text box, e.g. “Please share your feedback…”.

### 5.11 Scale range (Number scale only)

- **Minimum** and **Maximum** define the numbers shown as buttons. The default 0–10 is the NPS-style question.
- Maximum must be greater than minimum.

### 5.12 Multi-select extras

When the type is **Multi-select with optional follow-ups**:

| Setting | What it does |
| --- | --- |
| **Ask a rating for each selected option** | When ticked, each checked option reveals a rating dropdown. |
| **Rating option set** | Which answer list the rating dropdown uses (e.g. “Agreement scale”, “Helpfulness scale”). |
| **Rating label** | Prompt shown above the rating dropdown, e.g. “How effective was this?” |
| **Option list** | The checkboxes themselves. Each option has an **Add follow-up / Edit follow-up** button. |

#### Option follow-ups

A follow-up appears only when that specific option is checked. Two kinds:

| Follow-up type | Rendered as |
| --- | --- |
| **Long text** | Text box (with optional placeholder) |
| **Dropdown** | Select box using another option set |

Dropdown follow-ups can also show a **“please specify”** box when a particular answer is chosen:

- **Shows “please specify” when** — pick the option that triggers the extra box (or “Never”).
- **Specify label** — the label for that extra box.
- **Required when “<option>” is selected** — makes the follow-up mandatory whenever the parent option is checked.

Examples already configured:

- Post Fellowship Q8 → **Depth Tracks** → asks which track, with “Others” opening a specify box.
- Post Fellowship Q8 → **Internship/Apprenticeship** → asks for the organisation name.

### 5.13 Ranked-choice extras

| Setting | What it does |
| --- | --- |
| **How many options must be ranked** | Number of picks required. Default 3. The form refuses submission until exactly this many are chosen. |
| **Validation message** | Error shown when the wrong number is ranked. |
| **“Other” option** | Which option opens a free-text “please specify” field when ranked. |
| **“Other” field label** | Label for that free-text field. |
| **Groups** | Visual groupings of options (e.g. “Transformational Schools”, “Enablers”, “Policy and governance”). Each group has a heading and its own option list with add / remove / reorder. |

### 5.14 Show this question only when… (conditions)

Makes a question conditional. Two kinds of rule:

- **Choice questions:** tick any number of answers. The question appears if the earlier answer matches **any** of them.
- **Number-scale questions:** type a threshold. The question appears when the answer is **less than** that number.

Add more than one condition to require all of them at once.

Worked examples in the default surveys:

| Question | Condition |
| --- | --- |
| Engagement **14a** (`q14Reason`) | Q14 is “Strongly disagree” or “Disagree” |
| Engagement **24a** (`q24Reason`) | Q24 score is less than 6 |
| Post Fellowship **Q7** | Always shown, but the wording switches to “right after the Fellowship” when Q1 is work / own organisation / sabbatical |
| Post Fellowship **BTCP stage** | Q9 BTCP = Yes |
| Post Fellowship **BTCP rating** | Q9 = Yes **and** stage is Ideation / Planning / Implementation / Closing out |
| Post Fellowship **BTCP reason** | Q9 BTCP = No |
| Post Fellowship **study / exam / break / unsure** follow-ups | Q1 is the matching plan |

The editor only lets you point a condition at questions that still exist. If you delete a question that others depend on, those dependency rules are removed (and questions that would otherwise become always-visible are archived with it).

> Individual sub-questions can also have alternate wording based on an earlier answer (used by Post Fellowship Q7). That behaviour ships preconfigured and is preserved on save, but is not edited from this screen.

### 5.15 Bullet points above the answer

A “one per line” list shown under the question text. Used by Engagement Q20 to list the five statements the PM/Manager is rated on. Clear the box to remove them.

---

## 6. “Option Sets” tab

An **option set** is a reusable answer list. Instead of retyping the same four choices on 20 questions, the questions point at one set.

Built-in sets include:

- **Engagement:** Agreement scale, Gender, Yes / No / Prefer not to disclose, Observation frequency.
- **Post Fellowship:** Agreement scale, Extent scale, Helpfulness scale, Study courses, Competitive exam courses, Break plans, BTCP stages, BTCP experience ratings, Depth tracks, Post-Fellowship plans.

Each set card shows:

| Control | Action |
| --- | --- |
| **Name** | Rename the set (internal label, not shown to Fellows). |
| **“N used”** | How many questions use the set — directly, as a rating scale, or as a follow-up dropdown. |
| **Delete** | Disabled while the set is in use. Move those questions to another set or custom options first. |
| **Option list** | Same add / rename / reorder / delete controls as question options. |
| **+ Add Option Set** | Creates a new empty set you can populate and then point questions at. |

**Important:** editing a shared set changes every question that uses it. That is usually what you want for a scale (e.g. reword “Agree” once for all culture questions), but check the “N used” count first.

---

## 7. Validation rules and error messages

The save button refuses to store a template that would break the form. Messages you may see:

| Message | Fix |
| --- | --- |
| Survey title is required | Fill the Survey title |
| Add at least one section | Create a section |
| Every section needs an id and a title | Give the section a name |
| Every question needs an id | Refresh and try again (generated ids) |
| Duplicate question id / option set id / section id | Refresh the editor; ids must be unique |
| Question “…” needs a label | Fill the question text (or add alternate wording) |
| Question “…” is not in a valid section | Pick a section in the question editor |
| Question “…” needs options | Add at least one option, or choose an option set |
| Question “…” needs a valid rating option set | Pick a rating set for an enabled multi-select rating |
| Question “…” needs at least one pathway option | Add a group with options to a ranked question |
| Question “…” has an invalid scale range | Set a maximum greater than the minimum |
| Question “…” has a condition pointing to a missing question | Re-pick the source question in the condition |
| Option set “…” needs at least one option / has an empty option / has duplicate options | Clean up that set’s list |

---

## 8. How the two surveys are used in the app

- The form appears on the Fellow’s profile under **Engagement Survey** / **Post Fellowship Survey**, and on a Fellow’s profile for staff who can view it.
- **View Responses** renders the answers section by section using the current template.
- **Export as PDF** uses the same template and section grouping.
- The API stores responses as JSON keyed by question id; the survey submission endpoints do not need to change when you edit wording, options or ordering.

---

## 9. Deleted questions and old responses

Deleting a question **archives** it instead of erasing it:

- It disappears from the form for new responses.
- Existing responses that answered it still display it under a **“Removed questions”** section at the end of the response viewer and PDF.
- The archived copy keeps the question text, options and the number it had when it was removed.

This is why deleting is safe for history, and why the survey can evolve without losing old answers.

---

## 10. Reset to Default

**Reset to Default** deletes the saved customisation and restores the built-in survey exactly as shipped. Only available on customised surveys. It does not delete any responses. You will be asked to confirm.

---

## 11. Practical recipes

**Fix a typo**
1. Edit Survey → Sections & Questions.
2. Expand the question.
3. Change the text → Save Survey.

**Add a question at the end of a section**
1. Scroll to the section.
2. **+ Add question to this section**.
3. Fill the text, pick the type, add options if needed.
4. Save.

**Add a choice that only one question should have**
1. Expand the question.
2. Set Options source to **Custom options for this question**.
3. Add the option.
4. Save.

**Reword the 4-point scale everywhere**
1. Option Sets tab → **Agreement scale**.
2. Rename the option.
3. Check “N used” to confirm which questions are affected.
4. Save.

**Add a conditional follow-up**
1. Add the follow-up question in the same section.
2. Set Numbering to **Fixed** (e.g. `14a`) or **Hidden**.
3. Tick **Indent**.
4. Under “Show this question only when…”, add a condition on the parent question and tick the triggering answers.
5. Save.

**Make a long-text follow-up mandatory only for one option (multi-select)**
1. Expand the multi-select question.
2. On that option, **Add follow-up** → Long text.
3. Tick **Required when “<option>” is selected**.
4. Save.

---

## 12. Mobile behaviour

**Admin side**

- Below the tablet breakpoint the tab strip is replaced by an **Admin section** dropdown; choose “Survey Templates”.
- Survey cards stack in one column.
- The editor header stacks (Back / title above Cancel / Save).
- Section headers put the move/notes/delete buttons on their own row; the section name uses the full width.
- Each question row shows the text full width, with the action buttons on the row beneath.
- Option rows stack the text field above its move/delete buttons.
- All editor icon buttons are at least 36 × 36 px for touch.
- The editor tabs and the tab strip scroll horizontally where needed.

**Fellow side**

- Survey headers stack, the date field wraps under the title, and scale buttons wrap onto multiple rows.
- Indented follow-up questions reduce their indent on small screens so text does not get squeezed.
- The response viewer uses full-width padding on phones and scrolls inside a `85dvh` panel.
- The leave-details modal (used from the leave table) becomes a bottom sheet with safe-area padding.

---

## 13. Glossary

| Term | Meaning |
| --- | --- |
| **Template** | The saved definition of a survey: sections, questions, options, conditions. |
| **Option set** | A reusable answer list shared by several questions. |
| **Default** | The built-in template that ships with the app, used until an admin saves changes. |
| **Customised** | A saved template stored in the database. |
| **Archived question** | A deleted question kept so old responses can still display it. |
| **Fixed number** | A hard-coded question number such as `14a` that ignores automatic numbering. |
| **Hidden number** | A question stored without visible numbering. |
| **Condition** | A rule that shows a question only when an earlier answer matches. |
| **Follow-up** | An extra field revealed by a specific multi-select option. |

---

## 14. Notes for developers

- Default definitions live in `src/data/engagementSurveyTemplate.js` and `src/data/postFellowshipSurveyTemplate.js`.
- Saved overrides live in the `SurveyTemplate` table (`key` = `ENGAGEMENT` or `POST_FELLOWSHIP`, `config` JSON, `updatedBy`).
- Shared helpers (numbering, visibility, validation, answer rendering, PDF sections) are in `src/lib/surveyTemplates.js`.
- API: `GET /api/survey-templates` (list), `GET/PUT/DELETE /api/survey-templates/[key]` (read/save/reset; PUT/DELETE require the ADMIN role).
- Deploying the feature to a new environment requires `npx prisma db push` so the `SurveyTemplate` table exists. With no rows, the app serves the code defaults.
- The client caches templates in memory and clears the cache for a survey after an admin saves or resets it.
