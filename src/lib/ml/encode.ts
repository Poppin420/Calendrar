/**
 * Turns table columns into a numeric design matrix for logistic regression:
 * numeric columns are standardised (missing → mean, plus a missing flag),
 * categorical columns are one-hot encoded (rare categories pooled as "other").
 * It also produces an integer code per row and feature (numeric columns cut
 * into quintiles) for the association measures.
 */

import { toNumber } from '../binning';
import type { Cell, ColumnProfile, Dataset } from '../types';
import type { Matrix } from './logistic';

export const MAX_CATEGORIES = 15;
export const MAX_CARDINALITY = 100;

export interface EncodedFeature {
  name: string;
  kind: 'numeric' | 'categorical';
  /** Columns of the design matrix that belong to this feature. */
  columns: number[];
  /** Integer code per kept row (category or quintile), for association. */
  codes: Int32Array;
}

export interface Encoding {
  X: Matrix;
  features: EncodedFeature[];
  dropped: string[];
}

function quantileEdges(values: number[], parts: number): number[] {
  const s = [...values].sort((a, b) => a - b);
  const edges: number[] = [];
  for (let k = 1; k < parts; k++) edges.push(s[Math.floor((k / parts) * (s.length - 1))]);
  return [...new Set(edges)];
}

/**
 * @param rowIndex rows of the dataset to encode (in matrix order)
 * @param fitRows  positions (into rowIndex) used to fit means/categories
 */
export function encodeFeatures(
  ds: Dataset,
  profiles: readonly ColumnProfile[],
  exclude: ReadonlySet<string>,
  rowIndex: ArrayLike<number>,
  fitRows: ArrayLike<number>,
): Encoding {
  const n = rowIndex.length;
  const dropped: string[] = [];
  interface Plan {
    name: string;
    j: number;
    kind: 'numeric' | 'categorical';
    width: number;
    mean?: number;
    sd?: number;
    hasMissing?: boolean;
    edges?: number[];
    categories?: Map<string, number>;
  }
  const plans: Plan[] = [];
  for (const p of profiles) {
    if (exclude.has(p.name)) continue;
    if (p.kind === 'identifier' || p.kind === 'constant') {
      dropped.push(p.name);
      continue;
    }
    const j = ds.columns.indexOf(p.name);
    const cell = (pos: number): Cell => ds.rows[rowIndex[pos]][j];
    if (p.kind === 'numeric') {
      const vals: number[] = [];
      let missing = false;
      for (let i = 0; i < fitRows.length; i++) {
        const v = toNumber(cell(fitRows[i]));
        if (v === null) missing = true;
        else vals.push(v);
      }
      if (vals.length === 0) {
        dropped.push(p.name);
        continue;
      }
      const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
      const sd = Math.sqrt(vals.reduce((s, x) => s + (x - mean) ** 2, 0) / vals.length) || 1;
      plans.push({
        name: p.name,
        j,
        kind: 'numeric',
        width: missing ? 2 : 1,
        mean,
        sd,
        hasMissing: missing,
        edges: quantileEdges(vals, 5),
      });
    } else {
      if (p.unique > MAX_CARDINALITY) {
        dropped.push(p.name);
        continue;
      }
      const counts = new Map<string, number>();
      for (let i = 0; i < fitRows.length; i++) {
        const v = cell(fitRows[i]) ?? '(missing)';
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_CATEGORIES);
      const categories = new Map(top.map(([v], i) => [v, i]));
      // One extra slot for "other / unseen".
      plans.push({ name: p.name, j, kind: 'categorical', width: categories.size + 1, categories });
    }
  }

  const cols = plans.reduce((s, p) => s + p.width, 0);
  const data = new Float64Array(n * cols);
  const features: EncodedFeature[] = [];
  let offset = 0;
  for (const plan of plans) {
    const codes = new Int32Array(n);
    const columns = Array.from({ length: plan.width }, (_, k) => offset + k);
    for (let i = 0; i < n; i++) {
      const raw = ds.rows[rowIndex[i]][plan.j];
      const base = i * cols + offset;
      if (plan.kind === 'numeric') {
        const v = toNumber(raw);
        if (v === null) {
          data[base] = 0;
          if (plan.hasMissing) data[base + 1] = 1;
          codes[i] = plan.edges!.length + 1;
        } else {
          data[base] = (v - plan.mean!) / plan.sd!;
          let c = 0;
          while (c < plan.edges!.length && v > plan.edges![c]) c++;
          codes[i] = c;
        }
      } else {
        const k = plan.categories!.get(raw ?? '(missing)') ?? plan.categories!.size;
        data[base + k] = 1;
        codes[i] = k;
      }
    }
    features.push({ name: plan.name, kind: plan.kind, columns, codes });
    offset += plan.width;
  }
  return { X: { data, rows: n, cols }, features, dropped };
}
