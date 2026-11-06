/**
 * Képkivágás matematikája (tiszta függvények, nincs benne DOM).
 *
 * Fogalmak (mind a FORRÁSKÉP pixeleiben):
 *   - a "kivágás" egy téglalap, aminek az aránya mindig a kiválasztott képarány
 *   - zoom = 1 → a legnagyobb ilyen téglalap, ami még elfér a képben
 *   - zoom > 1 → ennek 1/zoom-szorosa (közelebbi kivágás)
 *   - cx, cy → a kivágás KÖZÉPPONTJA a képen
 */

export interface Ratio {
  label: string;
  value: number; // szélesség / magasság
}

export const RATIOS: Ratio[] = [
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
];

export interface Size {
  w: number;
  h: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** A zoom = 1-hez tartozó kivágás mérete. */
export function baseCrop(imgW: number, imgH: number, a: number): Size {
  return imgW / imgH >= a ? { w: imgH * a, h: imgH } : { w: imgW, h: imgW / a };
}

/** A kivágás mérete adott nagyításnál. */
export function cropSize(imgW: number, imgH: number, a: number, zoom: number): Size {
  const b = baseCrop(imgW, imgH, a);
  return { w: b.w / zoom, h: b.h / zoom };
}

/** A középpontot a képen belül tartja (a kivágás ne lógjon ki). */
export function clampCenter(
  imgW: number,
  imgH: number,
  a: number,
  zoom: number,
  cx: number,
  cy: number,
): { cx: number; cy: number } {
  const { w, h } = cropSize(imgW, imgH, a, zoom);
  return { cx: clamp(cx, w / 2, imgW - w / 2), cy: clamp(cy, h / 2, imgH - h / 2) };
}

/** A kép mekkora része marad meg zoom = 1-nél (1 = semmi nem vágódik le). */
export function keptFraction(imgW: number, imgH: number, a: number): number {
  const r = imgW / imgH;
  return r >= a ? a / r : r / a;
}

/** Az a képarány, amelyiknél a legkevesebb vágódik le a képből. */
export function bestRatio(imgW: number, imgH: number): Ratio {
  return RATIOS.reduce((best, r) =>
    keptFraction(imgW, imgH, r.value) > keptFraction(imgW, imgH, best.value) ? r : best,
  );
}

/** A feltöltött kép mérete: a kivágás natív felbontása, de legfeljebb maxW széles. */
export function outputSize(cropW: number, a: number, maxW: number): Size {
  const w = Math.min(Math.round(cropW), maxW);
  return { w, h: Math.round(w / a) };
}
