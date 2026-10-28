/**
 * Bakı xəritəsindəki 30 loqonun yeri (bölmə 5.3). Koordinatlar map.webp-nin piksel sistemindədir (765×1020).
 * Yerlər müştərinin qırmızı nöqtəli şəklindən (28.10.2026), sıra: yuxarıdan aşağı.
 * Kənara çox yaxın nöqtələr içəri çəkilib: mərkəz kənardan ən azı 14 vahid (loqo kəsilməsin).
 * Dəqiqləşdirmək üçün: `?dev` → "Yer seçici" (bölmə 9.1).
 * @module maps/baku/logos
 */

/**
 * @typedef {Object} LogoSpot
 * @property {string} id
 * @property {number} x           Mərkəz (viewBox vahidi)
 * @property {number} y
 * @property {number} size        En (viewBox vahidi)
 * @property {number} [rotate]    Dərəcə
 * @property {number} [skewY]     Dərəcə, izometrik fasad üçün
 * @property {number} [scaleY]    Şaquli sıxılma (məs. 0.6 — dam kimi üfüqi səth)
 * @property {number} [hitRadius] viewBox vahidi; yazılmayanda SETTINGS.defaultHitRadiusU-dan hesablanır
 */

/** @type {LogoSpot[]} */
export const BAKU_LOGOS = [
  { id: 'l01', x: 57, y: 14, size: 16 },
  { id: 'l02', x: 246, y: 14, size: 16 },
  { id: 'l03', x: 651, y: 64, size: 16 },
  { id: 'l04', x: 528, y: 80, size: 16 },
  { id: 'l05', x: 439, y: 139, size: 16 },
  { id: 'l06', x: 751, y: 148, size: 16 },
  { id: 'l07', x: 54, y: 261, size: 16 },
  { id: 'l08', x: 522, y: 315, size: 16 },
  { id: 'l09', x: 299, y: 419, size: 16 },
  { id: 'l10', x: 21, y: 420, size: 16 },
  { id: 'l11', x: 167, y: 420, size: 16 },
  { id: 'l12', x: 678, y: 495, size: 16 }, // Heydər Əliyev Mərkəzi
  { id: 'l13', x: 234, y: 587, size: 16 },
  { id: 'l14', x: 427, y: 601, size: 16 },
  { id: 'l15', x: 346, y: 640, size: 16 },
  { id: 'l16', x: 25, y: 649, size: 16 },
  { id: 'l17', x: 665, y: 662, size: 16 },
  { id: 'l18', x: 121, y: 667, size: 16 },
  { id: 'l19', x: 697, y: 690, size: 16, scaleY: 0.6 }, // dam, perspektivdə yastı
  { id: 'l20', x: 69, y: 717, size: 16 },
  { id: 'l21', x: 266, y: 738, size: 16 },
  { id: 'l22', x: 373, y: 762, size: 16 },
  { id: 'l23', x: 598, y: 779, size: 16 },
  { id: 'l24', x: 747, y: 894, size: 16 },
  { id: 'l25', x: 212, y: 906, size: 16 },
  { id: 'l26', x: 34, y: 918, size: 16 },
  { id: 'l27', x: 355, y: 921, size: 16 },
  { id: 'l28', x: 473, y: 942, size: 16 },
  { id: 'l29', x: 299, y: 1002, size: 16 },
  { id: 'l30', x: 78, y: 1006, size: 16 },
];
