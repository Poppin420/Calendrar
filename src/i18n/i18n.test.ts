import { describe, expect, it } from 'vitest';
import { el } from './el';
import { en } from './en';
import { formatters, translate } from './translate';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : keys(v as object, `${prefix}${k}.`),
  );
}

function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

describe('i18n', () => {
  it('Greek and English have the same keys', () => {
    expect(keys(el).sort()).toEqual(keys(en).sort());
  });

  it('every translation uses the same placeholders in both languages', () => {
    for (const key of keys(en)) {
      const e = translate('en', key as never);
      const g = translate('el', key as never);
      expect(placeholders(g), key).toEqual(placeholders(e));
      expect(g.trim(), key).not.toBe('');
    }
  });

  it('fills placeholders', () => {
    expect(translate('en', 'demo.rows', { n: 5 })).toBe('5 rows');
    expect(translate('el', 'demo.rows', { n: 5 })).toBe('5 γραμμές');
  });

  it('formats numbers per locale', () => {
    expect(formatters('en').pct(0.1234)).toBe('12.3%');
    expect(formatters('el').num(0.5)).toBe('0,50');
    expect(formatters('en').pct(null)).toBe('–');
  });
});
