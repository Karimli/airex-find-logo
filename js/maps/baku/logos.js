/**
 * Bakı xəritəsindəki 30 loqonun yeri (bölmə 5.3). Koordinatlar map.webp-nin piksel sistemindədir (765×1020).
 * İlk variant 03 dizaynından çıxarılıb (dizayn ilə təmiz xəritənin fərqi), sıra: yuxarıdan aşağı.
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
  { id: 'l01', x: 693, y: 39, size: 19 },
  { id: 'l02', x: 188, y: 42, size: 19 },
  { id: 'l03', x: 458, y: 71, size: 19 },
  { id: 'l04', x: 98, y: 89, size: 19 },
  { id: 'l05', x: 657, y: 102, size: 19 },
  { id: 'l06', x: 340, y: 141, size: 19 },
  { id: 'l07', x: 41, y: 146, size: 19 },
  { id: 'l08', x: 658, y: 290, size: 19 },
  { id: 'l09', x: 165, y: 301, size: 19 },
  { id: 'l10', x: 715, y: 305, size: 19 }, // TV qülləsi
  { id: 'l11', x: 601, y: 378, size: 19 },
  { id: 'l12', x: 411, y: 419, size: 19 },
  { id: 'l13', x: 676, y: 499, size: 19 }, // Heydər Əliyev Mərkəzi
  { id: 'l14', x: 125, y: 515, size: 19 }, // Qız qalası
  { id: 'l15', x: 191, y: 588, size: 19 },
  { id: 'l16', x: 660, y: 599, size: 19 },
  { id: 'l17', x: 274, y: 688, size: 19 }, // günbəz
  { id: 'l18', x: 700, y: 691, size: 19, scaleY: 0.6 }, // dam, perspektivdə yastı
  { id: 'l19', x: 448, y: 718, size: 19 },
  { id: 'l20', x: 94, y: 736, size: 19 },
  { id: 'l21', x: 38, y: 752, size: 19 },
  { id: 'l22', x: 349, y: 860, size: 19 },
  { id: 'l23', x: 291, y: 864, size: 19 },
  { id: 'l24', x: 637, y: 911, size: 19 },
  { id: 'l25', x: 33, y: 917, size: 19 },
  { id: 'l26', x: 264, y: 934, size: 19 },
  { id: 'l27', x: 392, y: 942, size: 19 },
  { id: 'l28', x: 196, y: 952, size: 19 },
  { id: 'l29', x: 43, y: 984, size: 19 },
  { id: 'l30', x: 484, y: 996, size: 19 },
];
