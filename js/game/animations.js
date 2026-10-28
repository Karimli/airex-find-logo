/**
 * Oyundakı yeganə animasiya (bölmə 7): tapılmış loqonun "pop"-u, kitabxanasız (Web Animations API).
 * Funksiya elementi parametr kimi alır, DOM-da axtarmır.
 * Angular-da: eyni funksiya, element `viewChild` ilə ötürülür.
 * @module game/animations
 */

/**
 * Loqo qısa müddət böyüyüb geri qayıdır. Mövqe valideyn `<g>`-nin transform atributundadır,
 * ona görə animasiya onu pozmur (CSS: `transform-box: fill-box; transform-origin: center`).
 * @param {SVGElement} el  tapılmış loqonun `<use>` elementi
 * @param {{ reducedMotion?: boolean }} [options]
 * @returns {Animation | null}  reducedMotion-da null (yalnız rəng dəyişir)
 */
export function playFound(el, { reducedMotion = false } = {}) {
  if (reducedMotion) return null;
  return el.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.6)', offset: 0.4 },
      { transform: 'scale(1)' },
    ],
    { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
}
