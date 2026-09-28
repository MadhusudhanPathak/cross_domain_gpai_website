# GPAI Delphi Study Website: Build Blueprint

**Purpose of this document:** a complete specification for a coding agent to build, version on GitHub, and deploy on Vercel a light website that hosts every form used in a research study, with all data stored in Google Sheets. Phase 1 (build now) is one form, the **Expert Interest Form**. The architecture must make later forms (Delphi Round 1, Round 2, call scheduling) cheap to add.

---

## 0. Instructions for the coding agent

1. Read the whole document before writing code.
2. Build in the order given in **§17 Build order**. Stop after each milestone and run the checks in **§15**.
3. Anything in `[BRACKETS]` is a placeholder the owner fills in. Put every placeholder in one file (`src/content/site.ts`) or in the Google Sheet `Config` tab. Never hard-code them in components.
4. Where this document gives exact copy, field ids or JSON, use them verbatim. Field ids double as Google Sheet column headers.
5. Prefer fewer dependencies. Every added library must earn its bytes (see the performance budget in §12).
6. Do not add analytics, tracking pixels, third-party fonts or third-party scripts. The site collects personal data and must make no third-party requests except to Google Apps Script.

---

## 1. Project summary

| Item | Value |
|---|---|
| Study | Expert elicitation (two-round Delphi, IDEA-style) on how convincingly available techniques can substantiate compliance and safety claims about general-purpose AI models |
| Panel | 16 experts: 8 technical, 8 legal/governance; 4 per domain (2 + 2) |
| Domains | D1 Model opacity, D2 Data integrity, D3 Normative competence, D4 Adversarial robustness |
| Time per participant | About 2 hours in total, all between **1 and 20 October 2026** |
| Audience | Invited experts who mostly already know the research team; mobile and desktop |
| Traffic | Tiny (dozens of users). Reliability and simplicity matter more than scale |
| Data store | Google Sheets only |
| Hosting | GitHub repo, deployed on Vercel (static site) |
| Backend | Google Apps Script web app bound to the Google Sheet |

### The participant journey (the site must explain this clearly)

| Stage | Time | Mode | Indicative window |
|---|---|---|---|
| Round 1: independent ratings | ~45 min | Online form, own time | 1-6 Oct |
| Summary prepared (by the team) | none | n/a | 7-8 Oct |
| Round 2: review the anonymised summary, then revise answers | ~30 min + ~30 min | Online form, own time | 9-15 Oct |
| Short call: reasons for changes and overview of responses (**recorded and transcribed**) | 15 min | Live call | 16-20 Oct |

Round 2 opens only after every panellist has finished Round 1. Dates may shift by a day or two, and the team gives notice in advance.

---

## 2. Goals and non-goals

**Goals**
- One small website containing all study forms, each at `/forms/<formId>`.
- Every submission lands as a row in a Google Sheet tab that the researcher can filter, edit and export.
- Adding a new form means adding one JSON file, one tab and no new page code (see §16).
- Save and resume for long forms.
- Optional emailed copy of the participant's responses.
- Works on phones, with a keyboard, and with a screen reader.

**Non-goals (Phase 1)**
- User accounts or passwords.
- An admin dashboard (the Google Sheet is the admin view).
- Payments, file uploads, analytics, multiple languages.
- Round 1, Round 2 and call-scheduling forms (design for them; do not build them yet).

---

## 3. Architecture

```
 Participant's browser
        |
        |  (1) loads static site
        v
 +-----------------+          +--------------------------------------------+
 |  Vercel         |          |  Google account of the researcher          |
 |  static React   |  (2) POST|  Google Sheet  <---- bound ----> Apps Script|
 |  site (Vite)    |--------->|  tabs: Config, Interest, Drafts,           |
 |  no server code |  JSON as |        Panel, Log                          |
 +-----------------+  text/   |  Web app URL: script.google.com/.../exec   |
        ^             plain   |  runs as the owner, callable by anyone     |
        |                     |  writes rows, sends emails via MailApp     |
   GitHub repo                +--------------------------------------------+
   (auto-deploys)
```

**Why this shape**
- No Google Cloud project, service account or credentials to manage.
- No secrets in the front end or on Vercel. The only environment variable is the public Apps Script URL.
- Email (copy of responses, resume codes, new-response notifications) is built in via `MailApp`.
- Everything is free at this scale.

**Known constraints of Apps Script web apps (design around them)**
- A browser cannot send custom headers or preflight requests to Apps Script. **Always POST with `Content-Type: text/plain;charset=utf-8` and a JSON string body.** Never set `application/json`. The response is readable cross-origin.
- Requests take about 1-3 seconds. Show a loading state.
- The `/exec` URL is public and visible in the JS bundle. It cannot be secret. Protect it with server-side validation, rate limits and a honeypot (§13).
- Apps Script cannot read the request's `Origin` header, so origin checks are impossible.
- Free Gmail accounts can send about 100 emails per day via `MailApp`, and Google Workspace accounts more. Verify current quotas in Google's documentation. 16 participants is far below the limit.
- Redeploying with **"New deployment"** creates a new URL. To ship changes and keep the URL, use **Deploy > Manage deployments > edit (pencil) > Version: New version**.

---

## 4. Tech stack and repository layout

### Stack (all choices aimed at "light")

| Concern | Choice |
|---|---|
| Build tool | Vite + React 18 + TypeScript |
| Routing | `wouter` (tiny) |
| Styling | Plain CSS with custom properties (design tokens in §12). Tailwind v4 is acceptable if the agent prefers it |
| Forms | **No form library and no schema library.** Forms are driven by JSON (§6). Write a small `useFormState` hook and a `validate(schema, values)` function |
| Fonts | Self-hosted via `@fontsource-variable/source-serif-4` and `@fontsource-variable/public-sans` (no Google Fonts requests). Only import the weights and subsets actually used |
| Icons | Inline SVG only |
| Tests | `vitest` for `validate()` and the visibility logic (optional but recommended) |
| Hosting | Vercel, static output from `dist/` |

### Repository layout

```
gpai-delphi-site/
├─ README.md                    # setup + deploy steps (mirror §14)
├─ package.json
├─ vite.config.ts
├─ vercel.json                  # SPA rewrite + security headers (§13)
├─ .env.example                 # VITE_APPS_SCRIPT_URL=
├─ index.html                   # <meta name="robots" content="noindex">
├─ public/
│  ├─ favicon.svg
│  └─ robots.txt                # User-agent: * / Disallow: /
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                   # routes
│  ├─ content/
│  │  ├─ site.ts                # all [PLACEHOLDERS]: names, emails, dates, retention
│  │  └─ process.ts             # stage data used by ProcessOverview
│  ├─ components/
│  │  ├─ Layout.tsx  Header.tsx  Footer.tsx
│  │  ├─ ProcessOverview.tsx    # timeline + proportional time bar
│  │  ├─ FormRenderer.tsx       # steps, progress, nav, submit
│  │  ├─ fields/                # one component per field type (§6.2)
│  │  ├─ DraftBar.tsx           # "Save and continue later" + "Resume"
│  │  └─ ErrorSummary.tsx
│  ├─ forms/
│  │  ├─ interest.json          # Form 1 definition (§7)
│  │  └─ index.ts               # registry: { interest }
│  ├─ lib/
│  │  ├─ api.ts                 # fetch wrapper (§11)
│  │  ├─ validate.ts            # validation + showIf evaluation
│  │  ├─ draft.ts               # localStorage autosave
│  │  └─ dates.ts               # date range and label helpers
│  ├─ pages/
│  │  ├─ Home.tsx  Process.tsx  FormPage.tsx  Done.tsx  Privacy.tsx  NotFound.tsx
│  └─ styles/ tokens.css  base.css
├─ apps-script/
│  ├─ Code.gs                   # backend (§10)
│  ├─ Forms.gs                  # GENERATED from src/forms/*.json
│  ├─ appsscript.json           # manifest
│  └─ README.md                 # paste-and-deploy instructions
└─ scripts/
   └─ export-schemas.mjs        # reads src/forms/*.json, writes apps-script/Forms.gs
```

