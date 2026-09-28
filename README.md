# GPAI Delphi Study Website

A light static site that hosts every form used in the GPAI Delphi study. All submissions are stored in a Google Sheet via a Google Apps Script web app. No user accounts, no analytics, no third-party requests besides the Apps Script call.

See [`gpai-delphi-site-blueprint.md`](gpai-delphi-site-blueprint.md) for the full specification this repo implements.

## Stack

Vite + React 18 + TypeScript, `wouter` for routing, plain CSS with design tokens, self-hosted variable fonts, no form/schema library (forms are driven by JSON, see `src/forms/`).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in VITE_APPS_SCRIPT_URL once the backend is deployed
npm run dev
```

Run tests:

```bash
npm test
```

## Deployment

### A. Google Sheet and Apps Script (about 15 minutes)

1. Create the Google Sheet **`GPAI Delphi Study: Data`**.
2. Open **Extensions > Apps Script**. Follow [`apps-script/README.md`](apps-script/README.md) to paste in `Code.gs`, generate and paste `Forms.gs`, and paste the manifest.
3. Run `setup()` once from the editor and authorize the permissions (choose **Advanced > Go to project (unsafe)**, since it is your own script).
4. Fill the `Config` tab: `contact_email`, `notify_email`, `site_url`, `study_name`.
5. **Deploy > New deployment > Web app.** Execute as **Me**. Who has access: **Anyone**. Copy the `/exec` URL.
6. Test with curl (see §15 of the blueprint).

### B. GitHub and Vercel (about 10 minutes)

1. Push this repo to GitHub.
2. In Vercel: **Add New > Project**, import the repo. Framework preset **Vite**, build `npm run build`, output `dist`.
3. Add the environment variable `VITE_APPS_SCRIPT_URL` (the `/exec` URL) for Production and Preview.
4. Deploy. Open the site and submit a test response. Check the row appears in the `Interest` tab.
5. Optionally add a custom domain in Vercel, then update `site_url` in the `Config` tab.

### C. Updating later

- **Front end:** push to GitHub; Vercel redeploys automatically.
- **Backend:** edit the script in the Apps Script editor, then **Deploy > Manage deployments > (pencil) > Version: New version > Deploy** to keep the same URL.
- **After changing any form JSON:** run `npm run export:schemas`, paste the new `apps-script/Forms.gs`, redeploy the script, push the front end. Run `setup()` again if new columns should appear immediately (it only adds missing headers, it never touches existing data).

## Adding a new form (Round 1, Round 2, call scheduling, ...)

1. Add `src/forms/<id>.json` following the field-type spec in §6 of the blueprint.
2. Register it in `src/forms/index.ts`.
3. Add `<id>_open` (and optionally `<id>_closes_at`) to the Sheet's `Config` tab.
4. Run `npm run export:schemas`, paste the generated `apps-script/Forms.gs` into the Apps Script project, redeploy (new version, same URL), then run `setup()` to create the new tab and headers.

No new page code is needed — `/forms/<id>` renders automatically from the registry.

For panel-only forms (`"access": "panel"`), Round 2, ratings storage, and call scheduling, see §16 of the blueprint for the extension design (not built in Phase 1).

## Placeholders to fill in before launch

All owner-editable content lives in [`src/content/site.ts`](src/content/site.ts) and [`src/content/process.ts`](src/content/process.ts), plus the Sheet's `Config` tab.

| Placeholder | Where |
|---|---|
| Study name / short title | `src/content/site.ts` (`studyName`, `shortName`), Config `study_name` |
| Contact email | `src/content/site.ts` (`contactEmail`), Config `contact_email` |
| Site URL | `src/content/site.ts` (`siteUrl`), Config `site_url` |
| Reply-by date | `src/content/site.ts` (`replyByDate`) |
| Retention period | `src/content/site.ts` (`retentionPeriod`), and the `consent_storage` text in `src/forms/interest.json` |
| Data controller / institution, ethics/DPO reference | `src/content/site.ts` (`dataController`), `src/pages/Privacy.tsx` |
| Transcription tool (if any) | `src/content/site.ts` (`transcriptionTool`) |
| Team names | `src/content/site.ts` (`teamNames`) |
| Interest form close date | Config `interest_closes_at` |
| Stage descriptions and dates | `src/content/process.ts` |

**Before the site goes live:** the Privacy page's wording needs sign-off from the institution's data protection officer or ethics committee. This repo provides structure only, per the blueprint.

## Security notes

- No secrets in the front end. The only environment variable is the public Apps Script URL, which cannot be made secret — abuse protection (honeypot, rate limits, server-side validation) is implemented in `apps-script/Code.gs` instead.
- All POSTs to Apps Script use `Content-Type: text/plain` to avoid a CORS preflight that Apps Script cannot answer.
- No cookies, no analytics, no third-party scripts or fonts.
