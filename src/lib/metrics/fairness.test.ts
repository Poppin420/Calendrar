import { describe, expect, it } from 'vitest';
import type { Confusion, GroupStats } from '../types';
import {
  allMetrics,
  demographicParity,
  disparateImpact,
  equalOpportunity,
  equalizedOdds,
  predictiveParity,
} from './fairness';
import { computeGroupStats, statsForGroup, withConfusion } from './groups';

/** Build a group with n rows of which k received the favorable decision. */
function group(name: string, k: number, n: number): GroupStats {
  return statsForGroup(
    name,
    Array.from({ length: n }, (_, i) => (i < k ? 1 : 0)),
  );
}

function confusionGroup(name: string, c: Confusion): GroupStats {
  const n = c.tp + c.fp + c.tn + c.fn;
  return withConfusion(
    statsForGroup(
      name,
      Array.from({ length: n }, (_, i) => (i < c.tp + c.fp ? 1 : 0)),
    ),
    c,
  );
}

describe('computeGroupStats', () => {
  it('computes selection rates per group', () => {
    const labels = ['a', 'a', 'a', 'a', 'b', 'b'];
    const pred = [1, 1, 0, 0, 1, 0];
    const [a, b] = computeGroupStats(labels, pred);
    expect(a.group).toBe('a');
    expect(a.selectionRate.value).toBe(0.5);
    expect(b.selectionRate.value).toBe(0.5);
  });

  it('computes the confusion matrix and error rates', () => {
    // truth:  1 1 1 0 0 0 ; pred: 1 1 0 1 0 0
    const [g] = computeGroupStats(
      ['x', 'x', 'x', 'x', 'x', 'x'],
      [1, 1, 0, 1, 0, 0],
      [1, 1, 1, 0, 0, 0],
    );
    expect(g.confusion).toEqual({ tp: 2, fp: 1, tn: 2, fn: 1 });
    expect(g.tpr?.value).toBeCloseTo(2 / 3);
    expect(g.fpr?.value).toBeCloseTo(1 / 3);
    expect(g.precision?.value).toBeCloseTo(2 / 3);
    expect(g.accuracy?.value).toBeCloseTo(4 / 6);
  });

  it('respects an explicit order', () => {
    const res = computeGroupStats(['old', 'young', 'young'], [1, 0, 1], undefined, [
      'young',
      'old',
    ]);
    expect(res.map((g) => g.group)).toEqual(['young', 'old']);
  });

  it('gives null rates (not NaN) when a group has no actual positives', () => {
    const [g] = computeGroupStats(['x', 'x'], [0, 1], [0, 0]);
    expect(g.tpr?.value).toBeNull();
    expect(g.fpr?.value).toBe(0.5);
  });

  it('rejects mismatched lengths', () => {
    expect(() => computeGroupStats(['a'], [1, 0])).toThrow();
  });
});

describe('disparateImpact', () => {
  it('flags a clear violation of the four-fifths rule', () => {
    const r = disparateImpact([group('men', 50, 100), group('women', 30, 100)]);
    expect(r.worstGroup).toBe('women');
    expect(r.bestGroup).toBe('men');
    expect(r.ratio?.value).toBeCloseTo(0.6);
    expect(r.verdict).toBe('concern');
  });

  it('passes when the ratio is at least 0.8', () => {
    const r = disparateImpact([group('a', 50, 100), group('b', 40, 100)]);
    expect(r.ratio?.value).toBeCloseTo(0.8);
    expect(r.verdict).toBe('ok');
  });

  it('is inconclusive when the gap is large but intervals overlap', () => {
    // 0.40 vs 0.25 → ratio 0.625, but with n = 40 the gap's interval contains 0
    const r = disparateImpact([group('a', 16, 40), group('b', 10, 40)]);
    expect(r.ratio?.value).toBeCloseTo(0.625);
    expect(r.difference.lower!).toBeLessThan(0);
    expect(r.verdict).toBe('inconclusive');
  });

  it('warns instead of concluding when groups are smaller than 30', () => {
    const r = disparateImpact([group('a', 9, 10), group('b', 1, 10)]);
    expect(r.verdict).toBe('insufficient');
  });

  it('ignores tiny groups when enough large ones exist', () => {
    const r = disparateImpact([group('a', 50, 100), group('b', 48, 100), group('tiny', 0, 5)]);
    expect(r.worstGroup).toBe('b');
    expect(r.verdict).toBe('ok');
  });

  it('is not applicable when nobody gets the favorable outcome', () => {
    const r = disparateImpact([group('a', 0, 100), group('b', 0, 100)]);
    expect(r.ratio?.value).toBeNull();
    expect(r.verdict).toBe('na');
  });

  it('is not applicable with a single group', () => {
    expect(disparateImpact([group('a', 10, 100)]).verdict).toBe('na');
  });

  it('skips empty groups', () => {
    const r = disparateImpact([group('a', 10, 100), group('b', 10, 100), group('empty', 0, 0)]);
    expect(r.verdict).toBe('ok');
    expect(r.worstGroup).not.toBe('empty');
  });

  it('reports a ratio of 0 when one group never gets the favorable outcome', () => {
    const r = disparateImpact([group('a', 40, 100), group('b', 0, 100)]);
    expect(r.ratio?.value).toBe(0);
    expect(r.verdict).toBe('concern');
  });
});

