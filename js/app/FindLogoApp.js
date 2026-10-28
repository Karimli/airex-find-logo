/**
 * State machine: ekranlar arası keçid (bölmə 1) və oyun hissələrinin birləşdirilməsi.
 *
 *   rules ──[DAVAM ET]──▶ start ──[BAŞLA]──▶ game ──[02:00 və ya 30/30]──▶ result ──[YENİDƏN OYNA]──▶ rules | start
 *
 * Angular-da: parent component + `signal` state.
 * @module app/FindLogoApp
 */

import { preloadAll } from '../core/assets.js';
import { prefersReducedMotion } from '../core/env.js';
import { clearBest, getBest, isBetter, setBest } from '../core/storage.js';
import { onTap } from '../core/tap.js';
import { Timer } from '../core/Timer.js';
import { GameEngine } from '../game/GameEngine.js';
import { HudView, formatCount } from '../game/HudView.js';
import { MapView } from '../game/MapView.js';
import { DevPanel } from '../game/DevPanel.js';

/** Dev "HAMISINI TAP": loqolar arası interval */
const DEV_FIND_STEP_MS = 60;

/** @typedef {'rules' | 'start' | 'game' | 'result'} ScreenState */

/**
 * @typedef {Object} FindLogoAppOptions
 * @property {import('../config.js').MapConfig} map
 * @property {import('../config.js').Settings} settings
 * @property {Record<string, string>} uiAssets  `data-svg` açarı → SVG yolu
 * @property {boolean} devMode  true → GAME ekranına dev paneli əlavə olunur (bölmə 9.1)
 * @property {(state: ScreenState) => void} [onScreenChange]  Ekran dəyişəndə (məs. yeniləməni rules-da tətbiq etmək üçün)
 */

export class FindLogoApp {
  /** @type {HTMLElement} */
  root;
  /** @type {FindLogoAppOptions} */
  options;
  /** @type {ScreenState | null} */
  state = null;

  /** @type {Map<ScreenState, HTMLElement>} */
  #screens = new Map();
  /** @type {Array<() => void>} */
  #unbinders = [];

  /** @type {GameEngine | null} */
  #engine = null;
  /** @type {HudView | null} */
  #hud = null;
  /** @type {MapView | null} */
  #map = null;
  /** @type {Timer | null} */
  #timer = null;
  /** @type {DevPanel | null} */
  #dev = null;
  /** @type {ReturnType<typeof setInterval> | undefined} */
  #devFindInterval;

  /** Son tapılmış loqonun pop animasiyası: 30/30-da RESULT ondan sonra açılır (bölmə 7.1) */
  /** @type {Animation | null} */
  #lastFoundAnimation = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #resultTimeout;
  /** Hərəkətsizlik taymeri: `idleResetMs` ərzində toxunuş olmasa rules ekranına qayıdılır */
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #idleTimeout;
  /** Hər yeni oyunda artır: köhnə oyunun gecikmiş callback-ləri işləmir */
  #gameId = 0;

  /**
   * Konstruktorda side-effect yoxdur, başlatma `mount()` ilə edilir.
   * @param {HTMLElement} root
   * @param {FindLogoAppOptions} options
   */
  constructor(root, options) {
    this.root = root;
    this.options = options;
  }

