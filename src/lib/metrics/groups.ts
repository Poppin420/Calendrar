/**
 * Per-group statistics: selection rate and, when ground truth is available,
 * the confusion matrix and error-based rates. Every rate carries a Wilson
 * 95% confidence interval.
 */

import type { Confusion, GroupStats } from '../types';
import { wilson } from './stats';

/** Groups smaller than this are reported but never used to draw conclusions. */
export const MIN_GROUP_SIZE = 30;

/**
 * Statistics for one group.
 *
 * @param group  group label
 * @param pred   1 = favorable decision, 0 = unfavorable
 * @param truth  optional actual outcome (1 = favorable), same length as pred
 */
export function statsForGroup(
  group: string,
  pred: ArrayLike<number>,
  truth?: ArrayLike<number>,
): GroupStats {
  const n = pred.length;
  let selected = 0;
  for (let i = 0; i < n; i++) selected += pred[i] === 1 ? 1 : 0;
  const stats: GroupStats = { group, n, selectionRate: wilson(selected, n) };
  if (!truth) return stats;
  if (truth.length !== n) throw new Error('pred and truth must have the same length');

  const c: Confusion = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (let i = 0; i < n; i++) {
    const p = pred[i] === 1;
    const t = truth[i] === 1;
    if (p && t) c.tp++;
    else if (p && !t) c.fp++;
    else if (!p && t) c.fn++;
    else c.tn++;
  }
  return withConfusion(stats, c);
}

/** Derive all error-based rates from a confusion matrix. */
export function withConfusion(stats: GroupStats, c: Confusion): GroupStats {
  const n = c.tp + c.fp + c.tn + c.fn;
  return {
    ...stats,
    confusion: c,
    // True positive rate (recall): P(favorable decision | actually favorable)
    tpr: wilson(c.tp, c.tp + c.fn),
    // False positive rate: P(favorable decision | actually unfavorable)
    fpr: wilson(c.fp, c.fp + c.tn),
    // Precision (PPV): P(actually favorable | favorable decision)
    precision: wilson(c.tp, c.tp + c.fp),
    accuracy: wilson(c.tp + c.tn, n),
    baseRate: wilson(c.tp + c.fn, n),
  };
}

/**
 * Split rows by group label and compute statistics for each group.
 *
 * @param labels  group label per row
 * @param pred    decision per row (1 favorable / 0 not)
 * @param truth   optional actual outcome per row
 * @param order   optional explicit group order (e.g. age bins); groups not
 *                listed are appended sorted by size, largest first
 */
export function computeGroupStats(
  labels: readonly string[],
  pred: ArrayLike<number>,
  truth?: ArrayLike<number>,
  order?: readonly string[],
): GroupStats[] {
  if (labels.length !== pred.length) throw new Error('labels and pred must have the same length');
  const index = new Map<string, number[]>();
  for (let i = 0; i < labels.length; i++) {
    const rows = index.get(labels[i]);
    if (rows) rows.push(i);
    else index.set(labels[i], [i]);
  }
  const result: GroupStats[] = [];
  for (const [group, rows] of index) {
    const p = rows.map((r) => pred[r]);
    const t = truth ? rows.map((r) => truth[r]) : undefined;
    result.push(statsForGroup(group, p, t));
  }
  return sortGroups(result, order);
}

export function sortGroups(groups: GroupStats[], order?: readonly string[]): GroupStats[] {
  const rank = new Map((order ?? []).map((g, i) => [g, i]));
  return [...groups].sort((a, b) => {
    const ra = rank.get(a.group);
    const rb = rank.get(b.group);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return b.n - a.n || a.group.localeCompare(b.group);
  });
}
