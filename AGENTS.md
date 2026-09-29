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

- **Responsibilities:** the form schema types (`types.ts`), `showIf` evaluation and payload stripping (`visibility.ts`), per-field and per-form validation (`validate.ts`), and dynamic defaults (`defaults.ts`).
- **Boundaries:** pure TypeScript, with no React, DOM, storage or network access. It may import only from `utils/`.
- **Contract:** `validate.ts` must match `validateFieldServer_` in `apps-script/Code.gs`. If you change a rule or a message, change both.

### `src/forms/`: form definitions

- **Responsibilities:** one JSON file per form, plus the registry `index.ts` (`getForm`).
- **Boundaries:** data only. Field `id`s double as Sheet column headers, so renaming one creates a new column.
- **After editing:** run `npm run export:schemas` and redeploy the backend.

### `src/services/`: I/O

- `api.ts`: the only module that talks to the network. `call()` never throws. Every failure comes back as `{ ok: false, code, message }`. Request and response types for each action are defined here.
- `storage.ts`: the only module that touches `localStorage` or `sessionStorage` (local drafts, resume codes, confirmation details). Reads are shape-checked, and storage errors are swallowed.

### `src/hooks/`: stateful glue

- `useFormState`: holds the answers object.
- `useFormStatus`: asks the server whether a form is open.
- `useLocalDraftAutosave`: debounced local persistence.

### `src/components/`: presentation

- `layout/`: the page shell (header, footer, skip link).
- `form/`: `FormRenderer` runs the step-by-step flow (which step is shown, when to validate, submission). `DraftBar` and `ResumeDialog` handle server drafts. `FormParts` holds small presentational pieces: the draft banner, progress bar, honeypot and closed notice.
- `fields/`: one component per field type. `FieldRenderer` maps a field's `type` to a component and coerces stored values to the expected shape. `FieldShell` provides the shared label, help and error markup, including the ARIA wiring.
- **Boundaries:** components call `services/` only through hooks or event handlers. Field components receive `value` and `onChange` and never read the full form data themselves.

### `src/pages/`, `src/content/`, `src/config.ts`

- `pages/`: one component per route. They are thin and delegate to components.
- `content/`: owner-editable copy. Components read from here instead of hard-coding study details.
- `config.ts`: runtime settings (backend URL, timeouts). This is the only place that reads `import.meta.env`.

## Backend (`apps-script/`)

- `Code.gs`: request routing (`doPost`), validation, flattening answers into Sheet columns, idempotent submission (keyed by `submissionId`), superseding earlier rows from the same email, emails, drafts, and `setup()`.
- `Forms.gs`: generated. Do not edit it by hand.
- `appsscript.json`: the manifest (OAuth scopes and web app access).
- **Boundaries:** treat every request field as untrusted. Pass values through `cell_()` before writing to the Sheet. Look forms up with `formFor_()`, never `FORMS[id]`.

## Conventions

- TypeScript is strict, with no unused locals or parameters. Use `unknown` plus type guards instead of `any`.
- Files: PascalCase for React components, camelCase for everything else.
- Keep everything dependency-light. Add no analytics, trackers, third-party fonts or third-party scripts, because the CSP in `vercel.json` would block them.
- Before pushing, run `npm test && npm run build`.
