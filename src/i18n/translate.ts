import { el } from './el';
import { en } from './en';
import type { Lang, MessageKey, Messages, Params } from './types';

export const MESSAGES: Record<Lang, Messages> = { el, en };

export const LOCALES: Record<Lang, string> = { el: 'el-GR', en: 'en-GB' };

/** Look up a key and fill {placeholders}. Missing keys return the key itself. */
export function translate(lang: Lang, key: MessageKey, params?: Params): string {
  let node: unknown = MESSAGES[lang];
  for (const part of key.split('.')) {
    node =
      typeof node === 'object' && node !== null
        ? (node as Record<string, unknown>)[part]
        : undefined;
  }
  const template = typeof node === 'string' ? node : key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? String(params[name]) : m,
  );
}

export interface Formatters {
  /** 0.1234 → "12.3%" / "12,3%" */
  pct: (v: number | null | undefined, digits?: number) => string;
  /** Percentage points: 0.1234 → "12.3" */
  pts: (v: number | null | undefined, digits?: number) => string;
  num: (v: number | null | undefined, digits?: number) => string;
  int: (v: number) => string;
  date: (iso: string) => string;
  list: (items: string[]) => string;
}

export function formatters(lang: Lang): Formatters {
  const locale = LOCALES[lang];
  const dash = '–';
  return {
    pct: (v, digits = 1) =>
      v === null || v === undefined || !Number.isFinite(v)
        ? dash
        : new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          }).format(v),
    pts: (v, digits = 1) =>
      v === null || v === undefined || !Number.isFinite(v)
        ? dash
        : new Intl.NumberFormat(locale, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
            signDisplay: 'auto',
          }).format(Math.abs(v * 100) < 0.5 * 10 ** -digits ? 0 : v * 100),
    num: (v, digits = 2) =>
      v === null || v === undefined || !Number.isFinite(v)
        ? dash
        : new Intl.NumberFormat(locale, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          }).format(v),
    int: (v) => new Intl.NumberFormat(locale).format(v),
    date: (iso) =>
      new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
        new Date(iso),
      ),
    list: (items) =>
      new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items),
  };
}
