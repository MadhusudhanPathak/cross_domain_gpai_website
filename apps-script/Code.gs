/** Entry points ------------------------------------------------------- */
function doGet() { return json_({ ok: true, service: 'gpai-delphi', time: new Date().toISOString() }); }

function doPost(e) {
  let req = {};
  let res;
  try {
    req = JSON.parse(e.postData.contents);
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

const EMAIL_RE_ = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimCap_(v, cap) { return String(v == null ? '' : v).trim().slice(0, cap); }

function validateFieldServer_(field, data, errors) {
  const v = data[field.id];
  const required = field.required;

  switch (field.type) {
    case 'text': case 'email': case 'url': {
      const s = trimCap_(v, field.maxLength || 2000);
      if (required && !s) { errors[field.id] = 'Enter ' + field.label.toLowerCase() + '.'; return; }
      if (!s) return;
      if (field.type === 'email' && (s.length > 254 || !EMAIL_RE_.test(s))) errors[field.id] = 'Enter a valid email address.';
      if (field.type === 'url' && !/^https?:\/\//.test(s)) errors[field.id] = 'Enter a web address starting with http:// or https://.';
      return;
    }
    case 'textarea': {
      const s = trimCap_(v, field.maxLength || 5000);
      if (required && !s) errors[field.id] = 'Enter ' + field.label.toLowerCase() + '.';
      return;
    }
    case 'select': case 'radio': {
      const s = String(v == null ? '' : v);
      if (required && !s) { errors[field.id] = 'Choose an option for "' + field.label + '".'; return; }
      if (s && !field.options.some(function (o) { return o.value === s; })) errors[field.id] = 'Choose a valid option.';
      return;
    }
    case 'checkboxes': {
      const arr = Array.isArray(v) ? v : [];
      const min = field.minItems || (required ? 1 : 0);
      if (arr.length < min) { errors[field.id] = 'Select at least ' + (min === 1 ? 'one option' : min + ' options') + '.'; return; }
      const allowed = {}; field.options.forEach(function (o) { allowed[o.value] = true; });
      if (arr.some(function (x) { return !allowed[x]; })) errors[field.id] = 'Contains an invalid option.';
      return;
    }
    case 'checkbox': {
      if (required && v !== true) errors[field.id] = 'You must check "' + field.label + '".';
      return;
    }
    case 'matrix': {
      const obj = (v && typeof v === 'object') ? v : {};
      const allowedCols = {}; field.columns.forEach(function (c) { allowedCols[c.value] = true; });
      for (const row of field.rows) {
        const rv = obj[row.id];
        if (required && !rv) { errors[field.id] = 'Answer every row for "' + field.label + '".'; return; }
        if (rv && !allowedCols[rv]) { errors[field.id] = 'Contains an invalid answer.'; return; }
      }
      return;
    }
    case 'availability': {
      const obj = (v && typeof v === 'object') ? v : {};
      const validDates = {}; datesBetween_(field.dates.from, field.dates.to).forEach(function (d) { validDates[d] = true; });
      const validSlots = {}; field.slots.forEach(function (s) { validSlots[s.value] = true; });
      let total = 0;
      for (const d in obj) {
        if (!validDates[d]) { errors[field.id] = 'Contains an invalid date.'; return; }
        const slots = obj[d];
        if (!Array.isArray(slots)) continue;
        for (const s of slots) if (!validSlots[s]) { errors[field.id] = 'Contains an invalid time slot.'; return; }
        total += slots.length;
      }
      if (required && total < 1) errors[field.id] = 'Select at least one time slot.';
      return;
    }
    case 'consents': {
      const obj = (v && typeof v === 'object') ? v : {};
      for (const opt of field.options) {
        if (!obj[opt.value]) { errors[field.id] = 'You must agree to every item to continue.'; return; }
      }
      return;
    }
  }
}

function validate_(form, data) {
  const errors = {};
  form.sections.forEach(function (section) {
    if (!visible_(section.showIf, data)) return;
    section.fields.forEach(function (field) {
      if (field.type === 'info') return;
      if (!visible_(field.showIf, data)) return;
      validateFieldServer_(field, data, errors);
    });
  });
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
      if (f.type === 'info') return;
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

  const bodySize = JSON.stringify(req).length;
  if (bodySize > 60000) return fail_('BAD_REQUEST', 'Submission is too large.');

  const data = req.data || {};
  const errors = validate_(form, data);
  if (Object.keys(errors).length) return fail_('VALIDATION', 'Please fix the highlighted fields.', { fieldErrors: errors });

  if (Number(req.elapsedMs) < 8000) log_('INFO', 'submit', 'fast submission: ' + req.elapsedMs + 'ms for ' + form.id);

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

function fieldLabelValue_(field, data) {
  const v = data[field.id];
  switch (field.type) {
    case 'radio': case 'select': {
      const opt = field.options.filter(function (o) { return o.value === v; })[0];
      return opt ? opt.label : String(v || '');
    }
    case 'checkboxes': {
      const arr = Array.isArray(v) ? v : [];
      return arr.map(function (val) {
        const opt = field.options.filter(function (o) { return o.value === val; })[0];
        return opt ? opt.label : val;
      }).join(', ');
    }
    case 'checkbox': return v ? 'Yes' : 'No';
    case 'matrix': {
      const obj = (v && typeof v === 'object') ? v : {};
      return field.rows.map(function (r) {
        const col = field.columns.filter(function (c) { return c.value === obj[r.id]; })[0];
        return r.label + ': ' + (col ? col.label : '(no answer)');
      }).join('; ');
    }
    case 'availability': {
      const obj = (v && typeof v === 'object') ? v : {};
      const slotLabels = {}; field.slots.forEach(function (s) { slotLabels[s.value] = s.label; });
      const dates = Object.keys(obj).filter(function (d) { return (obj[d] || []).length; }).sort();
      if (!dates.length) return '(none selected)';
      return dates.map(function (d) {
        const dt = new Date(d + 'T00:00:00Z');
        const label = Utilities.formatDate(dt, 'UTC', 'EEE d MMM');
        const slots = (obj[d] || []).map(function (s) { return slotLabels[s] || s; }).join(', ');
        return label + ': ' + slots;
      }).join('\n');
    }
    case 'consents': {
      const obj = (v && typeof v === 'object') ? v : {};
      return field.options.map(function (o) { return o.label + ': ' + (obj[o.value] ? 'Yes' : 'No'); }).join('\n');
    }
    default:
      return String(v == null ? '' : v);
  }
}

function sendCopy_(form, data, submissionId, email) {
  if (!rateLimit_('copy:' + email, 3, 3600)) return false;
  const lines = [];
  lines.push('Hello ' + (data.full_name || '') + ',');
  lines.push('');
  lines.push('Here is a copy of the responses you submitted on ' + new Date().toISOString() + '.');
  lines.push('Submission reference: ' + submissionId);
  lines.push('');
  form.sections.forEach(function (section) {
    if (!visible_(section.showIf, data)) return;
    section.fields.forEach(function (field) {
      if (field.type === 'info') return;
      if (!visible_(field.showIf, data)) return;
      lines.push(field.label);
      lines.push(fieldLabelValue_(field, data) || '(no answer)');
      lines.push('');
    });
  });
  lines.push('If you would like to correct anything or withdraw, reply to this email or write to ' + cfg_('contact_email', '') + '.');
  lines.push('');
  lines.push('Thank you,');
  lines.push(String(cfg_('study_name', 'Research team')));
  const body = lines.join('\n');
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
  if (!EMAIL_RE_.test(email)) return fail_('VALIDATION', 'Enter a valid email address to save a draft.');
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

  // Status dropdown on the Interest tab's status column.
  const interestSheet = ss.getSheetByName('Interest');
  if (interestSheet) {
    const header = interestSheet.getRange(1, 1, 1, interestSheet.getLastColumn()).getValues()[0];
    const statusCol = header.indexOf('status') + 1;
    if (statusCol) {
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['new', 'invited', 'accepted', 'waitlist', 'declined', 'superseded'], true)
        .setAllowInvalid(true)
        .build();
      interestSheet.getRange(2, statusCol, Math.max(interestSheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
    }
  }

  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('purgeOldDrafts').timeBased().everyDays(1).atHour(3).create();
}
