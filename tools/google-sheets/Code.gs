/**
 * AIREX Find AIREX Logo → Google Sheets
 *
 * Kiosk hər bitmiş oyunu bu Web App-ə POST edir, nəticə "Nəticələr" vərəqinə yazılır.
 * Eyni nəticə iki dəfə gəlsə (internet kəsilib təkrar göndəriləndə), "tarix-saat + loqo + ms"-ə görə təkrar yazılmır.
 * Oyun hər açılışda GET ?action=list ilə nəticələri oxuyur → ən yaxşı nəticə bütün cihazlarda eynidir.
 *
 * Quraşdırma: Extensions → Apps Script → bu kodu yapışdır → Deploy → New deployment → Web app
 *   Execute as: Me   ·   Who has access: Anyone
 */

const SHEET_NAME = 'Nəticələr';
const HEADERS = ['Tarix - saat', 'Loqo', 'Vaxt', 'Vaxt (ms)'];

/**
 * Kioskdan gələn sorğu:
 *   { results: [{ id, at, local, score, ms, map }] }  → nəticələri yazır (id və map cədvələ yazılmır)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const incoming = Array.isArray(body.results) ? body.results : [];
    const sheet = getSheet_();

    const lastRow = sheet.getLastRow();
    const known = new Set(
      lastRow > 1
        ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues().map((r) => key_(r[0], r[1], r[3]))
        : [],
    );

    const rows = [];
    const accepted = [];
    for (const r of incoming) {
      const score = Math.round(Number(r.score));
      const ms = Math.round(Number(r.ms));
      const local = String(r.local || '');
      if (!local || !Number.isFinite(score) || score < 0 || !Number.isFinite(ms) || ms <= 0) continue;
      const key = key_(local, score, ms);
      if (!known.has(key)) {
        known.add(key);
        rows.push([local, score, formatTime_(ms), ms]);
      }
      // Kiosk bu ID-ləri növbədən silir (yeni yazılanlar + əvvəldən olanlar)
      accepted.push(String(r.id || ''));
    }
    if (rows.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    }

    return json_({ ok: true, saved: rows.length, accepted });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * GET ?action=list → { ok, results: [{ local, score, ms }] } (cədvəldəki sıra ilə, köhnədən yeniyə)
 * GET (parametrsiz) → işlədiyini yoxlamaq üçün
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'list') {
    try {
      return json_({ ok: true, results: readResults_() });
    } catch (err) {
      return json_({ ok: false, error: String(err) });
    }
  }
  return json_({ ok: true, sheet: SHEET_NAME });
}

/** Düzgün formatlı sətirləri oxuyur (əl ilə yazılmış yanlış sətirlər atlanır). */
function readResults_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet
    .getRange(2, 1, lastRow - 1, HEADERS.length)
    .getValues()
    .map((r) => ({ local: String(r[0]), score: Number(r[1]), ms: Number(r[3]) }))
    .filter((r) => r.local && Number.isInteger(r.score) && r.score >= 0 && Number.isFinite(r.ms) && r.ms > 0);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  // Sütun formatları hər dəfə məcburi: A, C mətn ("01:07" saat kimi oxunmasın), B və D tam ədəd.
  sheet.getRange('A:A').setNumberFormat('@');
  sheet.getRange('B:B').setNumberFormat('0');
  sheet.getRange('C:C').setNumberFormat('@');
  sheet.getRange('D:D').setNumberFormat('0');
  return sheet;
}

/** Təkrarlanmanı tanımaq üçün açar: kioskun yerli tarix-saatı + loqo sayı + müddət (ms) */
function key_(local, score, ms) {
  return String(local) + '|' + Math.round(Number(score)) + '|' + Math.round(Number(ms));
}

function formatTime_(ms) {
  const total = Math.floor(ms / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return pad(Math.floor(total / 60)) + ':' + pad(total % 60);
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
