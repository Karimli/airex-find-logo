/**
 * Toxunuşun yoxlanması (bölmə 2.3): toxunma nöqtəsinə ən yaxın tapılmamış loqo. Saf funksiyalar, DOM-dan asılı deyil.
 * Angular-da: eyni funksiyalar (service-in içində və ya ayrıca util).
 * @module game/hitTest
 */

/**
 * Ekran nöqtəsini xəritənin viewBox koordinatlarına çevirir.
 * @param {{ x: number, y: number }} client  `clientX/clientY`
 * @param {{ left: number, top: number, width: number, height: number }} rect  Overlay-in `getBoundingClientRect()`
 * @param {{ width: number, height: number }} viewBox
 * @returns {{ x: number, y: number }}
 */
export function toViewBox(client, rect, viewBox) {
  return {
    x: ((client.x - rect.left) / rect.width) * viewBox.width,
    y: ((client.y - rect.top) / rect.height) * viewBox.height,
  };
}

/**
 * Hələ tapılmamış loqolar arasında nöqtəyə ən yaxınını qaytarır, əgər məsafə onun radiusundan kiçikdirsə.
 * Zonalar üst-üstə düşəndə yalnız ən yaxın loqo sayılır, bir toxunuş heç vaxt iki loqo tapmır.
 * @param {{ x: number, y: number }} point  viewBox koordinatı
 * @param {ReadonlyArray<{ id: string, x: number, y: number, hitRadius?: number }>} logos
 * @param {ReadonlySet<string>} found
 * @param {number} defaultRadius  viewBox vahidi; loqonun öz `hitRadius`-u yoxdursa
 * @returns {string | null}  Loqonun id-si
 */
export function findNearestLogo(point, logos, found, defaultRadius) {
  let bestId = null;
  let bestDistance = Infinity;
  for (const logo of logos) {
    if (found.has(logo.id)) continue;
    const distance = Math.hypot(point.x - logo.x, point.y - logo.y);
    if (distance < (logo.hitRadius ?? defaultRadius) && distance < bestDistance) {
      bestId = logo.id;
      bestDistance = distance;
    }
  }
  return bestId;
}
