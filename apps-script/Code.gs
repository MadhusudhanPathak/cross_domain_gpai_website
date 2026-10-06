/**
 * GPAI Delphi Study backend. Receives JSON POSTs from the static site and stores them in the bound Sheet.
 * Actions: getStatus, submit, saveDraft, getDraft. Form definitions come from FORMS in Forms.gs.
 */

/** Entry points ------------------------------------------------------- */
function doGet() { return json_({ ok: true, service: 'gpai-delphi', time: new Date().toISOString() }); }

function doPost(e) {
  let req = {};
  let res;
  try {
    if (!e || !e.postData || !e.postData.contents) return json_(fail_('BAD_REQUEST', 'Empty request.'));
    try { req = JSON.parse(e.postData.contents); } catch (parseErr) { return json_(fail_('BAD_REQUEST', 'Malformed request.')); }
    if (!req || typeof req !== 'object') return json_(fail_('BAD_REQUEST', 'Malformed request.'));
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
/** Returns the Config value for `key`, first writing `value` if the key is missing or blank. */
function ensureConfig_(key, value) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Config');
  const rows = sh.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] !== key) continue;
    if (rows[i][1] !== '') return rows[i][1];
    sh.getRange(i + 1, 2).setValue(value);
    return value;
  }
  sh.appendRow([key, value]);
  return value;
}
function log_(level, action, message) {
  // Never let logging throw (it would mask the real error), and escape values: action/message can be attacker-controlled.
  try {
    SpreadsheetApp.getActive().getSheetByName('Log').appendRow([new Date().toISOString(), level, cell_(String(action || '').slice(0, 100)), cell_(String(message).slice(0, 500))]);
  } catch (e) { console.error(level + ' ' + action + ' ' + message + ' (log failed: ' + e + ')'); }
}
function rateLimit_(key, max, windowSec) {          // windowSec must be <= 21600 (CacheService limit)
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get(key) || 0);
  if (n >= max) return false;
  cache.put(key, String(n + 1), windowSec);
  return true;
}

/** Cell safety: prevent spreadsheet formula injection -------------------- */
const SHEET_CELL_MAX_ = 50000;                        // Google Sheets' per-cell character limit
function cell_(v, cap) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) v = v.join(', ');
  v = String(v).slice(0, cap || 5000);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;       // leading apostrophe forces text
}

/** Looks up a form definition by id, ignoring Object.prototype keys such as "constructor". */
function formFor_(id) {
  return Object.prototype.hasOwnProperty.call(FORMS, id) ? FORMS[id] : null;
}

/** Status ------------------------------------------------------------- */
function getStatus_(req) {
  const form = formFor_(req.formId);
  if (!form) return fail_('BAD_REQUEST', 'Unknown form.');
  const open = String(cfg_(form.id + '_open', 'TRUE')).toUpperCase() === 'TRUE';
  const closesAt = cfg_(form.id + '_closes_at', '');
  const expired = closesAt && new Date(closesAt) < new Date();
  return { ok: true, open: open && !expired, closesAt: closesAt || undefined };
}

/** Visibility + validation (mirror of src/formEngine/validate.ts) --------------- */
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
      const min = field.minItems != null ? field.minItems : (required ? 1 : 0);
      if (arr.length < min) { errors[field.id] = 'Select at least ' + (min === 1 ? 'one option' : min + ' options') + '.'; return; }
      const allowed = {}; field.options.forEach(function (o) { allowed[o.value] = true; });
      if (arr.some(function (x) { return !allowed[x]; })) { errors[field.id] = 'Contains an invalid option.'; return; }
      if (field.excludeField && arr.indexOf(data[field.excludeField]) >= 0) errors[field.id] = 'Contains an option already chosen elsewhere.';
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
    case 'ranking': {
      const arr = Array.isArray(v) ? v : [];
      if (!required && arr.length === 0) return;
      const ids = field.items.map(function (i) { return i.id; });
      const isPermutation = arr.length === ids.length && ids.every(function (id) { return arr.indexOf(id) >= 0; }) && (new Set(arr)).size === ids.length;
      if (!isPermutation) errors[field.id] = 'Rank every item for "' + field.label + '".';
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
      const min = field.minSlots != null ? field.minSlots : (required ? 1 : 0);
      if (total < min) errors[field.id] = 'Select at least ' + (min === 1 ? 'one time slot' : min + ' time slots') + '.';
      return;
    }
    case 'consents': {
      const obj = (v && typeof v === 'object') ? v : {};
      for (const opt of field.options) {
        if (!obj[opt.value]) { errors[field.id] = 'You must agree to every item to continue.'; return; }
      }
      return;
    }
    case 'estimate': {
      const msg = estimateError_(obj_(v), required);
      if (msg) errors[field.id] = msg;
      return;
    }
    case 'allocation': {
      const msg = allocationError_(obj_(v), field.codes, required);
      if (msg) errors[field.id] = msg;
      return;
    }
  }
}

