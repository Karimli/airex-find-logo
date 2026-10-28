/**
 * Dev paneli (bölmə 9.1): yalnız `DEBUG: true` və ya URL-də `?dev` olanda yaradılır, əks halda DOM-da yoxdur.
 *   HAMISINI TAP — qalan loqolar növbə ilə tapılır, oyun adi qaydada (`reason: 'all'`) bitir
 *   VAXTI BİTİR  — taymer 02:00-a çatır, oyun `reason: 'time'` ilə bitir
 *   ZONALAR      — toxunma zonaları və id-lər
 *   YER SEÇİCİ   — xəritəyə toxunuş loqo tapmır, nöqtənin koordinatını göstərir və kopyalayır
 *   REKORDU SİL  — ən yaxşı nəticəni silir (YENİ REKORD-u yoxlamaq üçün)
 * @module game/DevPanel
 */

import { copyText } from '../core/env.js';
import { onTap } from '../core/tap.js';

/**
 * @typedef {Object} DevPanelHandlers
 * @property {() => void} findAll
 * @property {() => void} timeUp
 * @property {(visible: boolean) => void} toggleZones
 * @property {(active: boolean) => void} togglePicker
 * @property {() => void} clearBest
 */

const BUTTONS = [
  { action: 'find-all', label: 'HAMISINI TAP' },
  { action: 'time-up', label: 'VAXTI BİTİR' },
  { action: 'zones', label: 'ZONALAR', toggle: true },
  { action: 'picker', label: 'YER SEÇİCİ', toggle: true },
  { action: 'clear-best', label: 'REKORDU SİL' },
];

export class DevPanel {
  /** @type {HTMLElement} */
  #container;
  /** @type {DevPanelHandlers} */
  #handlers;
  /** @type {HTMLElement | null} */
  #el = null;
  /** @type {HTMLInputElement | null} */
  #output = null;
  /** @type {(() => void) | null} */
  #unbindTap = null;
  /** @type {Set<string>} */
  #active = new Set();

  /**
   * @param {HTMLElement} container  GAME ekranı
   * @param {DevPanelHandlers} handlers
   */
  constructor(container, handlers) {
    this.#container = container;
    this.#handlers = handlers;
  }

  mount() {
    const doc = this.#container.ownerDocument;
    const el = doc.createElement('div');
    el.className = 'cp-dev';

    for (const { action, label } of BUTTONS) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'cp-dev__button';
      button.dataset.dev = action;
      button.textContent = label;
      el.append(button);
    }

    const output = doc.createElement('input');
    output.className = 'cp-dev__output';
    output.readOnly = true;
    output.placeholder = 'x: –, y: –';
    el.append(output);

    this.#unbindTap = onTap(el, '[data-dev]', (target) => this.#handle(target));
    this.#container.append(el);
    this.#el = el;
    this.#output = output;
  }

  /**
   * Yer seçicisinin nöqtəsini göstərir və buferə kopyalayır.
   * @param {{ x: number, y: number }} point
   */
  async showPoint({ x, y }) {
    const text = `x: ${x}, y: ${y}`;
    if (!this.#output) return;
    this.#output.value = text;
    const copied = await copyText(text);
    if (this.#output) this.#output.value = copied ? `${text}   ✓ kopyalandı` : text;
    if (!copied) this.#output.select();
  }

  destroy() {
    this.#unbindTap?.();
    this.#unbindTap = null;
    this.#el?.remove();
    this.#el = this.#output = null;
  }

  /** @param {Element} button */
  #handle(button) {
    const action = button.getAttribute('data-dev') ?? '';
    const isToggle = BUTTONS.find((b) => b.action === action)?.toggle;
    let active = false;
    if (isToggle) {
      active = !this.#active.has(action);
      if (active) this.#active.add(action);
      else this.#active.delete(action);
      button.classList.toggle('is-active', active);
    }

    switch (action) {
      case 'find-all': this.#handlers.findAll(); break;
      case 'time-up': this.#handlers.timeUp(); break;
      case 'zones': this.#handlers.toggleZones(active); break;
      case 'picker':
        this.#handlers.togglePicker(active);
        if (!active && this.#output) this.#output.value = '';
        break;
      case 'clear-best':
        this.#handlers.clearBest();
        if (this.#output) this.#output.value = 'Rekord silindi';
        break;
    }
  }
}
