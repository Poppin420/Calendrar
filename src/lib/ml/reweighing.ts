/**
 * Reweighing (Kamiran & Calders, 2012): give every (group, label) cell the
 * weight that would make group and label statistically independent:
 *
 *   w(s, y) = P(S = s) · P(Y = y) / P(S = s, Y = y)
 *           = (|S = s| · |Y = y|) / (n · |S = s, Y = y|)
 *
 * Under-represented combinations (e.g. favorable outcomes for a group that
 * rarely gets them) get weights above 1, over-represented ones below 1.
 *
 * Reference: Kamiran, F., & Calders, T. (2012). Data preprocessing techniques
 * for classification without discrimination. Knowledge and Information
 * Systems 33(1).
 */
export interface ReweighingCell {
  group: string;
  label: 0 | 1;
  weight: number;
}

export function reweighingWeights(
  groups: readonly string[],
  y: ArrayLike<number>,
  rows: ArrayLike<number>,
): { cells: ReweighingCell[]; sampleWeights: Float64Array } {
  const n = rows.length;
  const gCount = new Map<string, number>();
  const yCount = [0, 0];
  const cell = new Map<string, number>();
  const key = (g: string, l: number) => `${l}\u0000${g}`;
  for (let i = 0; i < n; i++) {
    const r = rows[i];
    const l = y[r] === 1 ? 1 : 0;
    gCount.set(groups[r], (gCount.get(groups[r]) ?? 0) + 1);
    yCount[l]++;
    cell.set(key(groups[r], l), (cell.get(key(groups[r], l)) ?? 0) + 1);
  }
  const weightOf = (g: string, l: number): number => {
    const c = cell.get(key(g, l)) ?? 0;
    return c === 0 ? 0 : ((gCount.get(g) ?? 0) * yCount[l]) / (n * c);
  };
  const sampleWeights = new Float64Array(groups.length);
  for (let i = 0; i < n; i++) {
    const r = rows[i];
    sampleWeights[r] = weightOf(groups[r], y[r] === 1 ? 1 : 0);
  }
  const cells: ReweighingCell[] = [];
  for (const g of gCount.keys()) {
    for (const l of [0, 1] as const) {
      if (cell.has(key(g, l))) cells.push({ group: g, label: l, weight: weightOf(g, l) });
    }
  }
  return { cells, sampleWeights };
}