/** Elicitation items (mirror of src/formEngine/items.ts: same messages, same order of checks) ---- */
const ITEM_MSG_ = {
  estimateMissing: 'Enter all four numbers, or tick "Outside my competence".',
  allocationMissing: 'Allocate 100% across the codes and give your confidence, or tick "Outside my competence".',
  lowest: 'Lower estimate must be a whole number from 0 to 100.',
  highest: 'Upper estimate must be a whole number from 0 to 100.',
  order: 'Upper estimate must be greater than or equal to the lower estimate.',
  best: 'Best estimate must be a whole number from 0 to 100.',
  bestRange: 'Best estimate must be between the lower and upper estimates.',
  confidence: 'Confidence must be a whole number from 50 to 100.',
  points: 'Percentages must be whole numbers from 0 to 100.',
  rationale: 'Keep the rationale to 150 words or fewer.'
};
const RATIONALE_MAX_WORDS_ = 150;
const ESTIMATE_PARTS_ = ['lowest', 'highest', 'best', 'confidence'];

function obj_(v) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
function str_(v) { return typeof v === 'string' ? v : (typeof v === 'number' ? String(v) : ''); }
function blank_(v) { return str_(v).trim() === ''; }
function whole_(v, min, max) {                       // whole number in [min, max], else null
  const s = str_(v).trim();
  if (!/^\d{1,3}$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
}
function wordCount_(v) { const s = str_(v).trim(); return s ? s.split(/\s+/).length : 0; }
function isItem_(field) { return field.type === 'estimate' || field.type === 'allocation'; }

function estimateError_(v, required) {
  if (wordCount_(v.rationale) > RATIONALE_MAX_WORDS_) return ITEM_MSG_.rationale;
  if (v.ooc === true) return '';
  if (ESTIMATE_PARTS_.every(function (p) { return blank_(v[p]); })) return required ? ITEM_MSG_.estimateMissing : '';
  const lo = whole_(v.lowest, 0, 100), hi = whole_(v.highest, 0, 100), best = whole_(v.best, 0, 100);
  if (lo === null) return ITEM_MSG_.lowest;
  if (hi === null) return ITEM_MSG_.highest;
  if (hi < lo) return ITEM_MSG_.order;
  if (best === null) return ITEM_MSG_.best;
  if (best < lo || best > hi) return ITEM_MSG_.bestRange;
  if (whole_(v.confidence, 50, 100) === null) return ITEM_MSG_.confidence;
  return '';
}

function allocationError_(v, codes, required) {
  if (wordCount_(v.rationale) > RATIONALE_MAX_WORDS_) return ITEM_MSG_.rationale;
  if (v.ooc === true) return '';
  const points = obj_(v.points);
  const raw = codes.map(function (c) { return points[c.value]; });
  if (raw.concat([v.confidence]).every(function (x) { return blank_(x); })) return required ? ITEM_MSG_.allocationMissing : '';
  let sum = 0;
  for (const r of raw) {
    if (blank_(r)) continue;                         // blank counts as 0 points
    const n = whole_(r, 0, 100);
    if (n === null) return ITEM_MSG_.points;
    sum += n;
  }
  if (sum !== 100) return 'Percentages must add up to exactly 100% (currently ' + sum + '%).';
  if (whole_(v.confidence, 50, 100) === null) return ITEM_MSG_.confidence;
  return '';
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
  if (itemFields_(form).length) cols.splice(1, 0, 'participant_id');
  form.sections.forEach(function (s) {
    s.fields.forEach(function (f) {
      if (f.type === 'info') return;
      if (isItem_(f)) itemParts_(f).forEach(function (p) { cols.push(f.id + '_' + p); });
      else if (f.type === 'matrix') f.rows.forEach(function (r) { cols.push(f.id + '_' + r.id); });
      else if (f.type === 'ranking') f.items.forEach(function (it) { cols.push(f.id + '_' + it.id); });
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
      if (isItem_(f)) { const parts = itemValues_(f, v); Object.keys(parts).forEach(function (p) { flat[f.id + '_' + p] = parts[p]; }); }
      else if (f.type === 'matrix') f.rows.forEach(function (r) { flat[f.id + '_' + r.id] = v && v[r.id]; });
      else if (f.type === 'ranking') {
        const arr = Array.isArray(v) ? v : [];
        f.items.forEach(function (it) { const idx = arr.indexOf(it.id); flat[f.id + '_' + it.id] = idx >= 0 ? (idx + 1) : ''; });
      }
      else if (f.type === 'availability') Object.keys(v || {}).forEach(function (d) { flat[f.id + '_' + d] = (v[d] || []).join(','); });
      else if (f.type === 'consents') f.options.forEach(function (o) { flat[o.value] = v && v[o.value] ? 'TRUE' : 'FALSE'; });
      else if (f.type === 'checkbox') flat[f.id] = v ? 'TRUE' : 'FALSE';
      else flat[f.id] = v;
    });
  });
  return flat;
}

/** Elicitation items: one column per part in the wide tab, one row per item in the long tab ---- */
function itemFields_(form) {
  const out = [];
  form.sections.forEach(function (s) { s.fields.forEach(function (f) { if (isItem_(f)) out.push(f); }); });
  return out;
}
function itemParts_(f) {
  const head = f.type === 'estimate' ? ESTIMATE_PARTS_ : f.codes.map(function (c) { return c.value; }).concat(['confidence']);
  return head.concat(['ooc', 'rationale']);
}
/** Values keyed like itemParts_(f). Numbers are blank when "Outside my competence" is ticked; blank allocation points are 0. */
function itemValues_(f, raw) {
  const v = obj_(raw), ooc = v.ooc === true, out = {};
  if (f.type === 'estimate') ESTIMATE_PARTS_.forEach(function (p) { out[p] = ooc ? '' : whole_(v[p], 0, 100); });
  else {
    const points = obj_(v.points);
    f.codes.forEach(function (c) { out[c.value] = ooc ? '' : (whole_(points[c.value], 0, 100) || 0); });
    out.confidence = ooc ? '' : whole_(v.confidence, 0, 100);
  }
  out.ooc = ooc ? 'TRUE' : 'FALSE';
  out.rationale = str_(v.rationale).trim();
  return out;
}

function longSheetName_(form) { return form.sheet + '_Long'; }
function longColumnsFor_(form) {
  const allocCodes = [];
  itemFields_(form).forEach(function (f) {
    if (f.type === 'allocation') f.codes.forEach(function (c) { if (allocCodes.indexOf(c.value) < 0) allocCodes.push(c.value); });
  });
  return ['submission_id', 'participant_id', 'status', 'panel', 'round', 'item_id', 'item_version', 'domain', 'position',
    'item_type', 'technique', 'slot', 'pair_id', 'ledger_ref', 'claim_ref', 'response_type', 'out_of_competence',
    'lowest', 'highest', 'best', 'confidence', 'lower80', 'upper80']
    .concat(allocCodes.map(function (c) { return 'alloc_' + c; }))
    .concat(['rationale', 'submitted_at_utc']);
}
/** Standardised 80% interval bound (implementation spec §7.1), clipped to [0, 100]. */
function std80_(best, bound, confidence) {
  const x = best + (bound - best) * (80 / confidence);
  return Math.round(Math.min(100, Math.max(0, x)) * 100) / 100;
}
/** One row object per item, keyed by longColumnsFor_. Item metadata comes from `<id>.meta.json` via Forms.gs. */
function longRows_(form, data, base) {
  const meta = form.itemMeta || { items: {} };
  return itemFields_(form).map(function (f) {
    const parts = itemValues_(f, data[f.id]);
    const m = meta.items[f.id] || {};
    const idMatch = /^(D\d+)-(\d+)$/.exec(f.id);
    const row = Object.assign({}, base, {
      item_id: f.id, item_version: meta.itemVersion, round: meta.round,
      domain: idMatch ? idMatch[1] : '', position: idMatch ? Number(idMatch[2]) : '',
      item_type: m.item_type, technique: m.technique, slot: m.slot, pair_id: m.pair_id, ledger_ref: m.ledger_ref, claim_ref: m.claim_ref,
      response_type: f.type === 'estimate' ? 'four_step' : 'allocation',
      out_of_competence: parts.ooc, confidence: parts.confidence, rationale: parts.rationale
    });
    if (f.type === 'estimate') {
      row.lowest = parts.lowest; row.highest = parts.highest; row.best = parts.best;
      if (parts.ooc === 'FALSE') {
        row.lower80 = std80_(parts.best, parts.lowest, parts.confidence);
        row.upper80 = std80_(parts.best, parts.highest, parts.confidence);
      }
    } else {
      f.codes.forEach(function (c) { row['alloc_' + c.value] = parts[c.value]; });
    }
    return row;
  });
}

/** Stable pseudonym for an email, so analysis tabs need no names or addresses. Salted so it cannot be recomputed from the email alone. */
function participantId_(email) {
  const salt = String(ensureConfig_('id_salt', Utilities.getUuid()));
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + email);
  const hex = bytes.map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); }).join('');
  return 'P' + hex.slice(0, 10).toUpperCase();
}

