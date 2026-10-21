/**
 * Group fairness metrics.
 *
 * Every metric compares the group with the lowest rate to the group with the
 * highest rate, considering only groups with at least MIN_GROUP_SIZE rows in
 * the metric's denominator. Smaller groups are still shown in the tables but
 * never drive a verdict.
 *
 * Verdict rules (see Methodology page):
 *  - ratio metrics (disparate impact): ok if worst/best ≥ 0.8 (four-fifths rule)
 *  - gap metrics: ok if best − worst ≤ 0.10
 *  - otherwise "concern" if the 95% interval of the gap excludes 0, else
 *    "inconclusive" (the groups' intervals overlap too much to tell)
 */

import type { GroupStats, MetricKey, MetricResult, Proportion, Verdict } from '../types';
import { MIN_GROUP_SIZE } from './groups';
import { katzRatio, newcombeDifference } from './stats';

/** The four-fifths (80%) rule of the US Uniform Guidelines (29 CFR §1607.4(D)). */
export const FOUR_FIFTHS = 0.8;
/** Absolute gap above which a difference in rates is flagged. */
export const GAP_THRESHOLD = 0.1;

export type RateKey = 'selectionRate' | 'tpr' | 'fpr' | 'precision' | 'accuracy';

function rateOf(g: GroupStats, key: RateKey): Proportion | undefined {
  return g[key];
}

interface Extremes {
  low: GroupStats;
  high: GroupStats;
  lowRate: Proportion;
  highRate: Proportion;
  reliable: boolean;
}

/**
 * Find the groups with the lowest and highest value of a rate. Groups whose
 * denominator is below MIN_GROUP_SIZE are ignored unless fewer than two
 * groups remain, in which case `reliable` is false.
 */
export function extremes(groups: readonly GroupStats[], key: RateKey): Extremes | null {
  const withValue = groups.filter((g) => rateOf(g, key)?.value != null);
  if (withValue.length < 2) return null;
  const big = withValue.filter((g) => (rateOf(g, key)?.n ?? 0) >= MIN_GROUP_SIZE);
  const pool = big.length >= 2 ? big : withValue;
  let low = pool[0];
  let high = pool[0];
  for (const g of pool) {
    const v = rateOf(g, key)!.value!;
    if (v < rateOf(low, key)!.value!) low = g;
    if (v > rateOf(high, key)!.value!) high = g;
  }
  return {
    low,
    high,
    lowRate: rateOf(low, key)!,
    highRate: rateOf(high, key)!,
    reliable: big.length >= 2,
  };
}

function empty(key: MetricKey, threshold: number): MetricResult {
  return {
    key,
    worstGroup: null,
    bestGroup: null,
    worstValue: null,
    bestValue: null,
    difference: { value: null, lower: null, upper: null },
    threshold,
    verdict: 'na',
  };
}

/**
 * Generic comparison of a rate between the lowest and highest group.
 * `mode = 'ratio'` applies the four-fifths rule to low/high, `'difference'`
 * applies GAP_THRESHOLD to high − low.
 */
export function compareRate(
  key: MetricKey,
  groups: readonly GroupStats[],
  rate: RateKey,
  mode: 'ratio' | 'difference',
): MetricResult {
  const threshold = mode === 'ratio' ? FOUR_FIFTHS : GAP_THRESHOLD;
  const ex = extremes(groups, rate);
  if (!ex) return empty(key, threshold);

  const difference = newcombeDifference(ex.highRate, ex.lowRate);
  const result: MetricResult = {
    key,
    worstGroup: ex.low.group,
    bestGroup: ex.high.group,
    worstValue: ex.lowRate.value,
    bestValue: ex.highRate.value,
    difference,
    threshold,
    verdict: 'na',
  };

  const clearGap = difference.lower !== null && difference.lower > 0;
  if (mode === 'ratio') {
    result.ratio = katzRatio(ex.lowRate, ex.highRate);
    if (result.ratio.value === null) {
      // Nobody in any group gets the favorable outcome: nothing to compare.
      result.verdict = 'na';
      return result;
    }
    result.verdict = !ex.reliable
      ? 'insufficient'
      : result.ratio.value >= threshold
        ? 'ok'
        : clearGap
          ? 'concern'
          : 'inconclusive';
  } else {
    result.verdict = !ex.reliable
      ? 'insufficient'
      : // Compare at the precision we display (0.1 percentage points) so the
        // verdict never contradicts the number shown to the user.
        Math.round((difference.value ?? 0) * 1000) / 1000 <= threshold + 1e-12
        ? 'ok'
        : clearGap
          ? 'concern'
          : 'inconclusive';
  }
  return result;
}

