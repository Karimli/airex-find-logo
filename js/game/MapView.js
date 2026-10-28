/**
 * Xəritə + loqoların SVG overlay-i (bölmə 2.3, 4, 5.3).
 *
 * Quruluş:
 *   .cp-map
 *     img.cp-map__image                    təmiz xəritə (loqosuz)
 *     svg.cp-map__overlay  viewBox = şəklin orijinal ölçüsü, preserveAspectRatio="none"
 *       defs > symbol#cp-mark              loqo SVG-si bir dəfə
 *       g[transform]  > use.cp-logo        hər loqo: mövqe/perspektiv <g>-də, rəng və pop <use>-da
 *
 * Overlay şəkillə eyni ölçüdədir, ona görə istənilən konteynerdə loqolar yerində qalır (ResizeObserver lazım deyil).
 * Toxunuş: overlay-də bir `pointerup` listener, hədəf `findNearestLogo` ilə tapılır.
 * Angular-da: standalone component.
 * @module game/MapView
 */

import { playFound } from './animations.js';
import { findNearestLogo, toViewBox } from './hitTest.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MARK_ID = 'cp-mark';
/** Oyun xəritəsinin dizayndakı eni (px): `defaultHitRadiusU` bu enə nisbətən viewBox-a çevrilir */
const MAP_DESIGN_WIDTH = 952;

/**
 * @typedef {Object} MapViewOptions
 * @property {{ width: number, height: number }} imageSize  viewBox
 * @property {string} markMarkup                            Loqo SVG-sinin mətni
 * @property {import('../maps/baku/logos.js').LogoSpot[]} logos
 * @property {number} defaultHitRadiusU                     Toxunma radiusu, dizayn px (ekranda)
 * @property {boolean} reducedMotion
 * @property {(logoId: string) => void} onLogoTap           Tapılmamış loqoya toxunuldu
 */

/**
 * Loqonun `<g>` transform atributu: mövqe + istəyə bağlı perspektiv.
 * @param {import('../maps/baku/logos.js').LogoSpot} logo
 * @returns {string}
 */
export function logoTransform({ x, y, rotate, skewY, scaleY }) {
  let transform = `translate(${x} ${y})`;
  if (rotate) transform += ` rotate(${rotate})`;
  if (skewY) transform += ` skewY(${skewY})`;
  if (scaleY) transform += ` scale(1 ${scaleY})`;
  return transform;
}

export class MapView {
  /** @type {HTMLElement} */
  #container;
  /** @type {MapViewOptions} */
  #options;
  #hitRadius;

  /** @type {SVGSVGElement | null} */
  #overlay = null;
  /** @type {Map<string, SVGUseElement>} */
  #logoEls = new Map();
  /** @type {Set<string>} */
  #found = new Set();
  /** @type {Set<Animation>} */
  #animations = new Set();
  #locked = false;

  /** Dev (bölmə 9.1): toxunma zonaları qatı və yer seçicisi */
  /** @type {SVGGElement | null} */
  #zones = null;
  /** @type {SVGCircleElement | null} */
  #pickMarker = null;
  /** @type {((point: { x: number, y: number }) => void) | null} */
  #onPick = null;

  /**
   * @param {HTMLElement} container  `.cp-map` (içində `img.cp-map__image`)
   * @param {MapViewOptions} options
   */
  constructor(container, options) {
    this.#container = container;
    this.#options = options;
    this.#hitRadius = (options.defaultHitRadiusU * options.imageSize.width) / MAP_DESIGN_WIDTH;
  }

  /** viewBox vahidində default toxunma radiusu (dev "Zonaları göstər" üçün də) */
  get hitRadius() {
    return this.#hitRadius;
  }

  /** @returns {SVGSVGElement | null} */
  get overlay() {
    return this.#overlay;
  }

