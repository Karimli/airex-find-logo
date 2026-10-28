/**
 * Taymer və sayğacın DOM-a yazılması (bölmə 2.2, 2.4). Yalnız dəyər dəyişəndə yazır.
 * Angular-da: GAME component-in şablonu (`{{ time }}`, `{{ count }}`).
 * @module game/HudView
 */

import { formatTime } from '../core/Timer.js';

/**
 * `07/30` — sayğac həmişə 2 rəqəmlə.
 * @param {number} score
 * @param {number} total
 * @returns {string}
 */
export function formatCount(score, total) {
  return `${String(score).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
}

export class HudView {
  /** @type {HTMLElement} */
  root;
  #total;
  #durationMs;
  #direction;
  /** @type {Element | null} */
  #timeEl = null;
  /** @type {Element | null} */
  #countEl = null;

  /**
   * @param {HTMLElement} root  GAME ekranı (içində `[data-time]`, `[data-count]`)
   * @param {{ total: number, durationMs: number, direction: 'up' | 'down' }} options
   */
  constructor(root, { total, durationMs, direction }) {
    this.root = root;
    this.#total = total;
    this.#durationMs = durationMs;
    this.#direction = direction;
  }

  mount() {
    this.#timeEl = this.root.querySelector('[data-time]');
    this.#countEl = this.root.querySelector('[data-count]');
    this.reset();
  }

  /** @param {number} elapsedSeconds  Timer-in `onTick` dəyəri */
  setTime(elapsedSeconds) {
    const elapsedMs = Math.min(elapsedSeconds * 1000, this.#durationMs);
    const shownMs = this.#direction === 'down' ? this.#durationMs - elapsedMs : elapsedMs;
    this.#write(this.#timeEl, formatTime(shownMs));
  }

  /** @param {number} score */
  setScore(score) {
    this.#write(this.#countEl, formatCount(score, this.#total));
  }

  reset() {
    this.setTime(0);
    this.setScore(0);
  }

  destroy() {
    this.#timeEl = this.#countEl = null;
  }

  /**
   * @param {Element | null} el
   * @param {string} text
   */
  #write(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }
}