function datesBetween_(from, to) {                   // 'YYYY-MM-DD' inclusive, UTC-safe
  const out = []; let d = new Date(from + 'T00:00:00Z'); const end = new Date(to + 'T00:00:00Z');
  while (d <= end) { out.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); }
  return out;
}

/** Sheet access -------------------------------------------------------------- */
function sheetFor_(form) { return ensureSheet_(form.sheet, columnsFor_(form)); }
function longSheetFor_(form) { return ensureSheet_(longSheetName_(form), longColumnsFor_(form)); }
function ensureSheet_(name, cols) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  const have = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  const missing = cols.filter(function (c) { return have.indexOf(c) < 0; });
  if (missing.length) {                                // create or extend headers
    sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Marks earlier rows whose `keyHeader` column matches `key` (case-insensitive) as superseded, in one batch write. */
function supersede_(sh, keyHeader, key) {
  if (sh.getLastRow() < 2) return;
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const keyCol = header.indexOf(keyHeader) + 1, statusCol = header.indexOf('status') + 1;
  if (!keyCol || !statusCol) return;
  const n = sh.getLastRow() - 1, target = String(key).toLowerCase();
  const keys = sh.getRange(2, keyCol, n, 1).getValues();
  const statusRange = sh.getRange(2, statusCol, n, 1);
  const statuses = statusRange.getValues();
  let changed = false;
  keys.forEach(function (k, i) {
    if (String(k[0]).toLowerCase() === target && statuses[i][0] !== 'superseded') { statuses[i][0] = 'superseded'; changed = true; }
  });
  if (changed) statusRange.setValues(statuses);
}

/** Appends one long-format row per item (the analysis view), superseding this participant's earlier rows. */
function writeLongRows_(form, data, base) {
  const sh = longSheetFor_(form);
  supersede_(sh, 'participant_id', base.participant_id);
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const rows = longRows_(form, data, base).map(function (r) { return header.map(function (c) { return cell_(r[c]); }); });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, header.length).setValues(rows);
}

