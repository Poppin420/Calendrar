/**
 * Association between two categorical variables, used to spot proxies:
 * features that carry information about the sensitive attribute.
 */

/** Contingency table of two integer-coded variables. */
export function contingency(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
  rows?: ArrayLike<number>,
): { table: number[][]; n: number } {
  const idx = rows ?? Array.from({ length: a.length }, (_, i) => i);
  let ka = 0;
  let kb = 0;
  for (let i = 0; i < idx.length; i++) {
    ka = Math.max(ka, a[idx[i]] + 1);
    kb = Math.max(kb, b[idx[i]] + 1);
  }
  const table = Array.from({ length: ka }, () => new Array<number>(kb).fill(0));
  for (let i = 0; i < idx.length; i++) table[a[idx[i]]][b[idx[i]]]++;
  return { table, n: idx.length };
}

function margins(table: number[][]): { row: number[]; col: number[] } {
  const row = table.map((r) => r.reduce((s, x) => s + x, 0));
  const col = table[0]?.map((_, j) => table.reduce((s, r) => s + r[j], 0)) ?? [];
  return { row, col };
}

/**
 * Cramér's V = √( χ² / (n · (min(r, c) − 1)) ), in [0, 1].
 * Empty rows/columns are ignored. Returns 0 when either variable is constant.
 */
export function cramersV(table: number[][]): number {
  const { row, col } = margins(table);
  const n = row.reduce((s, x) => s + x, 0);
  const r = row.filter((x) => x > 0).length;
  const c = col.filter((x) => x > 0).length;
  if (n === 0 || r < 2 || c < 2) return 0;
  let chi2 = 0;
  for (let i = 0; i < table.length; i++) {
    if (row[i] === 0) continue;
    for (let j = 0; j < col.length; j++) {
      if (col[j] === 0) continue;
      const expected = (row[i] * col[j]) / n;
      chi2 += (table[i][j] - expected) ** 2 / expected;
    }
  }
  return Math.min(1, Math.sqrt(chi2 / (n * (Math.min(r, c) - 1))));
}

function entropy(counts: number[], n: number): number {
  let h = 0;
  for (const c of counts) if (c > 0) h -= (c / n) * Math.log(c / n);
  return h;
}

/**
 * Mutual information I(A; B) in nats.
 */
export function mutualInformation(table: number[][]): number {
  const { row, col } = margins(table);
  const n = row.reduce((s, x) => s + x, 0);
  if (n === 0) return 0;
  let mi = 0;
  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < col.length; j++) {
      const p = table[i][j] / n;
      if (p > 0) mi += p * Math.log(p / ((row[i] / n) * (col[j] / n)));
    }
  }
  return Math.max(0, mi);
}

/**
 * Normalised mutual information I(A; B) / H(B): the share of the uncertainty
 * about B (the sensitive attribute, columns of the table) that A explains.
 */
export function normalisedMutualInformation(table: number[][]): number {
  const { col } = margins(table);
  const n = col.reduce((s, x) => s + x, 0);
  const hb = entropy(col, n);
  return hb === 0 ? 0 : Math.min(1, mutualInformation(table) / hb);
}