`scripts/export-schemas.mjs` writes `const FORMS = {...};` into `apps-script/Forms.gs`, so the front end and the back end share one definition. Add the npm script `"export:schemas": "node scripts/export-schemas.mjs"`. After changing any form JSON, run it and re-paste `Forms.gs` into the Apps Script project.

---

## 5. Site map and pages

| Route | Page | Content |
|---|---|---|
| `/` | Home | What the study is (3-4 sentences), who is invited, the time commitment, the process at a glance (`ProcessOverview`), primary button **Express interest** to `/forms/interest` |
| `/process` | The process | Full `ProcessOverview` plus short FAQ: "What if I am busy some days?", "Is my name shared?", "What is recorded?" |
| `/forms/:formId` | Form page | Renders any form from the registry (§6). Unknown id shows the 404 page |
| `/forms/:formId/done` | Confirmation | Thank-you, submission id, whether a copy was emailed, what happens next, contact email |
| `/privacy` | Privacy and data notice | Structured as in §13.3, with placeholders |
| `*` | 404 | Plain message and a link home |

Header: study short name, links "The process" and "Privacy". Footer: contact email and the line "No cookies. No tracking. Answers are stored in a Google Sheet accessible only to the research team." (adjust if facts change).

**Form closed state:** if `getStatus` says the form is closed, the form page shows "This form is closed" with the contact email. It is controlled from the Sheet `Config` tab, with no redeploy needed.

---

## 6. Form engine specification

A form is a JSON document. `FormRenderer` reads it and renders sections as steps. `validate.ts` (front end) and `Code.gs` (back end) implement the same rules. **The server never trusts the client.**

### 6.1 Form document

```ts
type FormDef = {
  id: string;                 // URL slug and registry key, e.g. "interest"
  version: string;            // semver; written to every row
  title: string;
  intro?: string;             // markdown-lite (paragraphs, bold, lists, links)
  estimatedMinutes?: number;
  submitLabel: string;
  sheet: string;              // Google Sheet tab name
  access: "open" | "panel";   // "panel" = email must be in the Panel tab (Phase 2)
  sections: Section[];
};
type Section = { id: string; title: string; description?: string;
                 showIf?: Condition; fields: Field[] };
type Condition =
  | { field: string; equals: string }
  | { field: string; notEquals: string }
  | { field: string; includes: string };  // for checkbox groups
```

### 6.2 Field types and stored value shapes

| `type` | UI | Value in `data` | Sheet columns |
|---|---|---|---|
| `text`, `email`, `url` | single-line input | string | `<id>` |
| `textarea` | multi-line, optional `maxLength` with live counter | string | `<id>` |
| `select` | native select | string (option value) | `<id>` |
| `radio` | radio group | string (option value) | `<id>` |
| `checkboxes` | checkbox group; option may have `exclusive: true` (e.g. "None") | string[] | `<id>` (values joined with `, `) |
| `checkbox` | single boolean checkbox | boolean | `<id>` (`TRUE`/`FALSE`) |
| `matrix` | rows x single-choice columns; on mobile each row becomes a labelled radio group | `{ [rowId]: string }` | `<id>_<rowId>` per row |
| `availability` | date rows x slot chips (§12.4) | `{ "YYYY-MM-DD": ("M"\|"A"\|"E")[] }` | `<id>_<date>` per date, value like `M,A` |
| `consents` | list of individually required checkboxes | `{ [itemId]: boolean }` | `<itemId>` per item |
| `info` | static text (markdown-lite) or `component: "ProcessOverview"` | none | none |

Common field properties: `id`, `type`, `label`, `help?`, `required?`, `showIf?`, `maxLength?`, `minItems?` (checkboxes), `options?: {value,label,description?,exclusive?}[]`, `rows?`, `columns?`, `default?`.

