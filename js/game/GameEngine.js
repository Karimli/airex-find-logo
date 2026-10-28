/**
 * Oyun məntiqi (bölmə 2, 8.1): tapılmış loqolar, xal, bitmə. DOM-a toxunmur, event yayır.
 * Angular-da: `@Injectable` GameService.
 * @module game/GameEngine
 */

import { Emitter } from '../core/Emitter.js';

/**
 * @typedef {Object} CompletedPayload
 * @property {number} score
 * @property {number} total
 * @property {number} timeMs              Oyunun müddəti; vaxt bitəndə dəqiq `durationMs`
 * @property {'time' | 'all'} reason
 */

/**
 * @typedef {Object} GameEvents
 * @property {{ id: string, score: number, total: number }} found
 * @property {CompletedPayload} completed
 */

/** @extends {Emitter<GameEvents>} */
export class GameEngine extends Emitter {
  /** @type {Set<string>} */
  #ids;
  #durationMs;
  /** @type {() => number} */
  #now;
  /** @type {Set<string>} */
  #found = new Set();
  #startedAt = 0;
  #finished = true;

  /**
   * @param {{ logos: ReadonlyArray<{ id: string }>, durationMs: number, now?: () => number }} opts
   *   now — zaman mənbəyi (testdə əvəz etmək üçün), default `performance.now`
   */
  constructor({ logos, durationMs, now = () => performance.now() }) {
    super();
    this.#ids = new Set(logos.map((logo) => logo.id));
    this.#durationMs = durationMs;
    this.#now = now;
  }

  get score() {
    return this.#found.size;
  }

  get total() {
    return this.#ids.size;
  }

  get isFinished() {
    return this.#finished;
  }

  /** @param {string} logoId */
  isFound(logoId) {
    return this.#found.has(logoId);
  }

  /** Yeni oyun: state tam sıfırlanır. */
  start() {
    this.#found.clear();
    this.#startedAt = this.#now();
    this.#finished = false;
  }

  /**
   * Loqonu tapılmış edir. Bitmiş oyunda, naməlum və ya artıq tapılmış loqoda heç nə etmir.
   * @param {string} logoId
   * @returns {boolean}  Yeni tapıldımı
   */
  find(logoId) {
    if (this.#finished || !this.#ids.has(logoId) || this.#found.has(logoId)) return false;
    this.#found.add(logoId);
    this.emit('found', { id: logoId, score: this.score, total: this.total });
    if (this.score === this.total) {
      this.#complete('all', Math.min(this.#now() - this.#startedAt, this.#durationMs));
    }
    return true;
  }

  /** Vaxt bitdi (taymerdən). */
  timeUp() {
    if (this.#finished) return;
    this.#complete('time', this.#durationMs);
  }

  /** Oyunu dayandırır (məs. idle reset / restart); `completed` yayılmır. */
  reset() {
    this.#found.clear();
    this.#finished = true;
  }

  destroy() {
    this.reset();
    this.clear();
  }

  /**
   * @param {'time' | 'all'} reason
   * @param {number} timeMs
   */
  #complete(reason, timeMs) {
    this.#finished = true;
    this.emit('completed', { score: this.score, total: this.total, timeMs: Math.round(timeMs), reason });
  }
}
