import { describe, expect, it } from 'vitest';
import {
  contingency,
  cramersV,
  mutualInformation,
  normalisedMutualInformation,
} from './association';
import { accuracyOf, permutationImportance } from './importance';
import { sigmoid, trainLogistic, type Matrix } from './logistic';
import { mulberry32, stratifiedSplit } from './random';
import { reweighingWeights } from './reweighing';
import { runDeeper } from './deeper';
import { summarise } from '../csv/profile';
import type { Dataset } from '../types';

describe('association measures', () => {
  it("Cramér's V is 1 for a perfect association and 0 for independence", () => {
    expect(
      cramersV([
        [10, 0],
        [0, 10],
      ]),
    ).toBeCloseTo(1);
    expect(
      cramersV([
        [5, 5],
        [5, 5],
      ]),
    ).toBeCloseTo(0);
  });
  it("matches a hand-computed Cramér's V", () => {
    // χ² for [[20,10],[10,20]] = 60·(400−100)²/(30·30·30·30) = 6.667, V = √(6.667/60) = 0.3333
    expect(
      cramersV([
        [20, 10],
        [10, 20],
      ]),
    ).toBeCloseTo(1 / 3, 4);
  });
  it('handles a constant variable', () => {
    expect(cramersV([[10, 10]])).toBe(0);
    expect(normalisedMutualInformation([[10, 10]])).toBe(0);
  });
  it('mutual information equals the entropy for identical variables', () => {
    expect(
      mutualInformation([
        [50, 0],
        [0, 50],
      ]),
    ).toBeCloseTo(Math.log(2));
    expect(
      normalisedMutualInformation([
        [50, 0],
        [0, 50],
      ]),
    ).toBeCloseTo(1);
  });
  it('builds contingency tables', () => {
    expect(contingency([0, 1, 1], [1, 0, 1]).table).toEqual([
      [0, 1],
      [1, 1],
    ]);
  });
});

describe('reweighing', () => {
  it('makes group and label independent in the weighted data', () => {
    // group a: 8 positives / 2 negatives, group b: 2 / 8
    const groups = [...Array(10).fill('a'), ...Array(10).fill('b')];
    const y = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];
    const rows = Array.from({ length: 20 }, (_, i) => i);
    const { cells, sampleWeights } = reweighingWeights(groups, y, rows);
    // w(a, 1) = (10 · 10) / (20 · 8) = 0.625; w(b, 1) = (10 · 10) / (20 · 2) = 2.5
    expect(cells.find((c) => c.group === 'a' && c.label === 1)!.weight).toBeCloseTo(0.625);
    expect(cells.find((c) => c.group === 'b' && c.label === 1)!.weight).toBeCloseTo(2.5);
    const weightedRate = (g: string) => {
      let pos = 0;
      let all = 0;
      rows.forEach((r) => {
        if (groups[r] !== g) return;
        all += sampleWeights[r];
        pos += y[r] * sampleWeights[r];
      });
      return pos / all;
    };
    expect(weightedRate('a')).toBeCloseTo(0.5);
    expect(weightedRate('b')).toBeCloseTo(0.5);
  });
});

describe('logistic regression', () => {
  it('is numerically stable', () => {
    expect(sigmoid(1000)).toBe(1);
    expect(sigmoid(-1000)).toBe(0);
    expect(sigmoid(0)).toBe(0.5);
  });

  it('learns a linearly separable problem and ranks the informative feature first', () => {
    const rand = mulberry32(1);
    const n = 600;
    const data = new Float64Array(n * 2);
    const y = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const signal = rand() * 2 - 1;
      data[i * 2] = signal;
      data[i * 2 + 1] = rand() * 2 - 1; // noise
      y[i] = signal > 0 ? 1 : 0;
    }
    const X: Matrix = { data, rows: n, cols: 2 };
    const { train, test } = stratifiedSplit(y, 0.3, rand);
    const model = trainLogistic(X, y, train);
    expect(accuracyOf(model, X, y, test)).toBeGreaterThan(0.95);
    const [signal, noise] = permutationImportance(model, X, y, test, [[0], [1]]);
    expect(signal).toBeGreaterThan(0.3);
    expect(Math.abs(noise)).toBeLessThan(0.05);
  });

  it('stratified split keeps class shares', () => {
    const y = Uint8Array.from({ length: 100 }, (_, i) => (i < 20 ? 1 : 0));
    const { train, test } = stratifiedSplit(y, 0.3, mulberry32(3));
    expect(test.length).toBe(30);
    expect(Array.from(test).filter((i) => y[i] === 1).length).toBe(6);
    expect(train.length + test.length).toBe(100);
  });
});

describe('runDeeper', () => {
  it('finds a proxy and reduces disparity with reweighing', () => {
    const rand = mulberry32(5);
    const rows: (string | null)[][] = [];
    for (let i = 0; i < 2000; i++) {
      const female = rand() < 0.5;
      // "role" agrees with sex 90% of the time: a proxy.
      const role = rand() < 0.9 ? (female ? 'wife' : 'husband') : female ? 'husband' : 'wife';
      const skill = rand();
      const p = 0.2 + 0.5 * skill + (role === 'husband' ? 0.25 : -0.1);
      rows.push([female ? 'F' : 'M', role, skill.toFixed(3), rand() < p ? 'yes' : 'no']);
    }
    const ds: Dataset = { name: 'syn', columns: ['sex', 'role', 'skill', 'approved'], rows };
    const res = runDeeper(
      ds,
      summarise(ds).profiles,
      { decisionColumn: 'approved', favorableValues: ['yes'], sensitive: [{ column: 'sex' }] },
      0,
    );
    const role = res.features.find((f) => f.feature === 'role')!;
    expect(role.cramersV).toBeGreaterThan(0.7);
    expect(role.isProxy).toBe(true);
    expect(res.features.find((f) => f.feature === 'skill')!.isProxy).toBe(false);
    expect(res.features.some((f) => f.feature === 'sex')).toBe(false);
    const before = res.baseline.disparateImpact.ratio!.value!;
    const after = res.reweighed.disparateImpact.ratio!.value!;
    expect(after).toBeGreaterThan(before);
  });
});
