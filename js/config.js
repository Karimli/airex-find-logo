/**
 * Xəritə konfiqi və oyun ayarları (bölmə 8.2).
 * Asset yolları yalnız buradan gəlir (Angular-da `assets/` yolu dəyişə bilər).
 * @module config
 */

import { BAKU_LOGOS } from './maps/baku/logos.js';

/**
 * @typedef {Object} MapConfig
 * @property {string} id
 * @property {string} title
 * @property {string} image                          Təmiz xəritə (loqosuz): start, game, result
 * @property {{ width: number, height: number }} imageSize  Şəklin orijinal ölçüsü = overlay viewBox
 * @property {string} mark                           Xəritədəki loqonun SVG-si
 * @property {import('./maps/baku/logos.js').LogoSpot[]} logos
 */

/** @type {MapConfig} */
export const MAP_BAKU = {
  id: 'baku',
  title: 'XƏRİTƏ',
  image: 'assets/maps/baku/map.webp',
  imageSize: { width: 765, height: 1020 },
  mark: 'assets/brand/logo-icon.svg',
  logos: BAKU_LOGOS, // 30 dənə
};

/** Hər xəritədə olmalı loqo sayı (bölmə 5.3) */
export const EXPECTED_LOGO_COUNT = 30;

/**
 * Xəritədən asılı olmayan SVG-lər. HTML-də `data-svg="<açar>"` ilə işarələnən yerə inline yerləşdirilir.
 * @type {Record<string, string>}
 */
export const UI_ASSETS = {
  logo: 'assets/brand/airex-logo.svg',
  ruleSearch: 'assets/icons/rule-search.svg',
  ruleTap: 'assets/icons/rule-tap.svg',
  ruleTimer: 'assets/icons/rule-timer.svg',
};

/**
 * @typedef {Object} Settings
 * @property {'rules' | 'start'} restartTarget  "YENİDƏN OYNA" hara qaytarır
 * @property {number} durationMs                Oyun müddəti
 * @property {'up' | 'down'} timerDirection     00:00 → 02:00 və ya 02:00 → 00:00
 * @property {number} finishDelayMs             Oyun bitəndən RESULT-a qədər
 * @property {number} defaultHitRadiusU         Toxunma radiusu, ekranda dizayn px
 * @property {number} idleResetMs               Toxunuş olmasa rules-a qayıt (0 = söndür)
 */

/** @type {Settings} */
export const SETTINGS = {
  restartTarget: 'rules',
  durationMs: 120000,
  timerDirection: 'up',
  finishDelayMs: 500,
  defaultHitRadiusU: 45,
  idleResetMs: 60000,
};

/**
 * Google Sheets Apps Script Web App URL-i (`…/exec`), bax: tools/google-sheets/Code.gs.
 * Boşdursa nəticələr yalnız bu cihazda (localStorage) saxlanılır.
 */
export const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwqoQyyZhQJX5jHaQjIM6Cz8SYHEfrqmLxz8CxAAuwlqX4dzBEpmnvybO79vzVh3DPN/exec';

/** true → GAME ekranında dev paneli görünür. URL-də `?dev` də eyni effekti verir (bölmə 9.1). */
export const DEBUG = false;