describe('demographicParity', () => {
  it('reports difference and ratio', () => {
    const r = demographicParity([group('a', 60, 100), group('b', 30, 100), group('c', 45, 100)]);
    expect(r.difference.value).toBeCloseTo(0.3);
    expect(r.ratio?.value).toBeCloseTo(0.5);
    expect(r.worstGroup).toBe('b');
    expect(r.verdict).toBe('concern');
  });

  it('treats a gap that rounds to 10.0 points as within the threshold', () => {
    // 0.6004 vs 0.5 → 10.04 points, displayed as "10.0"
    const r = demographicParity([group('a', 15010, 25000), group('b', 12500, 25000)]);
    expect(r.difference.value).toBeCloseTo(0.1004, 4);
    expect(r.verdict).toBe('ok');
  });

  it('is ok when the gap is within 10 points', () => {
    const r = demographicParity([group('a', 55, 100), group('b', 50, 100)]);
    expect(r.verdict).toBe('ok');
  });
});

describe('error-based metrics', () => {
  const a = confusionGroup('a', { tp: 80, fn: 20, fp: 10, tn: 90 }); // TPR .8, FPR .1, PPV .889
  const b = confusionGroup('b', { tp: 40, fn: 60, fp: 10, tn: 90 }); // TPR .4, FPR .1, PPV .8

  it('equal opportunity compares true positive rates', () => {
    const r = equalOpportunity([a, b]);
    expect(r.difference.value).toBeCloseTo(0.4);
    expect(r.worstGroup).toBe('b');
    expect(r.verdict).toBe('concern');
  });

  it('equalized odds takes the larger of the TPR and FPR gaps', () => {
    const r = equalizedOdds([a, b]);
    expect(r.component).toBe('tpr');
    expect(r.difference.value).toBeCloseTo(0.4);
    expect(r.verdict).toBe('concern');
  });

  it('equalized odds picks FPR when that gap is larger', () => {
    const c = confusionGroup('c', { tp: 80, fn: 20, fp: 50, tn: 50 }); // FPR .5
    const r = equalizedOdds([a, c]);
    expect(r.component).toBe('fpr');
    expect(r.difference.value).toBeCloseTo(0.4);
  });

  it('predictive parity compares precision', () => {
    const r = predictiveParity([a, b]);
    expect(r.difference.value).toBeCloseTo(80 / 90 - 0.8);
    expect(r.verdict).toBe('ok');
  });

  it('is not applicable when no group has actual positives', () => {
    const z1 = confusionGroup('z1', { tp: 0, fn: 0, fp: 5, tn: 95 });
    const z2 = confusionGroup('z2', { tp: 0, fn: 0, fp: 3, tn: 97 });
    expect(equalOpportunity([z1, z2]).verdict).toBe('na');
    // FPR is still defined, so equalized odds falls back to it.
    expect(equalizedOdds([z1, z2]).component).toBe('fpr');
  });

  it('allMetrics only includes error-based metrics with ground truth', () => {
    expect(allMetrics([a, b], false).map((m) => m.key)).toEqual([
      'disparateImpact',
      'demographicParity',
    ]);
    expect(allMetrics([a, b], true)).toHaveLength(6);
  });
});
