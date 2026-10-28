/**
 * Ən yaxşı nəticənin və Google Sheets-ə göndərilməmiş nəticələrin (outbox) saxlanması (bölmə 2.5, 6.2).
 * `localStorage` əlçatmaz olsa da oyun işləyir.
 * Angular-da: `@Injectable` StorageService.
 * @module core/storage
 */

const APP_PREFIX = 'airex.findLogo.';
const BEST_PREFIX = `${APP_PREFIX}best.`;
const OUTBOX_KEY = `${APP_PREFIX}outbox`;
/** Ən köhnələr silinir ki, localStorage limiti (≈5 MB) dolmasın */
const MAX_OUTBOX = 10000;

/**
 * @typedef {Object} BestResult
 * @property {number} score   Tapılmış loqo sayı
 * @property {number} timeMs  Oyunun müddəti
 * @property {string} date    ISO tarix
 */

/**
 * Daha çox loqo qalib gəlir; bərabərdirsə daha az vaxt (bölmə 2.5).
 * @param {{ score: number, timeMs: number }} a
 * @param {{ score: number, timeMs: number }} b
 * @returns {boolean}  a b-dən yaxşıdırsa true
 */
export function isBetter(a, b) {
  return a.score > b.score || (a.score === b.score && a.timeMs < b.timeMs);
}

/**
 * @param {string} mapId
 * @returns {BestResult | null}  Rekord yoxdursa və ya dəyər pozulubsa null
 */
export function getBest(mapId) {
  try {
    const raw = globalThis.localStorage?.getItem(BEST_PREFIX + mapId);
    const value = raw ? JSON.parse(raw) : null;
    if (!Number.isInteger(value?.score) || value.score <= 0 || !Number.isFinite(value.timeMs)) return null;
    return { score: value.score, timeMs: value.timeMs, date: String(value.date ?? '') };
  } catch {
    return null;
  }
}

/**
 * @param {string} mapId
 * @param {BestResult} result
 * @returns {boolean}  Yazılıbsa true
 */
export function setBest(mapId, result) {
  try {
    globalThis.localStorage?.setItem(BEST_PREFIX + mapId, JSON.stringify({
      score: result.score,
      timeMs: Math.round(result.timeMs),
      date: result.date,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Rekordu silir (dev paneli).
 * @param {string} mapId
 */
export function clearBest(mapId) {
  try {
    globalThis.localStorage?.removeItem(BEST_PREFIX + mapId);
  } catch {
    // localStorage əlçatmazdır — oyun yenə işləyir
  }
}

/**
 * @typedef {Object} OutboxItem  Google Sheets-ə hələ göndərilməmiş nəticə
 * @property {string} id      Təkrar yazılmaması üçün unikal ID
 * @property {number} at      Epoch ms
 * @property {string} local   Kioskun yerli vaxtı: "dd.mm.yyyy - hh:mm:ss"
 * @property {number} score   Tapılmış loqo sayı
 * @property {number} ms      Oyun müddəti
 * @property {string} map
 */

/** @returns {OutboxItem[]} */
export function getOutbox() {
  try {
    const raw = globalThis.localStorage?.getItem(OUTBOX_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((item) => typeof item?.id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * @param {OutboxItem[]} items
 * @returns {boolean}
 */
export function setOutbox(items) {
  try {
    globalThis.localStorage?.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-MAX_OUTBOX)));
    return true;
  } catch {
    return false;
  }
}
