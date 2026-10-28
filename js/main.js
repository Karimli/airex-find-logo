/**
 * Bootstrap: konfiqi yükləyir, FindLogoApp yaradır və mount edir.
 * @module main
 */

import { MAP_BAKU, SETTINGS, UI_ASSETS, DEBUG, EXPECTED_LOGO_COUNT } from './config.js';
import { FindLogoApp } from './app/FindLogoApp.js';
import { findRoot, hasUrlFlag, reloadPage } from './core/env.js';
import { registerServiceWorker } from './core/sw-register.js';

const root = findRoot('[data-cp-root]');

if (root) {
  const devMode = DEBUG || hasUrlFlag('dev');
  if (devMode && MAP_BAKU.logos.length !== EXPECTED_LOGO_COUNT) {
    console.error(`[FindLogo] Konfiqdə ${MAP_BAKU.logos.length} loqo var, ${EXPECTED_LOGO_COUNT} olmalıdır`);
  }

  // Yeni versiya hazır olanda səhifə yalnız rules ekranında yenilənir — oyunun ortasında heç vaxt
  let updateReady = false;
  /** @param {string | null} state */
  const applyUpdateIfIdle = (state) => {
    if (updateReady && state === 'rules') reloadPage();
  };

  const app = new FindLogoApp(root, {
    map: MAP_BAKU,
    settings: SETTINGS,
    uiAssets: UI_ASSETS,
    devMode,
    onScreenChange: applyUpdateIfIdle,
  });
  app.mount().catch((error) => console.error('[FindLogo] Assetlər yüklənmədi:', error));

  registerServiceWorker({
    url: './sw.js',
    onUpdateReady: () => {
      updateReady = true;
      applyUpdateIfIdle(app.state);
    },
  });
}
