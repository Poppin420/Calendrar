/**
 * L2-regularised logistic regression trained with mini-batch Adam.
 * Supports per-sample weights (needed for reweighing).
 *
 *   minimise  Σᵢ wᵢ·ℓ(yᵢ, σ(xᵢ·β + b)) / Σᵢ wᵢ  +  (λ/2)·‖β‖²
 *
 * where ℓ is the log-loss. The intercept b is not penalised.
 */

import { mulberry32, shuffle } from './random';

export interface Matrix {
  /** Row-major values, length rows × cols. */
  data: Float64Array;
  rows: number;
  cols: number;
}

export interface LogisticModel {
  coef: Float64Array;
  intercept: number;
}

export interface TrainOptions {
  lambda?: number;
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
  seed?: number;
}

export function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

export function logit(model: LogisticModel, X: Matrix, row: number): number {
  let z = model.intercept;
  const off = row * X.cols;
  for (let j = 0; j < X.cols; j++) z += model.coef[j] * X.data[off + j];
  return z;
}

export function predictProba(
  model: LogisticModel,
  X: Matrix,
  rows: ArrayLike<number>,
): Float64Array {
  const out = new Float64Array(rows.length);
  for (let i = 0; i < rows.length; i++) out[i] = sigmoid(logit(model, X, rows[i]));
  return out;
}

export function trainLogistic(
  X: Matrix,
  y: ArrayLike<number>,
  rows: ArrayLike<number>,
  weights?: ArrayLike<number>,
  options: TrainOptions = {},
): LogisticModel {
  const { lambda = 1e-3, epochs = 25, batchSize = 256, learningRate = 0.05, seed = 7 } = options;
  const d = X.cols;
  const coef = new Float64Array(d);
  const m = new Float64Array(d + 1);
  const v = new Float64Array(d + 1);
  const grad = new Float64Array(d + 1);
  const beta1 = 0.9;
  const beta2 = 0.999;
  const eps = 1e-8;
  let intercept = 0;
  let step = 0;

  // Start the intercept at the (weighted) log-odds of the base rate.
  let wPos = 0;
  let wAll = 0;
  for (let i = 0; i < rows.length; i++) {
    const w = weights ? weights[rows[i]] : 1;
    wAll += w;
    if (y[rows[i]] === 1) wPos += w;
  }
  const base = Math.min(1 - 1e-6, Math.max(1e-6, wPos / Math.max(wAll, 1e-12)));
  intercept = Math.log(base / (1 - base));
  const meanW = wAll / Math.max(rows.length, 1);

  const order = Int32Array.from(rows);
  const rand = mulberry32(seed);
  for (let epoch = 0; epoch < epochs; epoch++) {
    shuffle(order, rand);
    const lr = learningRate / Math.sqrt(1 + epoch / 5);
    for (let start = 0; start < order.length; start += batchSize) {
      const end = Math.min(order.length, start + batchSize);
      grad.fill(0);
      let wSum = 0;
      for (let k = start; k < end; k++) {
        const r = order[k];
        const w = (weights ? weights[r] : 1) / meanW;
        const off = r * d;
        let z = intercept;
        for (let j = 0; j < d; j++) z += coef[j] * X.data[off + j];
        const err = w * (sigmoid(z) - (y[r] === 1 ? 1 : 0));
        for (let j = 0; j < d; j++) grad[j] += err * X.data[off + j];
        grad[d] += err;
        wSum += w;
      }
      if (wSum === 0) continue;
      step++;
      const c1 = 1 - beta1 ** step;
      const c2 = 1 - beta2 ** step;
      for (let j = 0; j <= d; j++) {
        const g = grad[j] / wSum + (j < d ? lambda * coef[j] : 0);
        m[j] = beta1 * m[j] + (1 - beta1) * g;
        v[j] = beta2 * v[j] + (1 - beta2) * g * g;
        const delta = (lr * (m[j] / c1)) / (Math.sqrt(v[j] / c2) + eps);
        if (j < d) coef[j] -= delta;
        else intercept -= delta;
      }
    }
  }
  return { coef, intercept };
}
