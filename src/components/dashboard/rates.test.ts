import { describe, expect, it } from 'vitest';
import { niceTicks } from './rates';

describe('niceTicks', () => {
  it('produces evenly spaced ticks covering the max', () => {
    expect(niceTicks(0.26).ticks).toEqual([0, 0.1, 0.2, 0.3]);
    const { ticks, domain } = niceTicks(0.042, -0.002, 4);
    expect(ticks).toEqual([-0.02, 0, 0.02, 0.04, 0.06]);
    expect(domain).toEqual([-0.02, 0.06]);
  });
});
