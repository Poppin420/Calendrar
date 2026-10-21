/**
 * Permutation importance (Breiman, 2001): how much accuracy drops when one
 * feature's values are shuffled across rows, breaking its link with the
 * outcome while keeping its distribution.
 */

import { logit, type LogisticModel, type Matrix } from './logistic';
import { mulberry32, shuffle } from './random';

export function accuracyOf(
  model: LogisticModel,
  X: Matrix,
  y: ArrayLike<number>,
  rows: ArrayLike<number>,
): number {
  if (rows.length === 0) return 0;
  let correct = 0;
  for (let i = 0; i < rows.length; i++) {
    const p = logit(model, X, rows[i]) >= 0 ? 1 : 0;
    if (p === (y[rows[i]] === 1 ? 1 : 0)) correct++;
  }
  return correct / rows.length;
}

/**
 * @param groups   design-matrix columns of each feature
 * @returns mean accuracy drop per feature (can be slightly negative by chance)
 */
export function permutationImportance(
  model: LogisticModel,
  X: Matrix,
  y: ArrayLike<number>,
  rows: ArrayLike<number>,
  groups: readonly number[][],
  repeats = 3,
  seed = 11,
): number[] {
  const rand = mulberry32(seed);
  const n = rows.length;
  const base = new Float64Array(n);
  for (let i = 0; i < n; i++) base[i] = logit(model, X, rows[i]);
  let baseCorrect = 0;
  for (let i = 0; i < n; i++)
    if ((base[i] >= 0 ? 1 : 0) === (y[rows[i]] === 1 ? 1 : 0)) baseCorrect++;
  const baseAcc = n === 0 ? 0 : baseCorrect / n;

  const perm = new Int32Array(n);
  return groups.map((cols) => {
    let total = 0;
    for (let rep = 0; rep < repeats; rep++) {
      for (let i = 0; i < n; i++) perm[i] = i;
      shuffle(perm, rand);
      let correct = 0;
      for (let i = 0; i < n; i++) {
        // Replace this feature's contribution with the one of a random other row.
        let z = base[i];
        const own = rows[i] * X.cols;
        const other = rows[perm[i]] * X.cols;
        for (const c of cols) z += model.coef[c] * (X.data[other + c] - X.data[own + c]);
        if ((z >= 0 ? 1 : 0) === (y[rows[i]] === 1 ? 1 : 0)) correct++;
      }
      total += baseAcc - correct / Math.max(n, 1);
    }
    return total / repeats;
  });
}
