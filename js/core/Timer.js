/**
 * Oyun taymeri (bölmə 2.4). Vaxt `performance.now()` ilə hesablanır, sayğac toplanmır.
 * Ekran `requestAnimationFrame` ilə yenilənir, `onTick` yalnız saniyə dəyişəndə çağırılır.
 * `durationMs`-ə çatanda dayanır (keçən vaxt dəqiq `durationMs` olur) və `onEnd` çağırılır.
 * Angular-da: `@Injectable` TimerService.
 * @module core/Timer
 */

/**
 * Millisaniyəni `mm:ss` formatına çevirir.
 * @param {number | null} ms  null → `--:--`
 * @returns {string}
 */
export function formatTime(ms) {
  if (ms == null) return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** @param {number} n */
const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Yerli tarix və saat: `dd.mm.yyyy - hh:mm:ss` (Google Sheets üçün).
 * @param {Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  const day = `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
  const clock = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  return `${day} - ${clock}`;
}

/**
 * @typedef {Object} TimerOptions
 * @property {number} [durationMs]  Bu vaxta çatanda taymer dayanır (default: limitsiz)
 * @property {() => void} [onEnd]   `durationMs`-ə çatanda bir dəfə çağırılır
 */

export class Timer {
  /** @type {(seconds: number) => void} */
  #onTick;
  #durationMs;
  /** @type {(() => void) | undefined} */
  #onEnd;
  /** @type {number | null} */
  #startedAt = null;
  #elapsedBeforeStop = 0;
  #rafId = 0;
  #lastSecond = -1;

  /**
   * @param {(seconds: number) => void} onTick  Tam saniyə dəyişəndə çağırılır (keçən saniyələr)
   * @param {TimerOptions} [options]
   */
  constructor(onTick, { durationMs = Infinity, onEnd } = {}) {
    this.#onTick = onTick;
    this.#durationMs = durationMs;
    this.#onEnd = onEnd;
  }

  /** Keçən vaxt (ms), `durationMs`-dən çox olmur. */
  get elapsedMs() {
    const elapsed = this.#startedAt == null ? this.#elapsedBeforeStop : performance.now() - this.#startedAt;
    return Math.min(elapsed, this.#durationMs);
  }

  get isRunning() {
    return this.#startedAt != null;
  }

  /** 0-dan başladır. */
  start() {
    this.reset();
    this.#startedAt = performance.now();
    this.#rafId = requestAnimationFrame(this.#frame);
  }

  /** Dayandırır, keçən vaxtı saxlayır. `onEnd` çağırılmır. */
  stop() {
    if (this.#startedAt == null) return;
    this.#elapsedBeforeStop = this.elapsedMs;
    this.#startedAt = null;
    cancelAnimationFrame(this.#rafId);
  }

  /** Vaxtı dərhal `durationMs`-ə çatdırır (dev: "Vaxtı bitir", bölmə 9.1). */
  finish() {
    if (this.#startedAt == null || !Number.isFinite(this.#durationMs)) return;
    this.#end();
  }

  /** Dayandırır və sıfırlayır. */
  reset() {
    cancelAnimationFrame(this.#rafId);
    this.#startedAt = null;
    this.#elapsedBeforeStop = 0;
    this.#lastSecond = -1;
    this.#emit(0);
  }

  destroy() {
    cancelAnimationFrame(this.#rafId);
    this.#startedAt = null;
  }

  #frame = () => {
    const elapsed = this.elapsedMs;
    if (elapsed >= this.#durationMs) {
      this.#end();
      return;
    }
    this.#emit(elapsed);
    this.#rafId = requestAnimationFrame(this.#frame);
  };

  #end() {
    cancelAnimationFrame(this.#rafId);
    this.#startedAt = null;
    this.#elapsedBeforeStop = this.#durationMs;
    this.#emit(this.#durationMs);
    this.#onEnd?.();
  }

  /** @param {number} ms */
  #emit(ms) {
    const second = Math.floor(ms / 1000);
    if (second === this.#lastSecond) return;
    this.#lastSecond = second;
    this.#onTick(second);
  }
}
