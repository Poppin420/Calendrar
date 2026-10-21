/**
 * Orchestrates a full audit: turns the raw table + column mapping into
 * group labels and binary outcomes, then computes every metric.
 */

import { binLabels, groupOf } from '../binning';
import type {
  AttributeAudit,
  AuditConfig,
  AuditResult,
  Dataset,
  IntersectionalResult,
  SensitiveSpec,
} from '../types';
import { allMetrics } from './fairness';
import { computeGroupStats, statsForGroup } from './groups';

export interface PreparedData {
  /** labels[a][i] = group of row i for sensitive attribute a. */
  labels: string[][];
  /** Bin order per attribute (undefined = sort by size). */
  orders: (string[] | undefined)[];
  pred: Uint8Array;
  truth?: Uint8Array;
  /** Index of each kept row in the original dataset. */
  rowIndex: Int32Array;
  dropped: number;
}

export function attributeName(spec: SensitiveSpec): string {
  return spec.column;
}

export const INTERSECTION_SEPARATOR = ' × ';

/**
 * Keep rows that have a decision, every sensitive value and (if used) the
 * ground truth, and binarise outcomes.
 */
export function prepare(ds: Dataset, config: AuditConfig): PreparedData {
  const col = (name: string) => {
    const j = ds.columns.indexOf(name);
    if (j < 0) throw new Error(`Unknown column: ${name}`);
    return j;
  };
  const dj = col(config.decisionColumn);
  const tj = config.groundTruthColumn ? col(config.groundTruthColumn) : -1;
  const sj = config.sensitive.map((s) => col(s.column));
  const fav = new Set(config.favorableValues.map((v) => v.trim()));
  const tFav = new Set((config.groundTruthFavorableValues ?? []).map((v) => v.trim()));
  const binLabelSets = config.sensitive.map((s) =>
    s.binEdges
      ? binLabels(
          [...s.binEdges].sort((a, b) => a - b),
          s.integer ?? false,
        )
      : undefined,
  );

  const labels: string[][] = config.sensitive.map(() => []);
  const pred: number[] = [];
  const truth: number[] = [];
  const kept: number[] = [];
  let dropped = 0;
  rows: for (let i = 0; i < ds.rows.length; i++) {
    const row = ds.rows[i];
    const d = row[dj];
    if (d === null) {
      dropped++;
      continue;
    }
    const t = tj >= 0 ? row[tj] : '';
    if (t === null) {
      dropped++;
      continue;
    }
    const gs: string[] = [];
    for (let a = 0; a < sj.length; a++) {
      const g = groupOf(row[sj[a]], config.sensitive[a], binLabelSets[a]);
      if (g === null) {
        dropped++;
        continue rows;
      }
      gs.push(g);
    }
    gs.forEach((g, a) => labels[a].push(g));
    pred.push(fav.has(d.trim()) ? 1 : 0);
    if (tj >= 0) truth.push(tFav.has(t.trim()) ? 1 : 0);
    kept.push(i);
  }
  return {
    labels,
    orders: binLabelSets,
    pred: Uint8Array.from(pred),
    truth: tj >= 0 ? Uint8Array.from(truth) : undefined,
    rowIndex: Int32Array.from(kept),
    dropped,
  };
}

/** Labels of the combined (intersectional) groups for two attributes. */
export function intersectLabels(a: readonly string[], b: readonly string[]): string[] {
  return a.map((x, i) => `${x}${INTERSECTION_SEPARATOR}${b[i]}`);
}

export function runAudit(ds: Dataset, config: AuditConfig, now: Date = new Date()): AuditResult {
  if (config.sensitive.length === 0)
    throw new Error('At least one sensitive attribute is required');
  const p = prepare(ds, config);
  const hasGroundTruth = p.truth !== undefined;

  const attributes: AttributeAudit[] = config.sensitive.map((spec, a) => {
    const groups = computeGroupStats(p.labels[a], p.pred, p.truth, p.orders[a]);
    return {
      attribute: attributeName(spec),
      columns: [spec.column],
      groups,
      metrics: allMetrics(groups, hasGroundTruth),
    };
  });

  let intersectional: IntersectionalResult | undefined;
  if (config.sensitive.length >= 2) {
    const [sa, sb] = config.sensitive;
    const combined = intersectLabels(p.labels[0], p.labels[1]);
    const groups = computeGroupStats(combined, p.pred, p.truth);
    attributes.push({
      attribute: `${attributeName(sa)}${INTERSECTION_SEPARATOR}${attributeName(sb)}`,
      columns: [sa.column, sb.column],
      groups,
      metrics: allMetrics(groups, hasGroundTruth),
    });
    const rowGroups = attributes[0].groups.map((g) => g.group);
    const colGroups = attributes[1].groups.map((g) => g.group);
    const byLabel = new Map(groups.map((g) => [g.group, g]));
    intersectional = {
      rowAttribute: attributeName(sa),
      colAttribute: attributeName(sb),
      rowGroups,
      colGroups,
      cells: rowGroups.flatMap((r) =>
        colGroups.map((c) => {
          const label = `${r}${INTERSECTION_SEPARATOR}${c}`;
          return {
            rowGroup: r,
            colGroup: c,
            stats: byLabel.get(label) ?? statsForGroup(label, [], hasGroundTruth ? [] : undefined),
          };
        }),
      ),
    };
  }

  const overall = statsForGroup('all', p.pred, p.truth);
  const positives = overall.selectionRate.k;
  return {
    rowCount: p.pred.length,
    droppedRows: p.dropped,
    overall,
    hasGroundTruth,
    attributes,
    intersectional,
    singleClass: p.pred.length > 0 && (positives === 0 || positives === p.pred.length),
    generatedAt: now.toISOString(),
  };
}