/** Submit ------------------------------------------------------------------- */
function submit_(req) {
  const form = formFor_(req.formId);
  if (!form) return fail_('BAD_REQUEST', 'Unknown form.');
  const st = getStatus_(req);
  if (!st.open) return fail_('CLOSED', 'This form is closed. Contact ' + cfg_('contact_email', 'the research team') + '.');

  const bodySize = JSON.stringify(req).length;
  if (bodySize > 120000) return fail_('BAD_REQUEST', 'Submission is too large.');

  const data = req.data || {};
  const errors = validate_(form, data);
  if (Object.keys(errors).length) return fail_('VALIDATION', 'Please fix the highlighted fields.', { fieldErrors: errors });

  if (Number(req.elapsedMs) < 8000) log_('INFO', 'submit', 'fast submission: ' + req.elapsedMs + 'ms for ' + form.id);

  const email = String(data.email || '').trim().toLowerCase();
  if (!rateLimit_('submit:' + form.id + ':' + email, 5, 3600)) return fail_('RATE_LIMIT', 'Too many attempts. Please try again in an hour.');
  if (!rateLimit_('submit:global', 300, 3600)) return fail_('RATE_LIMIT', 'The form is busy. Please try again later.');

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
    supersede_(sh, 'email', email);
    const now = new Date().toISOString();
    const participantId = itemFields_(form).length ? participantId_(email) : '';
    const flat = flatten_(form, data);
    flat.submission_id = submissionId; flat.submitted_at_utc = now; flat.participant_id = participantId;
    flat.form_version = form.version; flat.status = 'new'; flat.admin_notes = '';
    sh.appendRow(header.map(function (c) { return cell_(flat[c]); }));
    if (participantId) {
      writeLongRows_(form, data, { submission_id: submissionId, participant_id: participantId, status: 'new', panel: data.panel, submitted_at_utc: now });
    }
    deleteDraft_(form.id, email);
  } finally { lock.releaseLock(); }

  // The row is stored; mail failures are logged but must not turn a saved submission into an error.
  let copySent = false;
  try {
    if (req.copyRequested) copySent = sendCopy_(form, data, submissionId, email);
  } catch (err) { log_('ERROR', 'sendCopy', String(err)); }
  try { notify_(form, data); } catch (err) { log_('ERROR', 'notify', String(err)); }
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
    case 'ranking': {
      const arr = Array.isArray(v) ? v : [];
      if (!arr.length) return '(not ranked)';
      return arr.map(function (id, idx) {
        const it = field.items.filter(function (x) { return x.id === id; })[0];
        return (idx + 1) + '. ' + (it ? it.label : id);
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
    case 'estimate': case 'allocation': {
      const p = itemValues_(field, v);
      const answer = p.ooc === 'TRUE' ? 'Outside my competence'
        : field.type === 'estimate'
          ? 'Lower estimate ' + p.lowest + ', upper estimate ' + p.highest + ', best estimate ' + p.best + ', confidence ' + p.confidence + '%'
          : field.codes.map(function (c) { return c.code + ' ' + p[c.value] + '%'; }).join(', ') + '; confidence ' + p.confidence + '%';
      return answer + (p.rationale ? '\nRationale: ' + p.rationale : '');
    }
    default:
      return String(v == null ? '' : v);
  }
}

function sendCopy_(form, data, submissionId, email) {
  if (!rateLimit_('copy:' + email, 3, 3600) || !rateLimit_('mail:global', 40, 3600)) return false;   // global cap protects the daily MailApp quota
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
      lines.push(isItem_(field) ? field.id + ' ' + field.label : field.label);
      lines.push(fieldLabelValue_(field, data) || '(no answer)');
      lines.push('');
    });
  });
  lines.push('If you would like to correct anything or withdraw, reply to this email or write to ' + cfg_('contact_email', '') + '.');
  lines.push('');
  lines.push('Thank you,');
  lines.push(String(cfg_('team_names', cfg_('study_name', 'Research team'))));
  const body = lines.join('\n');
  mail_(email, '[' + cfg_('study_name', 'Study') + '] Your responses (' + submissionId.slice(0, 8) + ')', body);
  return true;
}
function notify_(form, data) {
  const to = String(cfg_('notify_email', ''));
  if (!to) return;
  mail_(to, 'New ' + form.id + ' response', [data.full_name, data.expertise_track || data.panel, data.primary_domain, data.commitment]
    .filter(function (x) { return x; }).join(' | '));
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
  const form = formFor_(req.formId); if (!form) return fail_('BAD_REQUEST', 'Unknown form.');
  const email = String(req.email || '').trim().toLowerCase();
  if (!EMAIL_RE_.test(email)) return fail_('VALIDATION', 'Enter a valid email address to save a draft.');
  if (!rateLimit_('draft:' + email, 10, 3600)) return fail_('RATE_LIMIT', 'Too many saves. Please try again later.');
  const json = JSON.stringify(req.data || {});
  if (json.length > SHEET_CELL_MAX_ - 1000) return fail_('VALIDATION', 'Draft is too large.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName('Drafts');
    const row = draftRow_(sh, form.id, email), now = new Date().toISOString();
    if (!row) {                                          // first save: create code and email it
      if (!rateLimit_('mail:global', 40, 3600)) return fail_('RATE_LIMIT', 'Too many saves right now. Please try again later.');
      const code = newCode_();
      sh.appendRow([form.id, email, hash_(code), cell_(json, SHEET_CELL_MAX_), now]);
      mail_(email, '[' + cfg_('study_name', 'Study') + '] Your resume code',
        'Your resume code is ' + code + '.\n\nTo continue your draft, open ' + cfg_('site_url', '') + '/forms/' + form.id +
        ', choose "Resume a saved draft", and enter this email address and code.\n\nDrafts are deleted after 30 days.');
      return { ok: true, savedAt: now, codeEmailed: true };
    }
    const stored = sh.getRange(row, 3).getValue();
    if (!req.code) return fail_('NEEDS_CODE', 'A draft already exists for this email. Enter your resume code to update it.');
    if (hash_(String(req.code).trim().toUpperCase()) !== stored) return fail_('BAD_CODE', 'That resume code is not correct.');
    sh.getRange(row, 4, 1, 2).setValues([[cell_(json, SHEET_CELL_MAX_), now]]);
    return { ok: true, savedAt: now, codeEmailed: false };
  } finally { lock.releaseLock(); }
}
function getDraft_(req) {
  const form = formFor_(req.formId); if (!form) return fail_('BAD_REQUEST', 'Unknown form.');
  const email = String(req.email || '').trim().toLowerCase();
  if (!EMAIL_RE_.test(email)) return fail_('VALIDATION', 'Enter a valid email address.');
  if (!rateLimit_('getdraft:' + email, 10, 3600)) return fail_('RATE_LIMIT', 'Too many attempts. Please try again later.');
  const sh = SpreadsheetApp.getActive().getSheetByName('Drafts');
  const row = draftRow_(sh, form.id, email);
  if (!row) return fail_('NOT_FOUND', 'No saved draft found for this email.');
  const r = sh.getRange(row, 1, 1, 5).getValues()[0];
  if (hash_(String(req.code || '').trim().toUpperCase()) !== r[2]) return fail_('BAD_CODE', 'That resume code is not correct.');
  let data;
  try { data = JSON.parse(r[3]); } catch (err) { return fail_('SERVER', 'The saved draft could not be read.'); }
  return { ok: true, data: data, savedAt: r[4] };
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
  // Seeded from src/content/site.ts; update both if the study's contact details change.
  const cfg = ss.getSheetByName('Config');
  if (cfg.getLastRow() < 2) cfg.getRange(2, 1, 7, 2).setValues([
    ['interest_open', 'TRUE'], ['interest_closes_at', ''], ['contact_email', 'madhu.sudhan.pathak.ais@gmail.com'],
    ['notify_email', ''], ['site_url', 'https://crossdomaingpaiwebsite.vercel.app/'], ['study_name', 'Cross Domain GPAI Delphi Study'],
    ['team_names', 'Elisabetta, Carola, Madhusudhan']]);
  // Keys added after the first setup are appended without touching existing values.
  Object.keys(FORMS).forEach(function (id) { ensureConfig_(id + '_open', 'TRUE'); });
  ensureConfig_('id_salt', Utilities.getUuid());
  Object.keys(FORMS).forEach(function (id) {                             // creates form tabs + headers
    sheetFor_(FORMS[id]);
    if (itemFields_(FORMS[id]).length) longSheetFor_(FORMS[id]);
  });

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
