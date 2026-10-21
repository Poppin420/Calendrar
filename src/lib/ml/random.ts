/** Seeded PRNG (mulberry32) so that every run on the same data is reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** In-place Fisher–Yates shuffle. */
export function shuffle<T extends { length: number; [i: number]: unknown }>(
  arr: T,
  rand: () => number,
): T {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Stratified train/test split: each label keeps the same share in both sets.
 * Returns row indices.
 */
export function stratifiedSplit(
  y: ArrayLike<number>,
  testShare: number,
  rand: () => number,
): { train: Int32Array; test: Int32Array } {
  const byClass: number[][] = [[], []];
  for (let i = 0; i < y.length; i++) byClass[y[i] === 1 ? 1 : 0].push(i);
  const train: number[] = [];
  const test: number[] = [];
  for (const rows of byClass) {
    shuffle(rows, rand);
    const nTest = Math.round(rows.length * testShare);
    test.push(...rows.slice(0, nTest));
    train.push(...rows.slice(nTest));
  }
  return { train: shuffle(Int32Array.from(train), rand), test: Int32Array.from(test) };
}
