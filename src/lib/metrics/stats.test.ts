import { describe, expect, it } from 'vitest';
import { katzRatio, newcombeDifference, safeDivide, wilson } from './stats';

describe('safeDivide', () => {
  it('divides normally', () => expect(safeDivide(1, 4)).toBe(0.25));
  it('returns null on division by zero', () => expect(safeDivide(3, 0)).toBeNull());
  it('returns null on non-finite input', () => expect(safeDivide(Number.NaN, 2)).toBeNull());
});

describe('wilson', () => {
  // Hand-computed with z = 1.96: centre 0.5, half-width 0.2634.
  it('matches the textbook value for 5/10', () => {
    const p = wilson(5, 10);
    expect(p.value).toBe(0.5);
    expect(p.lower).toBeCloseTo(0.2366, 4);
    expect(p.upper).toBeCloseTo(0.7634, 4);
  });

  it('gives a non-degenerate interval for zero successes', () => {
    const p = wilson(0, 10);
    expect(p.value).toBe(0);
    expect(p.lower).toBe(0);
    expect(p.upper).toBeCloseTo(0.2775, 4);
  });

  it('is symmetric for all successes', () => {
    const p = wilson(10, 10);
    expect(p.upper).toBe(1);
    expect(p.lower).toBeCloseTo(0.7225, 4);
  });

  it('returns nulls for an empty group', () => {
    expect(wilson(0, 0)).toEqual({ k: 0, n: 0, value: null, lower: null, upper: null });
  });

  it('rejects impossible counts', () => {
    expect(wilson(5, 3).value).toBeNull();
    expect(wilson(-1, 3).value).toBeNull();
  });

  it('narrows as n grows', () => {
    const small = wilson(30, 100);
    const big = wilson(300, 1000);
    expect(big.upper! - big.lower!).toBeLessThan(small.upper! - small.lower!);
  });
});

describe('newcombeDifference', () => {
  it('matches a hand computation for 50/100 vs 30/100', () => {
    // Wilson: [0.4038, 0.5962] and [0.2189, 0.3958]
    // L = 0.2 − √(0.0962² + 0.0958²) ≈ 0.0642, U = 0.2 + √(0.0962² + 0.0811²) ≈ 0.3258
    const d = newcombeDifference(wilson(50, 100), wilson(30, 100));
    expect(d.value).toBeCloseTo(0.2, 10);
    expect(d.lower).toBeCloseTo(0.0642, 3);
    expect(d.upper).toBeCloseTo(0.3258, 3);
  });

  it('contains zero for identical groups', () => {
    const d = newcombeDifference(wilson(20, 50), wilson(20, 50));
    expect(d.value).toBe(0);
    expect(d.lower!).toBeLessThan(0);
    expect(d.upper!).toBeGreaterThan(0);
  });

  it('returns nulls when a group is empty', () => {
    expect(newcombeDifference(wilson(0, 0), wilson(3, 10)).value).toBeNull();
  });
});

describe('katzRatio', () => {
  it('matches a hand computation for 30/100 vs 50/100', () => {
    // RR = 0.6, SE = √(1/30 − 1/100 + 1/50 − 1/100) = 0.18257
    const r = katzRatio(wilson(30, 100), wilson(50, 100));
    expect(r.value).toBeCloseTo(0.6, 10);
    expect(r.lower).toBeCloseTo(0.4198, 3);
    expect(r.upper).toBeCloseTo(0.8581, 3);
  });

  it('is undefined when the reference group has no successes', () => {
    expect(katzRatio(wilson(3, 10), wilson(0, 10)).value).toBeNull();
  });

  it('handles zero successes in the numerator with a continuity correction', () => {
    const r = katzRatio(wilson(0, 40), wilson(20, 40));
    expect(r.value).toBe(0);
    expect(r.lower).toBe(0);
    expect(r.upper!).toBeGreaterThan(0);
    expect(r.upper!).toBeLessThan(1);
  });
});
