import { describe, expect, it } from 'vitest';
import { CsvError, cleanHeaders, parseCsvText } from './parse';
import { normaliseCell, profileColumn, summarise } from './profile';

describe('parseCsvText', () => {
  it('parses comma separated data and normalises missing values', () => {
    const { dataset } = parseCsvText('a,b\n1,x\n2,NA\n', 'f');
    expect(dataset.columns).toEqual(['a', 'b']);
    expect(dataset.rows).toEqual([
      ['1', 'x'],
      ['2', null],
    ]);
  });
  it('detects semicolons (common in Greek/European Excel exports)', () => {
    const { dataset } = parseCsvText('φύλο;απόφαση\nΓ;ναι\nΑ;όχι\n', 'f');
    expect(dataset.columns).toEqual(['φύλο', 'απόφαση']);
    expect(dataset.rows[0]).toEqual(['Γ', 'ναι']);
  });
  it('strips a UTF-8 BOM', () => {
    expect(parseCsvText('﻿a,b\n1,2', 'f').dataset.columns[0]).toBe('a');
  });
  it('rejects empty files', () => {
    expect(() => parseCsvText('  ', 'f')).toThrow(CsvError);
  });
  it('rejects a header without rows', () => {
    expect(() => parseCsvText('a,b\n', 'f')).toThrow(CsvError);
  });
  it('rejects a single column', () => {
    expect(() => parseCsvText('a\n1\n2', 'f')).toThrow(CsvError);
  });
  it('counts ragged rows', () => {
    expect(parseCsvText('a,b\n1,2\n3\n4,5\n', 'f').raggedRows).toBe(1);
  });
  it('makes headers unique', () => {
    expect(cleanHeaders(['x', '', 'x'])).toEqual(['x', 'column_2', 'x_2']);
  });
});

describe('profiling', () => {
  it('normalises missing tokens', () => {
    expect(normaliseCell(' ? ')).toBeNull();
    expect(normaliseCell(' ok ')).toBe('ok');
  });
  it('detects column kinds', () => {
    expect(profileColumn('age', ['20', '30', '40', null]).kind).toBe('numeric');
    expect(profileColumn('sex', ['M', 'F', 'M']).kind).toBe('binary');
    expect(profileColumn('c', ['x', 'x']).kind).toBe('constant');
    expect(profileColumn('job', ['a', 'b', 'c', 'a']).kind).toBe('categorical');
    const ids = Array.from({ length: 100 }, (_, i) => `u${i}`);
    expect(profileColumn('name', ids).kind).toBe('identifier');
  });
  it('reports data-quality warnings', () => {
    const rows = Array.from({ length: 120 }, (_, i) => [
      i % 10 === 0 ? null : 'v',
      i < 5 ? 'rare' : 'common',
      '1',
    ]);
    const s = summarise({ name: 'f', columns: ['m', 'g', 'k'], rows });
    const codes = s.warnings.map((w) => `${w.code}:${w.column ?? ''}`);
    expect(codes).toContain('missingValues:m');
    expect(codes).toContain('tinyGroup:g');
    expect(codes).toContain('constantColumn:k');
  });
});
