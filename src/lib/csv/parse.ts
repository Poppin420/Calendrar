/**
 * CSV parsing with Papa Parse. Runs inside the worker.
 */

import Papa from 'papaparse';
import type { Dataset } from '../types';
import { normaliseCell } from './profile';

export const MAX_ROWS = 200_000;

export class CsvError extends Error {
  constructor(
    public readonly code: 'empty' | 'noHeader' | 'oneColumn' | 'tooLarge' | 'malformed',
    message?: string,
  ) {
    super(message ?? code);
  }
}

export interface ParseOutcome {
  dataset: Dataset;
  raggedRows: number;
}

/** Make header names unique and non-empty ("", "a", "a" → "column_1", "a", "a_2"). */
export function cleanHeaders(raw: readonly unknown[]): string[] {
  const seen = new Map<string, number>();
  return raw.map((h, i) => {
    let name = String(h ?? '').trim() || `column_${i + 1}`;
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count > 0) name = `${name}_${count + 1}`;
    return name;
  });
}

export function parseCsvText(text: string, name: string): ParseOutcome {
  const trimmed = text.replace(/^\uFEFF/, '');
  if (trimmed.trim() === '') throw new CsvError('empty');
  const result = Papa.parse<unknown[]>(trimmed, {
    header: false,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    delimitersToGuess: [',', ';', '\t', '|'],
  });
  const data = result.data;
  if (data.length < 2) throw new CsvError(data.length === 0 ? 'empty' : 'noHeader');
  if (data.length - 1 > MAX_ROWS) throw new CsvError('tooLarge');
  const columns = cleanHeaders(data[0]);
  if (columns.length < 2) throw new CsvError('oneColumn');
  let ragged = 0;
  const rows = new Array(data.length - 1);
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (r.length !== columns.length) ragged++;
    const row = new Array(columns.length);
    for (let j = 0; j < columns.length; j++) row[j] = normaliseCell(r[j]);
    rows[i - 1] = row;
  }
  if (ragged > 0.5 * rows.length) throw new CsvError('malformed');
  return { dataset: { name, columns, rows }, raggedRows: ragged };
}
