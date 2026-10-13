# AGENTS.md

A guide for contributors, human or AI, to the parts of this repository: what each one does, what it must not do, and how the parts fit together.

## System overview

| Component | Runs in | Role |
| --- | --- | --- |
| Front end (`src/`) | Visitor's browser, served statically by Vercel | Renders JSON-defined forms, validates input, autosaves drafts, posts to the backend |
| Backend (`apps-script/`) | Google Apps Script, bound to the study's Google Sheet | Re-validates, rate-limits, stores rows, sends emails, manages server-side drafts |
| Schema export (`scripts/export-schemas.mjs`) | Node, on a developer machine | Copies `src/forms/*.json` into `apps-script/Forms.gs` so both sides share one definition |

Data flow: `pages/FormPage` → `components/form/FormRenderer` → `services/api.call()` → `Code.gs doPost()` → Sheet.

## Front-end modules

### `src/formEngine/`: form logic

- **Responsibilities:** the form schema types (`types.ts`), `showIf` evaluation and payload stripping (`visibility.ts`), per-field and per-form validation (`validate.ts`), the rules for the elicitation item types `estimate` and `allocation` (`items.ts`), dynamic defaults (`defaults.ts`), and upgrading drafts saved under an earlier form version (`upgrade.ts`).
- **Boundaries:** pure TypeScript, with no React, DOM, storage or network access. It may import only from `utils/`.
- **Contract:** `validate.ts` must match `validateFieldServer_` in `apps-script/Code.gs`, and `items.ts` must match `estimateError_` / `allocationError_` (same messages, same order of checks). If you change a rule or a message, change both. `src/forms/serverParity.test.ts` runs both validators on the same inputs and fails if they disagree.

### `src/forms/`: form definitions

- **Responsibilities:** one JSON file per form, plus the registry `index.ts` (`getForm`). `interest.json` is the expression of interest; `round1.json` is the Delphi Round 1 questionnaire (40 items transcribed from Part B of the study's questionnaire v1, a research document kept outside this repository). Its domain sections use `gateField` (items 02–10 unlock once item 01 is valid) and the form sets `stepNav`.
- **Analysis metadata:** `<id>.meta.json` (e.g. `round1.meta.json`) holds per-item fields for analysis only (item type, slot, pair, ledger and claim references). `export-schemas.mjs` merges it into `Forms.gs` as `itemMeta`. **Never import a `.meta.json` file in the front end**: these labels must not be shown to participants, so they stay out of the JS bundle (the file itself is public in the repository).
- **Boundaries:** data only. Field `id`s double as Sheet column headers, so renaming one creates a new column. Questionnaire item text must stay free of the internal labels and use bold, not italics (`forms.test.ts` checks both). Do not edit item wording while a round is open; bump `version` and `itemVersion` when you do, and list the reworded fields in `resetOnUpgrade` so drafts saved under the old wording are restored without those answers.
- **After editing:** run `npm run export:schemas` and redeploy the backend.

### `src/services/`: I/O

- `api.ts`: the only module that talks to the network. `call()` never throws. Every failure comes back as `{ ok: false, code, message }`. Request and response types for each action are defined here.
- `storage.ts`: the only module that touches `localStorage` or `sessionStorage` (local drafts, resume codes, confirmation details). Reads are shape-checked, and storage errors are swallowed.

### `src/hooks/`: stateful glue

- `useFormState`: holds the answers object.
- `useFormStatus`: asks the server whether a form is open.
- `useLocalDraftAutosave`: debounced local persistence.
- `useRegistrationCheck`: for forms with `access: "panel"`, checks the email against the expressions of interest before the participant leaves the step that asks for it.

### `src/components/`: presentation

- `layout/`: the page shell (header, footer, skip link).
- `form/`: `FormRenderer` runs the step-by-step flow (which step is shown, when to validate, submission). Next always validates the current step and blocks on errors; with `stepNav`, the step bar only jumps forward to steps whose earlier steps are complete; a section's `gateField` disables the fields after it until it is valid. `DraftBar` and `ResumeDialog` handle server drafts. `FormParts` holds small presentational pieces: the draft banner, progress bars, step bar, honeypot and closed notice.
- `fields/`: one component per field type. `FieldRenderer` maps a field's `type` to a component and coerces stored values to the expected shape. `FieldShell` provides the shared label, help and error markup, including the ARIA wiring. `EstimateField` (four-step) and `AllocationField` (100% across codes) share `ItemParts`.
- `delphi/`: blocks that the questionnaire embeds through `info` fields (`component`): instructions, reference scenario and glossary (with the briefing pack link). Their copy lives in `content/delphi.ts`.
- `MarkdownLite` renders the copy: paragraphs, dash lists, `**bold**` and links. It has no italics by design.
- **Boundaries:** components call `services/` only through hooks or event handlers. Field components receive `value` and `onChange` and never read the full form data themselves.

### `src/pages/`, `src/content/`, `src/config.ts`

- `pages/`: one component per route. They are thin and delegate to components.
- `content/`: owner-editable copy. Components read from here instead of hard-coding study details.
- `config.ts`: runtime settings (backend URL, timeouts). This is the only place that reads `import.meta.env`.

## Backend (`apps-script/`)

- `Code.gs`: request routing (`doPost`), validation, flattening answers into Sheet columns, idempotent submission (keyed by `submissionId`), superseding earlier rows from the same email, emails, drafts, and `setup()`. Forms with `access: "panel"` accept submissions and draft saves only from emails found in the expression-of-interest sheet (`checkEmail` lets the front end check early). Forms with `estimate`/`allocation` items also get a salted pseudonymous `participant_id` and a `<sheet>_Long` tab with one row per item (no names or emails) for analysis.
- `Forms.gs`: generated. Do not edit it by hand.
- `appsscript.json`: the manifest (OAuth scopes and web app access).
- **Boundaries:** treat every request field as untrusted. Pass values through `cell_()` before writing to the Sheet. Look forms up with `formFor_()`, never `FORMS[id]`.

## Conventions

- TypeScript is strict, with no unused locals or parameters. Use `unknown` plus type guards instead of `any`.
- Files: PascalCase for React components, camelCase for everything else.
- Keep everything dependency-light. Add no analytics, trackers, third-party fonts or third-party scripts, because the CSP in `vercel.json` would block them.
- Before pushing, run `npm test && npm run build`.

## What belongs in the repository

The repository is public for research transparency, so it holds only functional code and essential documentation (`README.md`, `AGENTS.md`, `apps-script/README.md`, `docs/blueprint.md`).

- Keep research working documents out: questionnaire drafts, implementation specs, taxonomies, papers, meeting notes. `.gitignore` ignores Markdown, PDF, Word and text files at the repository root, except `README.md` and `AGENTS.md`.
- Never commit study data, Sheet exports, participant names or emails, or `.env` files.
- Never put secrets in the front end or the repository. The Apps Script URL is public by design; the pseudonym salt (`id_salt`) lives only in the Sheet's `Config` tab.