  /**
   * Ekranları tapır, listener-ləri qoşur, assetləri preload edir, ilk ekranı göstərir.
   * Preload bitənə qədər kök elementdə `.is-loading` qalır.
   * @returns {Promise<void>}
   */
  async mount() {
    for (const el of this.root.querySelectorAll('[data-screen]')) {
      this.#screens.set(/** @type {ScreenState} */ (el.getAttribute('data-screen')), /** @type {HTMLElement} */ (el));
    }

    this.#unbinders.push(onTap(this.root, '[data-action]', (target) => {
      this.#handleAction(target.getAttribute('data-action') ?? '');
    }));
    this.root.addEventListener('contextmenu', this.#onContextMenu);
    this.root.addEventListener('pointerdown', this.#onActivity, { capture: true });

    const svgs = await this.#loadAssets();
    this.#mountGame(svgs);
    if (this.options.devMode) this.#mountDevPanel();
    this.#renderBest();
    this.show('rules');
    this.root.classList.remove('is-loading');
  }

  /**
   * Aktiv ekranı dəyişir (animasiyasız).
   * @param {ScreenState} next
   */
  show(next) {
    if (next === this.state) return;
    for (const [name, el] of this.#screens) {
      el.classList.toggle('is-active', name === next);
    }
    this.state = next;
    this.#armIdle();
    this.options.onScreenChange?.(next);
  }

  /** Listener-ləri, taymerləri dayandırır; oyun hissələrini təmizləyir. */
  destroy() {
    clearTimeout(this.#resultTimeout);
    clearTimeout(this.#idleTimeout);
    clearInterval(this.#devFindInterval);
    this.#dev?.destroy();
    this.#dev = null;
    for (const unbind of this.#unbinders) unbind();
    this.#unbinders = [];
    this.root.removeEventListener('contextmenu', this.#onContextMenu);
    this.root.removeEventListener('pointerdown', this.#onActivity, { capture: true });

    this.#engine?.destroy();
    this.#hud?.destroy();
    this.#map?.destroy();
    this.#timer?.destroy();
    this.#engine = this.#hud = this.#map = this.#timer = null;

    this.#screens.clear();
    this.state = null;
  }

  // ---------------------------------------------------------------- assets + quraşdırma

  /**
   * UI SVG-lərini və xəritə şəklini yükləyir; SVG-ləri `[data-svg]` yerlərinə qoyur.
   * @returns {Promise<Map<string, string>>}  url → SVG mətni
   */
  async #loadAssets() {
    const { map, uiAssets } = this.options;
    const { svgs } = await preloadAll({
      svgs: [...Object.values(uiAssets), map.mark],
      images: [map.image],
    });

    for (const el of this.root.querySelectorAll('[data-svg]')) {
      const url = uiAssets[/** @type {HTMLElement} */ (el).dataset.svg ?? ''];
      const markup = url && svgs.get(url);
      if (markup) el.innerHTML = markup; // yalnız öz assetlərimiz (bölmə 9)
    }
    for (const img of this.root.querySelectorAll('[data-map-image]')) {
      /** @type {HTMLImageElement} */ (img).src = map.image;
    }
    return svgs;
  }

  /** @param {Map<string, string>} svgs */
  #mountGame(svgs) {
    const { map, settings } = this.options;
    const gameScreen = /** @type {HTMLElement} */ (this.#screens.get('game'));
    const mapEl = /** @type {HTMLElement} */ (gameScreen.querySelector('[data-map]'));

    this.#engine = new GameEngine({ logos: map.logos, durationMs: settings.durationMs });
    this.#hud = new HudView(gameScreen, {
      total: this.#engine.total,
      durationMs: settings.durationMs,
      direction: settings.timerDirection,
    });
    this.#timer = new Timer((seconds) => this.#hud?.setTime(seconds), {
      durationMs: settings.durationMs,
      onEnd: () => this.#engine?.timeUp(),
    });

    this.#map = new MapView(mapEl, {
      imageSize: map.imageSize,
      markMarkup: svgs.get(map.mark) ?? '',
      logos: map.logos,
      defaultHitRadiusU: settings.defaultHitRadiusU,
      reducedMotion: prefersReducedMotion(),
      onLogoTap: (logoId) => this.#engine?.find(logoId),
    });

    this.#hud.mount();
    this.#map.mount();

    this.#unbinders.push(
      this.#engine.on('found', ({ id, score }) => {
        this.#lastFoundAnimation = this.#map?.markFound(id) ?? null;
        this.#hud?.setScore(score);
      }),
      this.#engine.on('completed', (result) => this.#onCompleted(result)),
    );
  }

  // ---------------------------------------------------------------- oyun axını

  /**
   * `data-action` → keçid.
   * @param {string} action
   */
  #handleAction(action) {
    switch (action) {
      case 'continue':
        this.#renderBest();
        this.show('start');
        break;
      case 'start':
        this.#startGame();
        break;
      case 'restart':
        this.#resetGame();
        this.show(this.options.settings.restartTarget);
        break;
    }
  }

  #startGame() {
    this.#resetGame();
    this.show('game');
    this.#engine?.start();
    this.#timer?.start();
  }

  /** Taymer, tapılmış loqolar, sayğac, gözləyən keçid — hamısı sıfırlanır (bölmə 1). */
  #resetGame() {
    clearTimeout(this.#resultTimeout);
    clearInterval(this.#devFindInterval);
    this.#gameId++;
    this.#lastFoundAnimation = null;
    this.root.querySelector('[data-record]')?.classList.remove('is-active');
    this.#engine?.reset();
    this.#timer?.reset();
    this.#hud?.reset();
    this.#map?.reset();
  }

  /**
   * Oyun bitdi (vaxt və ya 30/30): taymer dayanır, xəritə bloklanır, `finishDelayMs` sonra RESULT açılır (bölmə 2.4).
   * 30/30-da gecikmə son loqonun pop animasiyası bitəndən sonra başlayır.
   * @param {import('../game/GameEngine.js').CompletedPayload} result
   */
  async #onCompleted({ score, total, timeMs, reason }) {
    this.#timer?.stop();
    this.#map?.lock();
    clearInterval(this.#devFindInterval);
    const gameId = this.#gameId;

    // Rekord (bölmə 2.5): daha çox loqo, bərabərdə daha az vaxt. 0/30 heç vaxt rekord deyil
    const mapId = this.options.map.id;
    const result = { score, timeMs, date: new Date().toISOString() };
    const previous = getBest(mapId);
    const isRecord = score > 0 && (previous == null || isBetter(result, previous));
    if (isRecord) setBest(mapId, result);

    if (reason === 'all' && this.#lastFoundAnimation) {
      await this.#lastFoundAnimation.finished.catch(() => {}); // reset zamanı cancel olunursa da davam edir
      if (gameId !== this.#gameId) return;
    }
    this.#resultTimeout = setTimeout(() => {
      if (gameId !== this.#gameId) return;
      const scoreEl = this.root.querySelector('[data-result-score]');
      if (scoreEl) scoreEl.textContent = formatCount(score, total);
      this.root.querySelector('[data-record]')?.classList.toggle('is-active', isRecord);
      this.#renderBest(isRecord ? result : previous);
      this.show('result');
    }, this.options.settings.finishDelayMs);
  }

  /**
   * "ƏN YAXŞI NƏTİCƏ" (start və result): yalnız loqo sayı, rekord yoxdursa `--/30`.
   * @param {{ score: number } | null} [best]
   */
  #renderBest(best = getBest(this.options.map.id)) {
    const total = this.#engine?.total ?? this.options.map.logos.length;
    const text = best ? formatCount(best.score, total) : `--/${String(total).padStart(2, '0')}`;
    for (const el of this.root.querySelectorAll('[data-best]')) el.textContent = text;
  }

  // ---------------------------------------------------------------- dev (bölmə 9.1)

  #mountDevPanel() {
    const gameScreen = /** @type {HTMLElement} */ (this.#screens.get('game'));
    this.#dev = new DevPanel(gameScreen, {
      findAll: () => {
        if (this.state !== 'game' || this.#engine?.isFinished) return;
        clearInterval(this.#devFindInterval);
        // Real axın: hər loqo növbə ilə tapılır, oyun `reason: 'all'` ilə bitir
        this.#devFindInterval = setInterval(() => {
          const next = this.#map?.remainingIds[0];
          if (!next || this.#engine?.isFinished) clearInterval(this.#devFindInterval);
          else this.#engine?.find(next);
        }, DEV_FIND_STEP_MS);
      },
      timeUp: () => this.#timer?.finish(),
      toggleZones: (visible) => this.#map?.showZones(visible),
      togglePicker: (active) => this.#map?.setPickMode(active ? (point) => this.#dev?.showPoint(point) : null),
      clearBest: () => {
        clearBest(this.options.map.id);
        this.#renderBest();
      },
    });
    this.#dev.mount();
  }

  /**
   * Hərəkətsizlik taymerini yenidən başladır. Rules ekranında (artıq başlanğıcdadır) və GAME-də
   * (oyun özü `durationMs`-də bitir, bölmə 2.6) işləmir.
   */
  #armIdle() {
    clearTimeout(this.#idleTimeout);
    const { idleResetMs } = this.options.settings;
    if (!idleResetMs || this.state === 'rules' || this.state === 'game' || this.state == null) return;
    this.#idleTimeout = setTimeout(() => {
      this.#resetGame();
      this.show('rules');
    }, idleResetMs);
  }

  #onActivity = () => {
    this.#armIdle();
  };

  /** @param {Event} event */
  #onContextMenu = (event) => {
    event.preventDefault();
  };
}
