/**
 * Turning numeric columns (e.g. age) into readable groups.
 */

import type { Cell, SensitiveSpec } from './types';

/** Parse a cell as a number, or null if it is missing / not numeric. */
export function toNumber(cell: Cell): number | null {
  if (cell === null) return null;
  const s = cell.trim().replace(/\s/g, '');
  if (s === '') return null;
  // Accept a decimal comma ("3,5") when there is no dot.
  const normalised = /^-?\d+,\d+$/.test(s) ? s.replace(',', '.') : s;
  const v = Number(normalised);
  return Number.isFinite(v) ? v : null;
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

/**
 * Labels for the bins defined by sorted `edges`.
 * Integer columns: [25, 40] → "< 25", "25–39", "≥ 40".
 * Other columns:   [2.5]    → "< 2.5", "≥ 2.5".
 */
export function binLabels(edges: readonly number[], integer: boolean): string[] {
  const e = [...edges].sort((a, b) => a - b);
  if (e.length === 0) return ['all'];
  const labels = [`< ${fmt(e[0])}`];
  for (let i = 1; i < e.length; i++) {
    const lo = e[i - 1];
    const hi = e[i];
    if (integer && Number.isInteger(lo) && Number.isInteger(hi)) {
      labels.push(hi - 1 === lo ? fmt(lo) : `${fmt(lo)}–${fmt(hi - 1)}`);
    } else {
      labels.push(`${fmt(lo)} – < ${fmt(hi)}`);
    }
  }
  labels.push(`≥ ${fmt(e[e.length - 1])}`);
  return labels;
}

/** Index of the bin a value falls into (bins are [edge_i, edge_i+1)). */
export function binIndex(v: number, edges: readonly number[]): number {
  let i = 0;
  while (i < edges.length && v >= edges[i]) i++;
  return i;
}

/** Group label of a cell under a sensitive-attribute spec, or null if missing. */
export function groupOf(cell: Cell, spec: SensitiveSpec, labels?: string[]): string | null {
  if (cell === null) return null;
  if (!spec.binEdges) {
    const t = cell.trim();
    return t === '' ? null : t;
  }
  const v = toNumber(cell);
  if (v === null) return null;
  const edges = [...spec.binEdges].sort((a, b) => a - b);
  const l = labels ?? binLabels(edges, spec.integer ?? false);
  return l[binIndex(v, edges)];
}

/** Round to a "nice" number for bin edges (1, 2, 2.5, 5 × 10^k). */
export function niceRound(v: number): number {
  if (v === 0 || !Number.isFinite(v)) return 0;
  const sign = Math.sign(v);
  const a = Math.abs(v);
  const p = 10 ** Math.floor(Math.log10(a));
  const m = a / p;
  const nice = m < 1.5 ? 1 : m < 2.25 ? 2 : m < 3.5 ? 2.5 : m < 7.5 ? 5 : 10;
  return sign * nice * p;
}

/**
 * Suggest bin edges for a numeric column. Age-like columns get the common
 * bands < 25, 25–39, 40–59, ≥ 60; other columns get rounded tertiles.
 */
export function suggestBins(name: string, values: readonly number[]): number[] {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (/age|ηλικ/i.test(name) && min >= 0 && max <= 120) {
    return [25, 40, 60].filter((e) => e > min && e <= max);
  }
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const edges = [q(1 / 3), q(2 / 3)].map(niceRound);
  return [...new Set(edges)].filter((e) => e > min && e <= max).sort((a, b) => a - b);
}
