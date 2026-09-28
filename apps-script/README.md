# Apps Script backend: paste-and-deploy

This folder is not deployed automatically. Copy its contents into the Apps Script project bound to the Google Sheet.

## First-time setup

1. Create a Google Sheet named **`GPAI Delphi Study: Data`**.
2. In the Sheet, open **Extensions > Apps Script**.
3. In the Apps Script editor, delete the default `Code.gs` content and paste this folder's `Code.gs`.
4. Add a new script file named `Forms.gs`. Run `npm run export:schemas` in the repo root first, then paste the generated `apps-script/Forms.gs` content.
5. In **Project Settings**, check "Show `appsscript.json` manifest file in editor", then open it and paste this folder's `appsscript.json`.
6. Select the `setup` function from the function dropdown and click **Run**. Authorize the permissions when prompted (choose **Advanced > Go to project (unsafe)**, since this is your own script).
7. Fill in the `Config` tab: `contact_email`, `notify_email`, `site_url`, `study_name`.
8. **Deploy > New deployment > Web app.** Execute as **Me**, Who has access: **Anyone**. Copy the `/exec` URL — this is `VITE_APPS_SCRIPT_URL` for the front end.

## Updating the backend later

- Edit `Code.gs` in the Apps Script editor directly, or paste over it from this repo.
- After changing any form JSON in `src/forms/`, run `npm run export:schemas` and paste the new `apps-script/Forms.gs` into the Apps Script project.
- Deploy changes with **Deploy > Manage deployments > (pencil icon) > Version: New version > Deploy**. This keeps the same `/exec` URL. Do **not** use "New deployment" for updates, since that creates a new URL.
- If new form fields were added, run `setup()` again — it only adds missing headers, so existing data is never touched.

## Testing

See §15 of the blueprint for curl commands and the functional checklist.