/**
 * Disparate impact: ratio of the lowest to the highest selection rate.
 * Flagged when below 0.8 (the "four-fifths rule").
 */
export function disparateImpact(groups: readonly GroupStats[]): MetricResult {
  return compareRate('disparateImpact', groups, 'selectionRate', 'ratio');
}

/**
 * Demographic (statistical) parity difference: highest minus lowest selection
 * rate. 0 means every group receives the favorable outcome equally often.
 * The ratio is the same quantity as disparate impact and is reported too.
 */
export function demographicParity(groups: readonly GroupStats[]): MetricResult {
  const r = compareRate('demographicParity', groups, 'selectionRate', 'difference');
  if (r.worstGroup !== null) {
    const ex = extremes(groups, 'selectionRate')!;
    r.ratio = katzRatio(ex.lowRate, ex.highRate);
  }
  return r;
}

/**
 * Equal opportunity (Hardt et al., 2016): gap in true positive rate, i.e.
 * among people who actually deserved the favorable outcome, how often each
 * group received it.
 */
export function equalOpportunity(groups: readonly GroupStats[]): MetricResult {
  return compareRate('equalOpportunity', groups, 'tpr', 'difference');
}

const SEVERITY: Record<Verdict, number> = {
  ok: 0,
  inconclusive: 1,
  concern: 2,
  insufficient: 3,
  na: 4,
};

/**
 * Equalized odds (Hardt et al., 2016): both TPR and FPR should be equal across
 * groups. Reported as the larger of the two gaps; the verdict is the more
 * severe of the two component verdicts.
 */
export function equalizedOdds(groups: readonly GroupStats[]): MetricResult {
  const tpr = compareRate('equalizedOdds', groups, 'tpr', 'difference');
  const fpr = compareRate('equalizedOdds', groups, 'fpr', 'difference');
  const tGap = tpr.difference.value ?? -1;
  const fGap = fpr.difference.value ?? -1;
  const main =
    fGap > tGap ? { ...fpr, component: 'fpr' as const } : { ...tpr, component: 'tpr' as const };
  // A component that can be computed decides over one that cannot.
  const verdicts = [tpr.verdict, fpr.verdict].filter((v) => v !== 'na');
  if (verdicts.length === 0) return { ...main, verdict: 'na' };
  const decisive = verdicts.filter((v) => v !== 'insufficient');
  main.verdict =
    decisive.length === 0
      ? 'insufficient'
      : decisive.reduce((a, b) => (SEVERITY[b] > SEVERITY[a] ? b : a));
  return main;
}

/**
 * Predictive parity (Chouldechova, 2017): gap in precision, i.e. among people
 * who received the favorable decision, how often it was actually deserved.
 */
export function predictiveParity(groups: readonly GroupStats[]): MetricResult {
  return compareRate('predictiveParity', groups, 'precision', 'difference');
}

/** Accuracy parity: gap in the share of correct decisions per group. */
export function accuracyParity(groups: readonly GroupStats[]): MetricResult {
  return compareRate('accuracyParity', groups, 'accuracy', 'difference');
}

/** All metrics that apply to the data (error-based ones need ground truth). */
export function allMetrics(groups: readonly GroupStats[], hasGroundTruth: boolean): MetricResult[] {
  const metrics = [disparateImpact(groups), demographicParity(groups)];
  if (hasGroundTruth) {
    metrics.push(
      equalOpportunity(groups),
      equalizedOdds(groups),
      predictiveParity(groups),
      accuracyParity(groups),
    );
  }
  return metrics;
}
