/**
 * Ən yaxşı nəticənin saxlanması (bölmə 2.5). `localStorage` əlçatmaz olsa da oyun işləyir.
 * Gələcəkdə server əlavə olunarsa: əvvəl buraya lokal yazılır, sonra outbox ilə göndərilir (bölmə 6.2).
 * Angular-da: `@Injectable` StorageService.
 * @module core/storage
 */

const APP_PREFIX = 'airex.findLogo.';
const BEST_PREFIX = `${APP_PREFIX}best.`;

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