  mount() {
    const doc = this.#container.ownerDocument;
    const { width, height } = this.#options.imageSize;

    const overlay = /** @type {SVGSVGElement} */ (doc.createElementNS(SVG_NS, 'svg'));
    overlay.classList.add('cp-map__overlay');
    overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
    overlay.setAttribute('preserveAspectRatio', 'none');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = markToSymbol(this.#options.markMarkup); // öz assetimiz (bölmə 9)

    for (const logo of this.#options.logos) {
      const group = doc.createElementNS(SVG_NS, 'g');
      group.setAttribute('transform', logoTransform(logo));

      const use = /** @type {SVGUseElement} */ (doc.createElementNS(SVG_NS, 'use'));
      use.setAttribute('href', `#${MARK_ID}`);
      use.classList.add('cp-logo');
      use.dataset.id = logo.id;
      use.setAttribute('x', String(-logo.size / 2));
      use.setAttribute('y', String(-logo.size / 2));
      use.setAttribute('width', String(logo.size));
      use.setAttribute('height', String(logo.size));

      group.append(use);
      overlay.append(group);
      this.#logoEls.set(logo.id, use);
    }

    overlay.addEventListener('pointerup', this.#onPointerUp);
    this.#container.append(overlay);
    this.#overlay = overlay;
  }

  /**
   * Loqonu tapılmış göstərir: `.is-found` (lime) + pop.
   * @param {string} logoId
   * @returns {Animation | null}  Pop animasiyası (reducedMotion-da null)
   */
  markFound(logoId) {
    const el = this.#logoEls.get(logoId);
    if (!el || this.#found.has(logoId)) return null;
    this.#found.add(logoId);
    el.classList.add('is-found');

    const animation = playFound(el, { reducedMotion: this.#options.reducedMotion });
    if (animation) {
      this.#animations.add(animation);
      animation.finished.catch(() => {}).finally(() => this.#animations.delete(animation));
    }
    return animation;
  }

  /** Oyun bitdi: toxunuşlar qəbul olunmur. */
  lock() {
    this.#locked = true;
    this.#container.classList.add('is-finished');
  }

  /** Yeni oyun: bütün loqolar gizli, animasiyalar dayanır, xəritə açıqdır. */
  reset() {
    this.#cancelAnimations();
    for (const el of this.#logoEls.values()) el.classList.remove('is-found');
    this.#found.clear();
    this.#locked = false;
    this.#container.classList.remove('is-finished');
  }

  /**
   * Dev: hər loqonun toxunma zonasını və id-sini göstərir, gizli loqoları daha görünən edir.
   * @param {boolean} visible
   */
  showZones(visible) {
    if (!this.#overlay) return;
    if (visible && !this.#zones) this.#zones = this.#buildZones();
    if (visible && this.#zones) this.#overlay.append(this.#zones);
    else this.#zones?.remove();
    this.#container.classList.toggle('is-dev-zones', visible);
  }

  /**
   * Dev yer seçicisi: aktiv olanda toxunuş loqo tapmır, nöqtənin viewBox koordinatı `onPick`-ə verilir.
   * @param {((point: { x: number, y: number }) => void) | null} onPick  null → söndür
   */
  setPickMode(onPick) {
    this.#onPick = onPick;
    if (!onPick) this.#pickMarker?.remove();
  }

  destroy() {
    this.#zones?.remove();
    this.#pickMarker?.remove();
    this.#zones = this.#pickMarker = null;
    this.#onPick = null;
    this.#cancelAnimations();
    this.#overlay?.removeEventListener('pointerup', this.#onPointerUp);
    this.#overlay?.remove();
    this.#overlay = null;
    this.#logoEls.clear();
    this.#found.clear();
  }

  /**
   * Ekran nöqtəsini viewBox koordinatına çevirir (dev yer seçicisi üçün də).
   * @param {number} clientX
   * @param {number} clientY
   * @returns {{ x: number, y: number } | null}
   */
  toMapPoint(clientX, clientY) {
    if (!this.#overlay) return null;
    return toViewBox({ x: clientX, y: clientY }, this.#overlay.getBoundingClientRect(), this.#options.imageSize);
  }

  /** Hələ tapılmamış qalan loqoların id-ləri (dev "Hamısını tap" üçün) */
  get remainingIds() {
    return this.#options.logos.map((logo) => logo.id).filter((id) => !this.#found.has(id));
  }

  /** @param {PointerEvent} event */
  #onPointerUp = (event) => {
    const point = this.toMapPoint(event.clientX, event.clientY);
    if (!point) return;
    if (this.#onPick) {
      const rounded = { x: Math.round(point.x), y: Math.round(point.y) };
      this.#markPick(rounded);
      this.#onPick(rounded);
      return;
    }
    if (this.#locked) return;
    const logoId = findNearestLogo(point, this.#options.logos, this.#found, this.#hitRadius);
    if (logoId) this.#options.onLogoTap(logoId);
  };

  /** @returns {SVGGElement} */
  #buildZones() {
    const doc = this.#container.ownerDocument;
    const group = /** @type {SVGGElement} */ (doc.createElementNS(SVG_NS, 'g'));
    group.classList.add('cp-map__zones');
    for (const logo of this.#options.logos) {
      const circle = doc.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(logo.x));
      circle.setAttribute('cy', String(logo.y));
      circle.setAttribute('r', String(logo.hitRadius ?? this.#hitRadius));
      const label = doc.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', String(logo.x));
      label.setAttribute('y', String(logo.y - logo.size / 2 - 4));
      label.textContent = logo.id;
      group.append(circle, label);
    }
    return group;
  }

  /** @param {{ x: number, y: number }} point */
  #markPick({ x, y }) {
    if (!this.#overlay) return;
    if (!this.#pickMarker) {
      this.#pickMarker = /** @type {SVGCircleElement} */ (this.#container.ownerDocument.createElementNS(SVG_NS, 'circle'));
      this.#pickMarker.classList.add('cp-map__pick');
      this.#pickMarker.setAttribute('r', '6');
    }
    this.#pickMarker.setAttribute('cx', String(x));
    this.#pickMarker.setAttribute('cy', String(y));
    this.#overlay.append(this.#pickMarker);
  }

  #cancelAnimations() {
    for (const animation of this.#animations) animation.cancel();
    this.#animations.clear();
  }
}

/**
 * `<svg viewBox="…">…</svg>` → `<defs><symbol id="cp-mark" viewBox="…">…</symbol></defs>`
 * @param {string} markup  Öz SVG assetimiz
 * @returns {string}
 */
function markToSymbol(markup) {
  const viewBox = /viewBox="([^"]+)"/.exec(markup)?.[1] ?? '0 0 20 20';
  const inner = markup.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<defs><symbol id="${MARK_ID}" viewBox="${viewBox}">${inner}</symbol></defs>`;
}
