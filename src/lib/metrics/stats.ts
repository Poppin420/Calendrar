/**
 * Small, dependency-free statistical helpers used by the fairness metrics.
 * All functions are pure and return `null` instead of NaN/Infinity when a
 * quantity is undefined (e.g. a rate with an empty denominator).
 */

import type { Interval, Proportion } from '../types';

/** z-value for a two-sided 95% interval. */
export const Z_95 = 1.959963984540054;

/** a / b, or null when b is 0 or either input is not finite. */
export function safeDivide(a: number, b: number): number | null {
  if (b === 0 || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a / b;
}

/**
 * Wilson score interval for a binomial proportion k / n.
 *
 *   p̂ = k / n
 *   centre = (p̂ + z²/2n) / (1 + z²/n)
 *   half   = z · √(p̂(1−p̂)/n + z²/4n²) / (1 + z²/n)
 *
 * Unlike the normal ("Wald") interval it stays inside [0, 1] and behaves well
 * for small n and for p̂ close to 0 or 1, which is exactly the situation of
 * small demographic groups.
 *
 * Reference: Wilson, E. B. (1927). Probable inference, the law of succession,
 * and statistical inference. JASA 22(158).
 */
export function wilson(k: number, n: number, z: number = Z_95): Proportion {
  if (!Number.isFinite(k) || !Number.isFinite(n) || n <= 0 || k < 0 || k > n) {
    return { k, n, value: null, lower: null, upper: null };
  }
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return {
    k,
    n,
    value: p,
    // The bounds are exactly 0 / 1 at the extremes; avoid float noise there.
    lower: k === 0 ? 0 : Math.max(0, centre - half),
    upper: k === n ? 1 : Math.min(1, centre + half),
  };
}

/**
 * Newcombe's hybrid score interval (method 10) for the difference of two
 * independent proportions, a.value − b.value, built from their Wilson
 * intervals.
 *
 *   d = p₁ − p₂
 *   L = d − √((p₁ − l₁)² + (u₂ − p₂)²)
 *   U = d + √((u₁ − p₁)² + (p₂ − l₂)²)
 *
 * If the interval contains 0 the two groups cannot be told apart with
 * reasonable confidence: we call such a gap "inconclusive".
 *
 * Reference: Newcombe, R. G. (1998). Interval estimation for the difference
 * between independent proportions. Statistics in Medicine 17(8).
 */
export function newcombeDifference(a: Proportion, b: Proportion): Interval {
  if (
    a.value === null ||
    b.value === null ||
    a.lower === null ||
    a.upper === null ||
    b.lower === null ||
    b.upper === null
  ) {
    return { value: null, lower: null, upper: null };
  }
  const d = a.value - b.value;
  const lower = d - Math.sqrt((a.value - a.lower) ** 2 + (b.upper - b.value) ** 2);
  const upper = d + Math.sqrt((a.upper - a.value) ** 2 + (b.value - b.lower) ** 2);
  return { value: d, lower: Math.max(-1, lower), upper: Math.min(1, upper) };
}

/**
 * Ratio of two proportions (a / b) with the Katz log interval:
 *
 *   RR = p₁ / p₂,  SE(ln RR) = √(1/k₁ − 1/n₁ + 1/k₂ − 1/n₂)
 *
 * When a count is 0 the interval uses a 0.5 continuity correction (the point
 * estimate is left uncorrected). Returns nulls when b has no successes, since
 * the ratio is then undefined.
 *
 * Reference: Katz, D. et al. (1978). Obtaining confidence intervals for the
 * risk ratio in cohort studies. Biometrics 34(3).
 */
export function katzRatio(a: Proportion, b: Proportion, z: number = Z_95): Interval {
  if (a.value === null || b.value === null || b.k === 0) {
    return { value: null, lower: null, upper: null };
  }
  const value = a.value / b.value;
  let k1 = a.k;
  let n1 = a.n;
  let k2 = b.k;
  let n2 = b.n;
  if (k1 === 0 || k2 === 0 || k1 === n1 || k2 === n2) {
    k1 += 0.5;
    n1 += 1;
    k2 += 0.5;
    n2 += 1;
  }
  const rr = k1 / n1 / (k2 / n2);
  const se = Math.sqrt(1 / k1 - 1 / n1 + 1 / k2 - 1 / n2);
  // Keep the uncorrected point estimate inside its own interval.
  return {
    value,
    lower: Math.min(value, Math.exp(Math.log(rr) - z * se)),
    upper: Math.max(value, Math.exp(Math.log(rr) + z * se)),
  };
}
