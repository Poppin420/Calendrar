/**
 * "Dig deeper": train a model without the sensitive attribute, find proxy
 * features, and compare against a reweighed model.
 */

import { intersectLabels, prepare } from '../metrics/audit';
import { demographicParity, disparateImpact, equalOpportunity } from '../metrics/fairness';
import { computeGroupStats } from '../metrics/groups';
import type {
  AuditConfig,
  ColumnProfile,
  Dataset,
  DeeperResult,
  FeatureInsight,
  ModelEvaluation,
} from '../types';
import { contingency, cramersV, normalisedMutualInformation } from './association';
import { encodeFeatures } from './encode';
import { accuracyOf, permutationImportance } from './importance';
import { logit, trainLogistic, type LogisticModel, type Matrix } from './logistic';
import { mulberry32, shuffle, stratifiedSplit } from './random';
import { reweighingWeights } from './reweighing';

export const MAX_TRAIN_ROWS = 60_000;
export const MAX_IMPORTANCE_ROWS = 5_000;
/** A feature is flagged as a likely proxy above this Cramér's V ... */
export const PROXY_ASSOCIATION = 0.25;
/** ... when it is also among the model's most important features. */
export const PROXY_TOP_K = 5;

export class DeeperError extends Error {
  constructor(public readonly code: 'noFeatures' | 'singleClass' | 'tooFewRows') {
    super(code);
  }
}

export type ProgressFn = (fraction: number, stage: string) => void;

function evaluate(
  model: LogisticModel,
  X: Matrix,
  y: Uint8Array,
  test: Int32Array,
  labels: readonly string[],
  withTruth: boolean,
  order?: string[],
): ModelEvaluation {
  const preds = new Uint8Array(test.length);
  const lab: string[] = [];
  const truth = new Uint8Array(test.length);
  for (let i = 0; i < test.length; i++) {
    preds[i] = logit(model, X, test[i]) >= 0 ? 1 : 0;
    lab.push(labels[test[i]]);
    truth[i] = y[test[i]];
  }
  const groups = computeGroupStats(lab, preds, withTruth ? truth : undefined, order);
  return {
    accuracy: accuracyOf(model, X, y, test),
    groups,
    disparateImpact: disparateImpact(groups),
    demographicParity: demographicParity(groups),
    equalOpportunity: withTruth ? equalOpportunity(groups) : undefined,
  };
}

function columnSd(X: Matrix, c: number, rows: ArrayLike<number>): number {
  let s = 0;
  let s2 = 0;
  for (let i = 0; i < rows.length; i++) {
    const v = X.data[rows[i] * X.cols + c];
    s += v;
    s2 += v * v;
  }
  const n = Math.max(rows.length, 1);
  return Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
}

/**
 * @param attributeIndex index into config.sensitive, or sensitive.length for
 *                       the intersection of the first two attributes
 */
export function runDeeper(
  ds: Dataset,
  profiles: readonly ColumnProfile[],
  config: AuditConfig,
  attributeIndex: number,
  onProgress: ProgressFn = () => {},
): DeeperResult {
  onProgress(0.05, 'prepare');
  const p = prepare(ds, config);
  const intersection = attributeIndex >= config.sensitive.length && config.sensitive.length >= 2;
  const allLabels = intersection
    ? intersectLabels(p.labels[0], p.labels[1])
    : p.labels[Math.min(attributeIndex, config.sensitive.length - 1)];
  const order = intersection
    ? undefined
    : p.orders[Math.min(attributeIndex, config.sensitive.length - 1)];
  const attribute = intersection
    ? config.sensitive.map((s) => s.column).join(' × ')
    : config.sensitive[Math.min(attributeIndex, config.sensitive.length - 1)].column;
  const target = p.truth ? 'groundTruth' : 'decision';
  const yAll = p.truth ?? p.pred;

  if (yAll.length < 50) throw new DeeperError('tooFewRows');

  // Sample down very large files, then work with positions 0..m-1.
  const rand = mulberry32(42);
  let positions = Int32Array.from({ length: yAll.length }, (_, i) => i);
  if (positions.length > MAX_TRAIN_ROWS) {
    positions = shuffle(positions, rand).slice(0, MAX_TRAIN_ROWS);
  }
  const m = positions.length;
  const y = new Uint8Array(m);
  const labels: string[] = new Array(m);
  const rowIndex = new Int32Array(m);
  let positives = 0;
  for (let i = 0; i < m; i++) {
    y[i] = yAll[positions[i]];
    labels[i] = allLabels[positions[i]];
    rowIndex[i] = p.rowIndex[positions[i]];
    positives += y[i];
  }
  if (positives === 0 || positives === m) throw new DeeperError('singleClass');

  const { train, test } = stratifiedSplit(y, 0.3, rand);

  onProgress(0.15, 'encode');
  const exclude = new Set<string>([
    config.decisionColumn,
    ...(config.groundTruthColumn ? [config.groundTruthColumn] : []),
    ...config.sensitive.map((s) => s.column),
  ]);
  const enc = encodeFeatures(ds, profiles, exclude, rowIndex, train);
  if (enc.X.cols === 0) throw new DeeperError('noFeatures');

  onProgress(0.3, 'train');
  const baselineModel = trainLogistic(enc.X, y, train);
  const baseline = evaluate(baselineModel, enc.X, y, test, labels, target === 'groundTruth', order);

  onProgress(0.55, 'reweigh');
  const rw = reweighingWeights(labels, y, train);
  const fairModel = trainLogistic(enc.X, y, train, rw.sampleWeights);
  const reweighed = evaluate(fairModel, enc.X, y, test, labels, target === 'groundTruth', order);

  onProgress(0.75, 'proxies');
  const groupCodes = new Map<string, number>();
  const sCodes = new Int32Array(m);
  for (let i = 0; i < m; i++) {
    let c = groupCodes.get(labels[i]);
    if (c === undefined) {
      c = groupCodes.size;
      groupCodes.set(labels[i], c);
    }
    sCodes[i] = c;
  }
  const impRows = test.length > MAX_IMPORTANCE_ROWS ? test.slice(0, MAX_IMPORTANCE_ROWS) : test;
  const importance = permutationImportance(
    baselineModel,
    enc.X,
    y,
    impRows,
    enc.features.map((f) => f.columns),
  );
  const features: FeatureInsight[] = enc.features.map((f, k) => {
    const { table } = contingency(f.codes, sCodes);
    let coefficient = 0;
    for (const c of f.columns) {
      coefficient = Math.max(
        coefficient,
        Math.abs(baselineModel.coef[c] * columnSd(enc.X, c, train)),
      );
    }
    return {
      feature: f.name,
      cramersV: cramersV(table),
      mutualInfo: normalisedMutualInformation(table),
      permutationImportance: importance[k],
      coefficient,
      isProxy: false,
    };
  });
  const ranked = [...features].sort((a, b) => b.permutationImportance - a.permutationImportance);
  const top = new Set(
    ranked
      .slice(0, PROXY_TOP_K)
      .filter((f) => f.permutationImportance > 0.001)
      .map((f) => f.feature),
  );
  for (const f of features) f.isProxy = f.cramersV >= PROXY_ASSOCIATION && top.has(f.feature);
  features.sort((a, b) => b.cramersV - a.cramersV);

  onProgress(1, 'done');
  return {
    attribute,
    target,
    trainSize: train.length,
    testSize: test.length,
    featureCount: enc.features.length,
    droppedFeatures: enc.dropped,
    features,
    baseline,
    reweighed,
    weights: rw.cells.sort((a, b) => a.group.localeCompare(b.group) || a.label - b.label),
  };
}