**Validation rules (both sides)**
- Skip fields whose `showIf` (or whose section's `showIf`) is false. Values of hidden fields are dropped before submission.
- `required` means non-empty string, at least `minItems` (default 1) for checkboxes, all rows answered for `matrix`, every consent item true for `consents`, and at least one slot selected for `availability`.
- `email`: simple pattern plus a 254-character limit. `url`: must start with `http://` or `https://`.
- Enumerated fields (`radio`, `select`, `checkboxes`, `matrix` columns, `availability` slots and dates) must contain only allowed values. The server rejects anything else.
- All strings are trimmed and capped (default 2000 characters, `textarea` up to its `maxLength`, hard cap 5000).
- Errors are returned per field id as short, specific sentences: "Enter your email address", not "Invalid".

### 6.3 Rendering behaviour
- Sections are steps. Show "Step 2 of 4" and a slim progress bar (the content is a real sequence, so numbering is appropriate).
- **Next** validates the current section and blocks on errors. Users may go **Back** freely. The final step has the submit button, which re-validates everything.
- Show an error summary at the top of the step on failure, focus it, and link each message to its field. Errors also appear inline under each field.
- Sections or fields hidden by `showIf` are skipped, and the step count adjusts.
- Every input has a visible `<label>`. Help text is linked with `aria-describedby`.

---

## 7. Form 1: Expert Interest Form (`src/forms/interest.json`)

Use this JSON as the source of truth. (`{...}` inside strings is plain text.)

```json
{
  "id": "interest",
  "version": "1.0.0",
  "title": "Join the expert panel",
  "intro": "We are researching how well the techniques available today can substantiate safety and compliance claims about general-purpose AI models, and how much weight expert judgement gives them. We are assembling a panel of 16 experts, 8 technical and 8 legal or governance, for a two-round structured expert judgement exercise (Delphi).\n\nThis form records your interest, expertise and availability. **Filling it in does not commit you to take part.** The full process and time commitment (about 2 hours in total, between 1 and 20 October) are explained in step 3.",
  "estimatedMinutes": 5,
  "submitLabel": "Send my responses",
  "sheet": "Interest",
  "access": "open",
  "sections": [
    {
      "id": "about",
      "title": "About you",
      "fields": [
        { "id": "full_name", "type": "text", "label": "Full name", "required": true, "maxLength": 120 },
        { "id": "email", "type": "email", "label": "Email", "help": "We use this to contact you and, if you ask, to send you a copy of your responses.", "required": true },
        { "id": "role_org", "type": "text", "label": "Current role and organisation", "required": true, "maxLength": 200 },
        { "id": "expertise_track", "type": "radio", "label": "Which best describes your primary expertise?", "required": true,
          "options": [
            { "value": "technical", "label": "Technical", "description": "AI safety, machine learning, evaluation, interpretability, security" },
            { "value": "governance", "label": "Legal, governance or policy", "description": "AI regulation, compliance, standards, audit" }
          ] },
        { "id": "expertise_tags", "type": "checkboxes", "label": "Which of these apply to you?", "help": "Select all that apply.", "required": true, "minItems": 1,
          "options": [
            { "value": "published_research", "label": "Published research in one of the four areas in step 2" },
            { "value": "hands_on", "label": "Hands-on work: evaluation, red-teaming, interpretability or auditing" },
            { "value": "legal_practice", "label": "Legal or regulatory practice or advice" },
            { "value": "standards_policy", "label": "Standards, policy or regulator-facing work" },
            { "value": "other", "label": "Other" }
          ] },
        { "id": "expertise_other", "type": "text", "label": "Other (please describe)", "maxLength": 200,
          "showIf": { "field": "expertise_tags", "includes": "other" } },
        { "id": "profile_link", "type": "url", "label": "Link to a profile or relevant work (optional)", "help": "Website, Google Scholar, LinkedIn, institutional page." }
      ]
    },
    {
      "id": "domains",
      "title": "Your domains",
      "description": "The study covers four technical problem areas of general-purpose AI models.",
      "fields": [
        { "id": "domain_info", "type": "info", "label": "The four domains",
          "text": "**D1 Model opacity:** inspecting and explaining why a model produced an output (interpretability, explainability).\n\n**D2 Data integrity:** bias in training data, and degradation from training on synthetic model outputs (model collapse).\n\n**D3 Normative competence:** machine ethics, theory of mind, AI personas and companions, sycophancy.\n\n**D4 Adversarial robustness:** jailbreaking, prompt injection, data poisoning, AI security." },
        { "id": "primary_domain", "type": "radio", "label": "Which one domain are you best placed to assess?", "required": true,
          "options": [
            { "value": "D1", "label": "D1 Model opacity" },
            { "value": "D2", "label": "D2 Data integrity" },
            { "value": "D3", "label": "D3 Normative competence" },
            { "value": "D4", "label": "D4 Adversarial robustness" }
          ] },
        { "id": "familiarity", "type": "matrix", "label": "How familiar are you with each domain?", "required": true,
          "rows": [
            { "id": "D1", "label": "D1 Model opacity" },
            { "id": "D2", "label": "D2 Data integrity" },
            { "id": "D3", "label": "D3 Normative competence" },
            { "id": "D4", "label": "D4 Adversarial robustness" }
          ],
          "columns": [
            { "value": "none", "label": "Not familiar" },
            { "value": "some", "label": "Some familiarity" },
            { "value": "good", "label": "Good working knowledge" },
            { "value": "expert", "label": "Expert" }
          ] },
        { "id": "other_domains", "type": "checkboxes", "label": "Any other domain you would be comfortable rating? (optional)",
          "options": [
            { "value": "D1", "label": "D1 Model opacity" },
            { "value": "D2", "label": "D2 Data integrity" },
            { "value": "D3", "label": "D3 Normative competence" },
            { "value": "D4", "label": "D4 Adversarial robustness" },
            { "value": "none", "label": "None", "exclusive": true }
          ] }
      ]
    },
    {
      "id": "process",
      "title": "The process and your availability",
      "description": "Please read how the study works before you answer.",
      "fields": [
        { "id": "process_info", "type": "info", "label": "How the study works", "component": "ProcessOverview" },
        { "id": "commitment", "type": "radio", "label": "Can you commit to this process and timeline?", "required": true,
          "options": [
            { "value": "yes", "label": "Yes, I can take part in all three stages" },
            { "value": "maybe", "label": "Probably, but I may need a few extra days for one of the rounds" },
            { "value": "no", "label": "No, I cannot take part at this time" }
          ] },
        { "id": "timezone", "type": "text", "label": "Time zone", "help": "We suggested your browser's time zone. Change it if needed, for example Europe/Rome or UTC+2.", "required": true, "maxLength": 80,
          "default": "@browserTimeZone", "showIf": { "field": "commitment", "notEquals": "no" } },
        { "id": "availability", "type": "availability", "label": "When are you generally available between 1 and 20 October?", "required": true,
          "help": "Tick every slot, in your local time, when you could realistically work on a round or take a 15-minute call. We use this to plan the rounds and to schedule your call.",
          "dates": { "from": "2026-10-01", "to": "2026-10-20" },
          "slots": [
            { "value": "M", "label": "Morning", "description": "before 12:00" },
            { "value": "A", "label": "Afternoon", "description": "12:00-17:00" },
            { "value": "E", "label": "Evening", "description": "after 17:00" }
          ],
          "showIf": { "field": "commitment", "notEquals": "no" } },
        { "id": "availability_notes", "type": "textarea", "label": "Anything else we should know about your availability? (optional)", "help": "For example travel, conferences, or days you are completely unavailable.", "maxLength": 1000,
          "showIf": { "field": "commitment", "notEquals": "no" } }
      ]
    },
    {
      "id": "consent",
      "title": "Consent, recording and credit",
      "showIf": { "field": "commitment", "notEquals": "no" },
      "fields": [
        { "id": "consents", "type": "consents", "label": "Consent", "required": true,
          "options": [
            { "value": "consent_voluntary", "label": "I understand participation is voluntary and that I can withdraw at any time." },
            { "value": "consent_use", "label": "I agree that my responses may be used for this research and reported only in aggregate or anonymised form." },
            { "value": "consent_anonymised_sharing", "label": "I understand that my Round 1 and Round 2 responses and reasoning will be shared with other panellists only in anonymised form." },
            { "value": "consent_recording", "label": "I agree that the 15-minute call will be recorded and transcribed, and that the recording and transcript will be used only for this research." },
            { "value": "consent_storage", "label": "I agree to my contact details being stored securely for this study. [RETENTION PERIOD]" }
          ] },
        { "id": "appendix_consent", "type": "radio", "label": "Appendix profile", "required": true,
          "help": "With your consent, the paper will include an appendix listing the experts who took part, with a short profile for each (name, role and affiliation, and a line on your area of expertise). Your individual ratings will never be linked to your name. Do you consent to being listed?",
          "options": [
            { "value": "yes", "label": "Yes, include my name and short profile" },
            { "value": "no", "label": "No, keep my participation anonymous" },
            { "value": "ask_later", "label": "I am not sure yet, please ask me again before submission" }
          ] },
        { "id": "appendix_profile_text", "type": "textarea", "label": "How should we describe you? (optional)", "help": "2-3 lines, for example role, organisation and area of expertise. We will send you your final profile text for approval before submission.", "maxLength": 400,
          "showIf": { "field": "appendix_consent", "equals": "yes" } },
        { "id": "referral", "type": "text", "label": "Is there a colleague you would recommend for this panel? (optional)", "maxLength": 300 },
        { "id": "copy_requested", "type": "checkbox", "label": "Send me a copy of my responses by email" }
      ]
    }
  ]
}
```

**Special default:** the value `"@browserTimeZone"` means prefill with `Intl.DateTimeFormat().resolvedOptions().timeZone`.

**Behaviour notes**
- If `commitment` is `no`, sections and fields marked `showIf commitment != no` disappear, the step count shrinks to 3, and the person can submit right away. Their row records the answer, and no consent is required because no participation is planned.
- `copy_requested` is a normal field, but it is also passed as the top-level `copyRequested` flag in the API call (§8).
- The `honeypot` field (§13.1) is added by the renderer, not by the JSON.

---

## 8. API contract (front end <-> Apps Script)

Every call is `POST <VITE_APPS_SCRIPT_URL>` with `Content-Type: text/plain;charset=utf-8` and a JSON string body. Responses are JSON.

**Envelope**
```jsonc
// success
{ "ok": true, /* action-specific fields */ }
// failure
{ "ok": false, "code": "VALIDATION|CLOSED|RATE_LIMIT|NEEDS_CODE|BAD_CODE|NOT_FOUND|BAD_REQUEST|SERVER",
  "message": "Human-readable sentence", "fieldErrors": { "email": "Enter your email address" } }
```

| Action | Request | Success response |
|---|---|---|
| `getStatus` | `{ action, formId }` | `{ ok, open: boolean, closesAt?: string, message?: string }` |
| `submit` | `{ action, formId, formVersion, submissionId, data, copyRequested, hp, elapsedMs }` | `{ ok, submissionId, copySent: boolean }` |
| `saveDraft` | `{ action, formId, email, data, code? }` | `{ ok, savedAt, codeEmailed: boolean }` |
| `getDraft` | `{ action, formId, email, code }` | `{ ok, data, savedAt }` |

- `submissionId` is a UUID generated by the browser when the form loads. The server treats a repeated id as an already-succeeded submission, so retries and double clicks are safe.
- `hp` is the honeypot value (must be empty). `elapsedMs` is the time since the form loaded.
- `data` follows the shapes in §6.2, with hidden fields removed.

**Reserved for Phase 2 (do not build now):** `requestCode` / `verifyCode` for panel access, `getSummary` (returns the anonymised Round 1 summary to verified panel members), `getSlots` / `claimSlot` (call scheduling).

---

## 9. Google Sheet data model

Create one spreadsheet named **`GPAI Delphi Study: Data`**. The Apps Script `setup()` function (§10) creates all tabs and headers. Freeze row 1 in every tab. Restrict sharing to named research-team accounts only.

### 9.1 Tabs

| Tab | Purpose | Written by |
|---|---|---|
| `Config` | Key/value settings the researcher can edit live | Researcher |
| `Interest` | One row per Interest Form submission | Server |
| `Drafts` | Saved-but-unsubmitted answers | Server |
| `Panel` | Approved panellists (used from Phase 2) | Researcher |
| `Log` | Errors and notable events | Server |

### 9.2 `Config` tab (columns `key`, `value`)

| key | example value | Meaning |
|---|---|---|
| `interest_open` | `TRUE` | Master switch for the form |
| `interest_closes_at` | `2026-09-30T23:59:00Z` | Optional automatic close (UTC) |
| `contact_email` | `[EMAIL]` | Shown in emails and messages |
| `notify_email` | `[EMAIL]` | Gets a short notification per new submission (blank = off) |
| `site_url` | `[SITE_URL]` | Used in emailed links |
| `study_name` | `[STUDY NAME]` | Used in email subjects |

### 9.3 `Interest` tab columns (in this order)

Meta columns: `submission_id`, `submitted_at_utc`, `form_version`, `status`, `admin_notes`.

Answer columns: `full_name`, `email`, `role_org`, `expertise_track`, `expertise_tags`, `expertise_other`, `profile_link`, `primary_domain`, `familiarity_D1`, `familiarity_D2`, `familiarity_D3`, `familiarity_D4`, `other_domains`, `commitment`, `timezone`, `avail_2026-10-01` ... `avail_2026-10-20` (20 columns, values such as `M,A,E` or blank), `availability_notes`, `consent_voluntary`, `consent_use`, `consent_anonymised_sharing`, `consent_recording`, `consent_storage`, `appendix_consent`, `appendix_profile_text`, `referral`, `copy_requested`.

- `status` values: `new` (set by server), `invited`, `accepted`, `waitlist`, `declined` (set by the researcher), `superseded` (set by server when the same email submits again). Add a data-validation dropdown to this column in `setup()`.
- Columns are generated from the form JSON by rule: meta columns first, then one column per field, expanded per row (`matrix`), per date (`availability`) or per item (`consents`). If a form gains a field later, the server appends a new column at the end rather than reordering.
- Timestamps are ISO 8601 UTC.

### 9.4 `Drafts` tab columns

`form_id`, `email`, `code_hash`, `data_json`, `saved_at_utc`. One row per (form, email). Deleted after successful submission and purged after 30 days.

### 9.5 `Panel` tab columns (Phase 2)

`participant_id`, `email`, `name`, `track`, `domain`, `status` (`invited|active|withdrawn|r1_done|r2_done|call_done`), `notes`. `participant_id` is a pseudonym (for example `P01`) used in all analysis sheets so that ratings can be analysed without names.

### 9.6 `Log` tab columns

`time_utc`, `level`, `action`, `message`. Never log the full `data` payload.

---

## 10. Apps Script backend (`apps-script/`)

Create the script from the spreadsheet: **Extensions > Apps Script** (a container-bound project, so `SpreadsheetApp.getActive()` needs no Sheet id).

### 10.1 `appsscript.json`

```json
{
  "timeZone": "UTC",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "webapp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS" },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.send_mail",
    "https://www.googleapis.com/auth/script.scriptapp"
  ]
}
```

### 10.2 `Code.gs` reference implementation

This is a working skeleton. The agent should complete the helpers marked `// TODO` and add tests by hand using the curl commands in §15.

```js
/** Entry points ------------------------------------------------------- */
function doGet() { return json_({ ok: true, service: 'gpai-delphi', time: new Date().toISOString() }); }

function doPost(e) {
  let res;
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.hp) return json_({ ok: true });            // honeypot: pretend success
    switch (req.action) {
      case 'getStatus': res = getStatus_(req); break;
      case 'submit':    res = submit_(req);    break;
      case 'saveDraft': res = saveDraft_(req); break;
      case 'getDraft':  res = getDraft_(req);  break;
      default: res = fail_('BAD_REQUEST', 'Unknown action.');
    }
  } catch (err) {
    log_('ERROR', String(req && req.action), String(err));
    res = fail_('SERVER', 'Something went wrong. Your answers are still saved in this browser. Please try again.');
  }
  return json_(res);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function fail_(code, message, extra) { return Object.assign({ ok: false, code: code, message: message }, extra || {}); }

/** Config, logging, rate limiting -------------------------------------- */
function cfg_(key, dflt) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Config');
  const rows = sh.getDataRange().getValues();
  for (const r of rows) if (r[0] === key) return r[1] === '' ? dflt : r[1];
  return dflt;
}
function log_(level, action, message) {
  SpreadsheetApp.getActive().getSheetByName('Log').appendRow([new Date().toISOString(), level, action || '', String(message).slice(0, 500)]);
}
function rateLimit_(key, max, windowSec) {          // windowSec must be <= 21600 (CacheService limit)
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get(key) || 0);
  if (n >= max) return false;
  cache.put(key, String(n + 1), windowSec);
  return true;
}

/** Cell safety: prevent spreadsheet formula injection -------------------- */
function cell_(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) v = v.join(', ');
  v = String(v).slice(0, 5000);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;       // leading apostrophe forces text
}

/** Status ------------------------------------------------------------- */
function getStatus_(req) {
  const form = FORMS[req.formId];
  if (!form) return fail_('BAD_REQUEST', 'Unknown form.');
  const open = String(cfg_(form.id + '_open', 'TRUE')).toUpperCase() === 'TRUE';
  const closesAt = cfg_(form.id + '_closes_at', '');
  const expired = closesAt && new Date(closesAt) < new Date();
  return { ok: true, open: open && !expired, closesAt: closesAt || undefined };
}

/** Visibility + validation (mirror of src/lib/validate.ts) --------------- */
function visible_(cond, data) {
  if (!cond) return true;
  const v = data[cond.field];
  if ('equals' in cond) return v === cond.equals;
  if ('notEquals' in cond) return v !== cond.notEquals;
  if ('includes' in cond) return Array.isArray(v) && v.indexOf(cond.includes) >= 0;
  return true;
}
function validate_(form, data) {
  const errors = {};
  // TODO: for each section (skip if !visible_(section.showIf, data)) and each field
  // (skip if !visible_(field.showIf, data), skip type 'info'):
  //  - enforce required / minItems / matrix rows / consents all true / availability >= 1 slot
  //  - enforce enums (radio/select/checkboxes/matrix columns/availability dates+slots)
  //  - email + url patterns, string length caps
  //  - put messages in errors[field.id]
  return errors;
}

/** Flatten a submission into sheet columns -------------------------------- */
function columnsFor_(form) {
  const cols = ['submission_id', 'submitted_at_utc', 'form_version', 'status', 'admin_notes'];
  form.sections.forEach(function (s) {
    s.fields.forEach(function (f) {
      if (f.type === 'info') return;
      if (f.type === 'matrix') f.rows.forEach(function (r) { cols.push(f.id + '_' + r.id); });
      else if (f.type === 'availability') datesBetween_(f.dates.from, f.dates.to).forEach(function (d) { cols.push(f.id + '_' + d); });
      else if (f.type === 'consents') f.options.forEach(function (o) { cols.push(o.value); });
      else cols.push(f.id);
    });
  });
  return cols;
}
function flatten_(form, data) {
  const flat = {};
  form.sections.forEach(function (s) {
    s.fields.forEach(function (f) {
      const v = data[f.id];
      if (f.type === 'matrix') f.rows.forEach(function (r) { flat[f.id + '_' + r.id] = v && v[r.id]; });
      else if (f.type === 'availability') Object.keys(v || {}).forEach(function (d) { flat[f.id + '_' + d] = (v[d] || []).join(','); });
      else if (f.type === 'consents') f.options.forEach(function (o) { flat[o.value] = v && v[o.value] ? 'TRUE' : 'FALSE'; });
      else if (f.type === 'checkbox') flat[f.id] = v ? 'TRUE' : 'FALSE';
      else flat[f.id] = v;
    });
  });
  return flat;
}
function datesBetween_(from, to) {                   // 'YYYY-MM-DD' inclusive, UTC-safe
  const out = []; let d = new Date(from + 'T00:00:00Z'); const end = new Date(to + 'T00:00:00Z');
  while (d <= end) { out.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); }
  return out;
}

/** Sheet access -------------------------------------------------------------- */
function sheetFor_(form) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(form.sheet) || ss.insertSheet(form.sheet);
  const cols = columnsFor_(form);
  const have = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  const missing = cols.filter(function (c) { return have.indexOf(c) < 0; });
  if (missing.length) {                                // create or extend headers
    sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Submit ------------------------------------------------------------------- */
function submit_(req) {
  const form = FORMS[req.formId];
  if (!form) return fail_('BAD_REQUEST', 'Unknown form.');
  const st = getStatus_(req);
  if (!st.open) return fail_('CLOSED', 'This form is closed. Contact ' + cfg_('contact_email', 'the research team') + '.');

  const data = req.data || {};
  const errors = validate_(form, data);
  if (Object.keys(errors).length) return fail_('VALIDATION', 'Please fix the highlighted fields.', { fieldErrors: errors });

  const email = String(data.email || '').trim().toLowerCase();
  if (!rateLimit_('submit:' + form.id + ':' + email, 5, 3600)) return fail_('RATE_LIMIT', 'Too many attempts. Please try again in an hour.');

  const submissionId = String(req.submissionId || Utilities.getUuid());
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = sheetFor_(form);
    const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const idCol = header.indexOf('submission_id') + 1;
    // Idempotency: same submissionId already stored -> success
    if (sh.getLastRow() > 1 && sh.getRange(2, idCol, sh.getLastRow() - 1, 1).createTextFinder(submissionId).matchEntireCell(true).findNext()) {
      return { ok: true, submissionId: submissionId, copySent: false };
    }
    // Supersede earlier rows with the same email
    const emailCol = header.indexOf('email') + 1, statusCol = header.indexOf('status') + 1;
    if (emailCol && statusCol && sh.getLastRow() > 1) {
      const vals = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
      vals.forEach(function (row, i) {
        if (String(row[emailCol - 1]).toLowerCase() === email && row[statusCol - 1] !== 'superseded')
          sh.getRange(i + 2, statusCol).setValue('superseded');
      });
    }
    const flat = flatten_(form, data);
    flat.submission_id = submissionId; flat.submitted_at_utc = new Date().toISOString();
    flat.form_version = form.version; flat.status = 'new'; flat.admin_notes = '';
    sh.appendRow(header.map(function (c) { return cell_(flat[c]); }));
    deleteDraft_(form.id, email);
  } finally { lock.releaseLock(); }

  let copySent = false;
  if (req.copyRequested) copySent = sendCopy_(form, data, submissionId, email);
  notify_(form, data);
  return { ok: true, submissionId: submissionId, copySent: copySent };
}

/** Emails -------------------------------------------------------------------- */
function mail_(to, subject, body) {
  MailApp.sendEmail({ to: to, subject: subject, body: body, name: String(cfg_('study_name', 'Research team')), replyTo: String(cfg_('contact_email', '')) });
}
function sendCopy_(form, data, submissionId, email) {
  if (!rateLimit_('copy:' + email, 3, 3600)) return false;
  // TODO: build plain-text body: greeting, "Here is a copy of the responses you submitted",
  // submission id + UTC time, then "Label: answer" lines using field labels from FORMS
  // (options rendered by label, availability as "Thu 1 Oct: Morning, Afternoon"),
  // a note on how to withdraw or correct (reply to contact_email), and the study contact.
  const body = 'TODO';
  mail_(email, '[' + cfg_('study_name', 'Study') + '] Your responses (' + submissionId.slice(0, 8) + ')', body);
  return true;
}
function notify_(form, data) {
  const to = String(cfg_('notify_email', ''));
  if (!to) return;
  mail_(to, 'New ' + form.id + ' response', [data.full_name, data.expertise_track, data.primary_domain, data.commitment].join(' | '));
}

/** Drafts (save & resume) --------------------------------------------------- */
function hash_(s) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s)); }
function newCode_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase(); }
function draftRow_(sh, formId, email) {                // returns 1-based row or 0
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) if (vals[i][0] === formId && String(vals[i][1]).toLowerCase() === email) return i + 1;
  return 0;
}
function saveDraft_(req) {
  const form = FORMS[req.formId]; if (!form) return fail_('BAD_REQUEST', 'Unknown form.');
  const email = String(req.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail_('VALIDATION', 'Enter a valid email address to save a draft.');
  if (!rateLimit_('draft:' + email, 10, 3600)) return fail_('RATE_LIMIT', 'Too many saves. Please try again later.');
  const json = JSON.stringify(req.data || {});
  if (json.length > 40000) return fail_('VALIDATION', 'Draft is too large.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName('Drafts');
    const row = draftRow_(sh, form.id, email), now = new Date().toISOString();
    if (!row) {                                          // first save: create code and email it
      const code = newCode_();
      sh.appendRow([form.id, email, hash_(code), cell_(json), now]);
      mail_(email, '[' + cfg_('study_name', 'Study') + '] Your resume code',
        'Your resume code is ' + code + '.\n\nTo continue your draft, open ' + cfg_('site_url', '') + '/forms/' + form.id +
        ', choose "Resume a saved draft", and enter this email address and code.\n\nDrafts are deleted after 30 days.');
      return { ok: true, savedAt: now, codeEmailed: true };
    }
    const stored = sh.getRange(row, 3).getValue();
    if (!req.code) return fail_('NEEDS_CODE', 'A draft already exists for this email. Enter your resume code to update it.');
    if (hash_(String(req.code).trim().toUpperCase()) !== stored) return fail_('BAD_CODE', 'That resume code is not correct.');
    sh.getRange(row, 4, 1, 2).setValues([[cell_(json), now]]);
    return { ok: true, savedAt: now, codeEmailed: false };
  } finally { lock.releaseLock(); }
}
function getDraft_(req) {
  const email = String(req.email || '').trim().toLowerCase();
  if (!rateLimit_('getdraft:' + email, 10, 3600)) return fail_('RATE_LIMIT', 'Too many attempts. Please try again later.');
  const sh = SpreadsheetApp.getActive().getSheetByName('Drafts');
  const row = draftRow_(sh, req.formId, email);
  if (!row) return fail_('NOT_FOUND', 'No saved draft found for this email.');
  const r = sh.getRange(row, 1, 1, 5).getValues()[0];
  if (hash_(String(req.code || '').trim().toUpperCase()) !== r[2]) return fail_('BAD_CODE', 'That resume code is not correct.');
  return { ok: true, data: JSON.parse(r[3]), savedAt: r[4] };
}
function deleteDraft_(formId, email) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Drafts');
  const row = draftRow_(sh, formId, email);
  if (row) sh.deleteRow(row);
}
function purgeOldDrafts() {                             // run daily via trigger
  const sh = SpreadsheetApp.getActive().getSheetByName('Drafts');
  const vals = sh.getDataRange().getValues(), cutoff = Date.now() - 30 * 86400000;
  for (let i = vals.length - 1; i >= 1; i--) if (new Date(vals[i][4]).getTime() < cutoff) sh.deleteRow(i + 1);
}

/** One-time setup: run manually from the editor ------------------------------- */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const need = { Config: ['key', 'value'], Drafts: ['form_id', 'email', 'code_hash', 'data_json', 'saved_at_utc'],
                 Panel: ['participant_id', 'email', 'name', 'track', 'domain', 'status', 'notes'], Log: ['time_utc', 'level', 'action', 'message'] };
  Object.keys(need).forEach(function (n) {
    const sh = ss.getSheetByName(n) || ss.insertSheet(n);
    if (!sh.getLastRow()) { sh.getRange(1, 1, 1, need[n].length).setValues([need[n]]); sh.setFrozenRows(1); }
  });
  const cfg = ss.getSheetByName('Config');
  if (cfg.getLastRow() < 2) cfg.getRange(2, 1, 6, 2).setValues([
    ['interest_open', 'TRUE'], ['interest_closes_at', ''], ['contact_email', '[EMAIL]'],
    ['notify_email', ''], ['site_url', '[SITE_URL]'], ['study_name', '[STUDY NAME]']]);
  Object.keys(FORMS).forEach(function (id) { sheetFor_(FORMS[id]); });   // creates form tabs + headers
  // TODO: add a status dropdown (data validation) to the Interest 'status' column
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('purgeOldDrafts').timeBased().everyDays(1).atHour(3).create();
}
```

`Forms.gs` is generated and contains only `const FORMS = { interest: {...} };`.

---

## 11. Front-end behaviour

### 11.1 API client (`src/lib/api.ts`)

```ts
const URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

export async function call<T>(payload: object, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(URL, {
      method: "POST",
      // text/plain avoids a CORS preflight, which Apps Script cannot answer.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: ctrl.signal,
    });
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
```

Network failures and timeouts show: "We could not reach the server. Your answers are saved in this browser. Try again in a moment." and never clear the form.

### 11.2 Form lifecycle

1. **Load:** create `submissionId` (UUID) and record `startedAt`. Call `getStatus` (if it fails, still show the form; the server enforces the rule at submit). If a local draft exists, show a banner: "You have saved answers from [time]. Restore them / Start fresh".
2. **Autosave (local):** debounce 500 ms to `localStorage["gpai:draft:<formId>:<version>"]`. This is a convenience for tab crashes and refreshes on the same device. Offer "Clear saved answers on this device" in the footer of the form. Clear the local draft after a successful submit.
3. **Save and continue later (server):** button in the form's top bar. It asks for an email if none is entered yet, then calls `saveDraft`. On first save, the server emails a resume code, and the browser stores the code in `localStorage` for later updates. If the server answers `NEEDS_CODE` (for example on another device), show a small dialog asking for the code.
4. **Resume:** link "Resume a saved draft" opens a dialog with email and code, calls `getDraft`, and fills the form with `data`. Errors are shown inline in the dialog.
5. **Submit:** validate everything client-side, remove hidden-field values, call `submit` with `elapsedMs = now - startedAt`. Disable the button and show "Sending..." while pending.
   - `VALIDATION`: map `fieldErrors` to fields, jump to the first step with an error.
   - `CLOSED`, `RATE_LIMIT`, `SERVER`: show the message in an alert region and keep the form.
   - Success: clear local draft, navigate to `/forms/<id>/done` with `{ submissionId, copySent, email }` in router state.
6. **Done page:** "Thank you. Your responses were received." Shows the submission id (short form), states "A copy was sent to [email]" or "You did not ask for a copy", and reads "We will be in touch by [DATE]. Questions: [EMAIL]". If `commitment` was `no`, use a short polite variant.

### 11.3 Copy-of-responses email (server side)

Plain text, sent from the owner's account, with the study name as sender name and `replyTo` set to the contact email.

```
Subject: [STUDY NAME] Your responses (<first 8 chars of id>)

Hello <first name>,

Here is a copy of the responses you submitted on <date/time UTC>.
Submission reference: <submission id>

<Question label>
<Answer>

... (one block per answered question; availability as "Thu 1 Oct: Morning, Afternoon")

If you would like to correct anything or withdraw, reply to this email or write to [EMAIL].

Thank you,
[TEAM NAMES]
```

---

## 12. UX, design and accessibility

### 12.1 Design intent

The site is a calm, credible instrument for busy experts. It should feel like a well-set academic page, not a SaaS landing page. **Spend the visual boldness in one place: the study timeline with a proportional time bar** that shows the 2-hour commitment as 45 | 30 + 30 | 15 minutes. Everything else stays quiet.

### 12.2 Design tokens (`src/styles/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F6F8F9` | page background |
| `--surface` | `#FFFFFF` | form panels |
| `--ink` | `#14202B` | text |
| `--ink-soft` | `#4A5866` | help text |
| `--rule` | `#D3DCE2` | dividers, input borders |
| `--accent` | `#245C73` | buttons, links, focus ring base (petrol blue) |
| `--danger` | `#A6321E` | errors |
| `--d1` `--d2` `--d3` `--d4` | `#3B6EA8` `#4F8A5B` `#9A5678` `#B8702A` | domain markers, used only where a domain is named (chips beside D1-D4) |

Dark mode: define an alternate set under `@media (prefers-color-scheme: dark)` (background near `#0F1820`, surface `#16222C`, ink `#E6EDF2`, lighter accent `#6FB3CC`). All text must keep at least 4.5:1 contrast in both.

### 12.3 Typography and layout
- Headings: **Source Serif 4** (variable). Body and UI: **Public Sans** (variable). Base size 17-18 px, line-height 1.6 for body, 1.25 for headings.
- Sentence case everywhere. No all-caps labels, no eyebrows above headings, no accenting a single word in a headline.
- Line length under 70 characters. Form column `max-width: 40rem`. Home page text column `max-width: 44rem`, left-aligned.
- One border radius (6 px) on inputs and buttons. Use dividers and spacing rather than a card for every block. The form sits on one white surface with a thin border.
- Buttons name the action: **Express interest**, **Next**, **Back**, **Save and continue later**, **Resume a saved draft**, **Send my responses**. Errors state what is wrong and how to fix it, without apologising.
- No entrance animations. Only motion that answers an action (a step change, an expanding section), and respect `prefers-reduced-motion`.

### 12.4 The availability grid (the hardest component)
- 20 rows (1-20 Oct 2026) labelled like `Thu 1 Oct`. Weekends get a subtle tint and a text marker in the label ("Sat 3 Oct") so colour is not the only cue.
- Each row shows three toggle chips: **Morning**, **Afternoon**, **Evening** (with the hour ranges as small text). Chips are real `<input type="checkbox">` elements styled as toggles, so keyboard and screen readers work.
- Convenience controls above the list: **Select all mornings / afternoons / evenings**, **Clear all**. Each row also has an **All day** toggle.
- On narrow screens, rows stack as: date, then the three chips in a single line. Never render a 20 x 3 table with horizontal scroll.
- Show a live counter: "12 slots selected across 7 days".
- Above the grid, show the participant's time zone (from the `timezone` field) as reminder text: "Times are in your time zone: Europe/Rome".

### 12.5 The process overview component (`ProcessOverview`)
- Data comes from `src/content/process.ts` (editable, with dates as strings). Render (a) the four stages as a vertical timeline with the window, duration and a one-line description, and (b) above it a horizontal proportional bar: 45 / 30 / 30 / 15 minutes, with a caption "About 2 hours in total, spread over three weeks."
- The stage text is exactly the participant journey in §1, including "recorded and transcribed" for the call and the anonymity statement for the summary.
- The same component appears on the Home page, on `/process`, and inside form step 3.

### 12.6 Accessibility (WCAG 2.1 AA baseline)
- Visible focus ring (2 px `--accent`, 2 px offset) on every interactive element. Skip-to-content link.
- Correct semantics: `<fieldset>/<legend>` for radio and checkbox groups and for each matrix row. `aria-live="polite"` for the draft-saved message, `role="alert"` for the error summary.
- Error text is associated with fields via `aria-describedby` and `aria-invalid`.
- Target size at least 44 x 44 px for touch. Layout works from 320 px wide.
- Test with keyboard only and with one screen reader.

### 12.7 Performance budget
- Initial JS under 120 KB gzipped, CSS under 15 KB gzipped, at most two font files loaded on first paint (variable fonts, Latin subset only, `font-display: swap`).
- No third-party requests other than the Apps Script call. Lighthouse Performance, Accessibility and Best Practices each 95+ on mobile.

---

## 13. Security and privacy

### 13.1 Abuse protection (the Apps Script URL is public)
- **Honeypot:** the renderer adds a visually hidden text input named `hp` (`tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`). If filled, the server returns a fake success and stores nothing.
- **Rate limits:** per email and action via `CacheService` (values in §10). Submissions of 5 per hour per email, 10 draft saves and 10 draft reads per hour per email, 3 emailed copies per hour per email.
- **Time check:** log (do not reject) submissions with `elapsedMs < 8000`.
- **Server validation** of every field, enum and length. Reject unknown forms, unknown actions and oversized payloads (over 60 KB).
- **Formula-injection guard:** every value written to a cell goes through `cell_()`. Also set the answer columns to plain-text format in `setup()`.
- **Draft protection:** drafts are only returned with the emailed resume code, stored as a SHA-256 hash.
- No personal data in URLs, in `GET` requests, or in the `Log` tab.
- Optional hardening (only if abuse appears): put a tiny Vercel serverless proxy in front of Apps Script that adds a real secret and hides the script URL. Do not build this in Phase 1. Note that a "shared key" inside the static front end is not a secret, so do not present it as one.

### 13.2 Headers (`vercel.json`)

```json
{
  "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }],
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://script.google.com https://script.googleusercontent.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "no-referrer" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
      { "key": "X-Robots-Tag", "value": "noindex, nofollow" }
    ]
  }]
}
```

### 13.3 Privacy notice page (structure, with placeholders)
The `/privacy` page must cover: who is responsible for the data (**[INSTITUTION / DATA CONTROLLER]**, contact **[EMAIL]**); what is collected (form answers, email, availability, consent record, and the recording and transcript of the 15-minute call); why (to run the expert panel for a research paper); the legal basis (**consent**, withdrawable at any time); who sees it (the named research team; other panellists see only anonymised round summaries; the appendix lists names only for people who consented); where it is stored (a Google Sheet in the research team's Google account; the website itself is static and stores nothing on the server; **[TRANSCRIPTION TOOL, if any]** for the call); retention (**[RETENTION PERIOD]**); rights (access, correction, deletion, withdrawal); and the statement that the site uses no cookies or analytics, only browser storage for saving drafts on the participant's own device.

**Owner action, not the agent's:** this text needs sign-off from the institution's data protection officer or ethics committee before the site goes live. The blueprint provides structure only.

---

## 14. Deployment steps (to include in the repo `README.md`)

**A. Google Sheet and Apps Script (about 15 minutes)**
1. Create the Google Sheet `GPAI Delphi Study: Data`.
2. Open **Extensions > Apps Script**. Replace the contents with `Code.gs` and add `Forms.gs` (run `npm run export:schemas` first). In **Project Settings**, enable "Show `appsscript.json` manifest file" and paste the manifest from §10.1.
3. Run `setup()` once from the editor and authorise the permissions (Google shows an "unverified app" screen because it is your own script: choose Advanced, then continue).
4. Fill the `Config` tab (contact email, notify email, site URL, study name).
5. **Deploy > New deployment > Web app.** Execute as: **Me**. Who has access: **Anyone**. Copy the `/exec` URL.
6. Test with curl (see §15).

**B. GitHub and Vercel (about 10 minutes)**
1. Push the repo to GitHub.
2. In Vercel: **Add New > Project**, import the repo. Framework preset **Vite**, build `npm run build`, output `dist`.
3. Add the environment variable `VITE_APPS_SCRIPT_URL` (the `/exec` URL) for Production and Preview.
4. Deploy. Open the site and submit a test response. Check that the row appears in the `Interest` tab.
5. Optionally add a custom domain in Vercel, then update `site_url` in the `Config` tab.

**C. Updating later**
- Front end: push to GitHub and Vercel redeploys.
- Backend: edit the script, then **Deploy > Manage deployments > pencil > Version: New version > Deploy** (keeps the same URL).
- After changing any form JSON: `npm run export:schemas`, paste the new `Forms.gs`, redeploy the script and push the front end. Run `setup()` again if new columns should appear at once (it only adds missing headers).

---

## 15. Testing and acceptance checklist

**Backend (curl)**
```bash
URL="https://script.google.com/macros/s/XXXX/exec"
curl -sL "$URL"                                                                  # health check
curl -sL -X POST "$URL" -H "Content-Type: text/plain" -d '{"action":"getStatus","formId":"interest"}'
curl -sL -X POST "$URL" -H "Content-Type: text/plain" -d '{"action":"submit","formId":"interest","data":{}}'   # expect VALIDATION with fieldErrors
```

**Functional**
- [ ] A full valid submission creates exactly one row with correct columns and `status = new`.
- [ ] Submitting again with the same email marks the older row `superseded`.
- [ ] Reloading and resubmitting the same `submissionId` does not create a duplicate row.
- [ ] Choosing "No" on commitment hides the timezone, availability and consent steps, and the form can still be submitted.
- [ ] `expertise_other` and `appendix_profile_text` appear only when their conditions are met.
- [ ] "None" in `other_domains` clears the other boxes, and picking another box clears "None".
- [ ] Availability `M,A,E` values land in the right `avail_YYYY-MM-DD` columns.
- [ ] Each of the five consents is individually required.
- [ ] Setting `interest_open` to `FALSE` in `Config` closes the form within a minute without redeploying.
- [ ] Emailed copy arrives (when ticked) and lists labelled answers. No email is sent when unticked.
- [ ] Save and continue later emails a code. Resume with the correct code restores every field, and a wrong code is refused.
- [ ] Draft rows are deleted after successful submission.
- [ ] A cell starting with `=` (test with `=1+1` in the name) is stored as text.
- [ ] A filled honeypot stores nothing.
- [ ] More than 5 submissions per hour for one email get `RATE_LIMIT`.
- [ ] Offline or timed-out submit keeps all answers and shows a retry message.

**Quality**
- [ ] Keyboard-only run from first field to confirmation. Screen-reader check of the availability grid and the matrix.
- [ ] 320 px, 390 px, tablet and desktop widths all usable, with no horizontal scroll.
- [ ] Lighthouse 95+ on mobile. No requests to third-party hosts other than Apps Script (check the Network tab).
- [ ] Light and dark mode both readable.

---

## 16. Extending: adding later forms (Round 1, Round 2, call scheduling)

**Adding a simple form (no new code):**
1. Add `src/forms/<id>.json` following §6.
2. Register it in `src/forms/index.ts`.
3. Add `<id>_open` (and optionally `<id>_closes_at`) to the `Config` tab.
4. Run `npm run export:schemas`, paste `Forms.gs`, redeploy the script, run `setup()`.
The route `/forms/<id>` works immediately.

**Panel-only forms (Round 1, Round 2):**
- Set `"access": "panel"`. Before showing the form, ask for the participant's email. The server checks it against `Panel` (`status` not `withdrawn`). For Round 2, it also requires `r1_done`.
- Upgrade path already supported by the draft-code machinery: add `requestCode` / `verifyCode` so a one-time emailed code proves email ownership. Without it, the email check only stops accidental submissions, not impersonation by someone who knows a panelist's address.
- Store each submission's `participant_id` (from `Panel`) instead of the name in the round tabs, so analysis sheets carry pseudonyms only.

**New field types to plan for (do not build now):**
- `pairRating`: one claim x technique pair with a numeric scale (probative weight, anchored), a confidence scale and an optional short justification. Store as **long format** in a `Ratings` tab (`submission_id`, `participant_id`, `round`, `pair_id`, `weight`, `confidence`, `justification`, `submitted_at_utc`). Do not use one column per pair, because each expert may rate 20-30 pairs.
- `summaryViewer`: renders the anonymised Round 1 summary for Round 2. Content is entered by the researcher into a `Summaries` tab and served by a `getSummary` action to verified panellists. Track "time spent reading" client-side only if the researcher wants it.
- `slotPicker`: call scheduling from a `Slots` tab, with `LockService` preventing double-booking.

**Round 2 rule of thumb:** show each participant their own Round 1 answers beside the anonymised panel summary, and store Round 2 answers as new rows (never overwrite Round 1), so the round-to-round shift can be analysed.

---

## 17. Build order (milestones)

1. **Scaffold:** Vite + React + TS, wouter routes, layout, tokens, fonts, `vercel.json`, `.env.example`, empty pages.
2. **Content pages:** Home, Process (with `ProcessOverview` and time bar), Privacy (placeholders), 404.
3. **Form engine:** types, `validate.ts` with unit tests, `useFormState`, field components, `FormRenderer` with steps, error summary and local autosave. Render the Interest form from JSON with a mocked API.
4. **Availability grid and matrix** (mobile-first), with accessibility checks.
5. **Backend:** Sheet, `setup()`, `Code.gs`, `export-schemas.mjs`, real `submit` and `getStatus`. Connect the front end and pass the functional checks for submit, supersede, idempotency and validation.
6. **Emails and drafts:** copy of responses, resume code, `saveDraft`, `getDraft`, notifications, daily purge trigger.
7. **Hardening and polish:** honeypot, rate limits, headers, error states, dark mode, Lighthouse and accessibility pass.
8. **Docs and hand-off:** repo `README.md` with §14, a "how to add a form" section from §16, and a list of all placeholders.

---

## 18. Placeholders the owner must supply

| Placeholder | Where used |
|---|---|
| `[STUDY NAME]` and short site title | Header, emails, Config |
| `[EMAIL]` (contact) | Footer, confirmation, emails, privacy page, Config |
| `[SITE_URL]` | Config (resume-code emails) |
| `[DATE]` (when the team will reply) | Confirmation page |
| `[RETENTION PERIOD]` | `consent_storage` text, privacy page |
| `[INSTITUTION / DATA CONTROLLER]`, ethics or DPO reference | Privacy page |
| `[TRANSCRIPTION TOOL]` | Privacy page (if a third-party tool is used for the call) |
| `[TEAM NAMES]` and affiliations | Home page, emails |
| Response deadline for the interest form | `interest_closes_at` in Config, invitation email |
| Final wording of the stage descriptions and dates | `src/content/process.ts` |
