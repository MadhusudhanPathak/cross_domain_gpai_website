# GPAI Delphi Study Website

A small static site that hosts the forms for the GPAI Delphi study. Submissions go to a Google Sheet through a Google Apps Script web app. The site has no user accounts, no cookies, no analytics, and makes no third-party requests other than the Apps Script call.

Forms are defined in JSON (`src/forms/`), so a new form needs no new page code. The design specification the site was built from is in [`docs/blueprint.md`](docs/blueprint.md).

## Prerequisites

- Node.js 18 or later, and npm
- A Google account (for the Sheet and the Apps Script backend)
- A Vercel account (or any static host that can rewrite unknown paths to `index.html`)

## Setup

```bash
npm install
cp .env.example .env.local   # optional: point at a different Apps Script deployment
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check, then build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit tests (Vitest) |
| `npm run export:schemas` | Regenerate `apps-script/Forms.gs` from `src/forms/*.json` |

### Configuration

| Setting | Where | Notes |
| --- | --- | --- |
| `VITE_APPS_SCRIPT_URL` | `.env.local` or the host's environment variables | Apps Script `/exec` URL. If unset or blank, the default in `src/config.ts` is used. The URL is public by design, so it is not a secret. |
| Study copy, contact email, dates | `src/content/site.ts`, `src/content/process.ts` | Owner-editable text |
| Form open/close, notification email | The Sheet's `Config` tab | Takes effect without a redeploy |

## Architecture

```text
Browser (React SPA on Vercel)
  └─ POST text/plain JSON ──> Apps Script web app (apps-script/Code.gs)
                                └─ Google Sheet tabs: Interest, Drafts, Config, Panel, Log
```

```text
src/
├─ main.tsx, App.tsx      Entry point and routes
├─ config.ts              Runtime configuration (backend URL, timeouts)
├─ content/               Owner-editable copy (study details, process stages)
├─ forms/                 JSON form definitions and the form registry
├─ formEngine/            Pure form logic: types, visibility, validation, defaults
├─ services/              Backend API client and browser storage
├─ hooks/                 React hooks for form state, status and autosave
├─ components/
│  ├─ layout/             Header, footer, page shell
│  ├─ form/               Multi-step form renderer, drafts, error summary
│  └─ fields/             One component per field type
├─ pages/                 Route components
├─ utils/                 Date, UUID and type-guard helpers
└─ styles/                Design tokens and global CSS
apps-script/              Backend source, pasted into the Sheet's Apps Script project
scripts/                  Build helpers (schema export)
docs/                     Design specification
```

Key points:

- **Validation runs twice.** `src/formEngine/validate.ts` validates in the browser, and `apps-script/Code.gs` repeats the same rules on the server. Change them together.
- **`Forms.gs` is generated.** The backend reads form definitions from `apps-script/Forms.gs`, which `npm run export:schemas` builds from `src/forms/*.json`.
- **Requests use `Content-Type: text/plain`**, which avoids a CORS preflight that Apps Script cannot answer.
- **Answers are autosaved** to `localStorage` on the visitor's device. "Save and continue later" also stores a server-side draft, protected by a resume code sent by email.

See [`AGENTS.md`](AGENTS.md) for what each module is responsible for.

## Deployment

### A. Google Sheet and Apps Script

1. Create a Google Sheet named **`GPAI Delphi Study: Data`**.
2. Open **Extensions > Apps Script** and follow [`apps-script/README.md`](apps-script/README.md) to add `Code.gs`, `Forms.gs` and the manifest.
3. Run `setup()` once from the editor and authorize the permissions.
4. Fill in the `Config` tab: `contact_email`, `notify_email`, `site_url`, `study_name`.
5. **Deploy > New deployment > Web app**, execute as **Me**, access **Anyone**. Copy the `/exec` URL.
6. Check it works:

   ```bash
   URL="https://script.google.com/macros/s/XXXX/exec"
   curl -sL "$URL"
   curl -sL -X POST "$URL" -H "Content-Type: text/plain" -d '{"action":"getStatus","formId":"interest"}'
   ```

### B. Vercel

1. Push the repository to GitHub and import it in Vercel (framework preset **Vite**, build `npm run build`, output `dist`).
2. Optionally set `VITE_APPS_SCRIPT_URL` for Production and Preview. Otherwise the default in `src/config.ts` is used.
3. Deploy, submit a test response, and check that a row appears in the `Interest` tab.
4. If you add a custom domain, update `site_url` in the `Config` tab.

`vercel.json` sets up the SPA rewrites and the security headers (CSP, `noindex`, no referrer).

### C. Updating

- **Front end:** push to GitHub. Vercel redeploys automatically.
- **Backend:** edit the script, then use **Deploy > Manage deployments > Edit > Version: New version**, which keeps the same URL.
- **After changing a form's JSON:** run `npm run export:schemas`, paste the new `Forms.gs`, redeploy the script, and push the front end. Run `setup()` again to add any new column headers. It never changes existing data.

## Usage

### Adding a form

1. Create `src/forms/<id>.json`. The field types are listed in `src/formEngine/types.ts`, and §6 of the blueprint describes them in full.
2. Register it in `src/forms/index.ts`.
3. Add `<id>_open` (and optionally `<id>_closes_at`) to the `Config` tab.
4. Run `npm run export:schemas`, paste `Forms.gs`, redeploy the script, and run `setup()`.

The form is then live at `/forms/<id>`. A minimal definition:

```json
{
  "id": "feedback",
  "version": "1.0.0",
  "title": "Feedback",
  "submitLabel": "Send",
  "sheet": "Feedback",
  "access": "open",
  "sections": [
    {
      "id": "main",
      "title": "Your feedback",
      "fields": [
        { "id": "email", "type": "email", "label": "Email", "required": true },
        { "id": "comments", "type": "textarea", "label": "Comments", "maxLength": 2000 }
      ]
    }
  ]
}
```

Panel-only forms, Round 2 and call scheduling are not built yet. §16 of the blueprint describes how to add them.

### Content to fill in before launch

| Item | Where |
| --- | --- |
| Study name, contact email, site URL, reply-by date, retention period, data controller, transcription tool, team | `src/content/site.ts` (and the matching `Config` keys) |
| Stage descriptions and dates | `src/content/process.ts` |
| Retention wording in the consent text | `src/forms/interest.json` (`consent_storage`) |
| Interest form close date | `Config` → `interest_closes_at` |

The institution's data protection officer or ethics committee must approve the wording of the Privacy page (`src/pages/Privacy.tsx`) before the site goes live.

## Security

- The front end holds no secrets. Abuse protection (honeypot, rate limits, server-side validation, formula-injection escaping, payload size caps) lives in `apps-script/Code.gs`.
- Resume codes are stored only as SHA-256 hashes.
- The site sets no cookies, loads no third-party scripts or fonts, and tells search engines not to index it.
