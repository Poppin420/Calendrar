/**
 * Bundled demo datasets (files in /public/data). See scripts/prepare-demos.ts
 * for how they were derived from the UCI originals.
 */

import type { MessageKey } from '../i18n';
import type { AuditConfig } from '../lib/types';

export interface Demo {
  id: 'adult' | 'german';
  file: string;
  rows: number;
  nameKey: MessageKey;
  descriptionKey: MessageKey;
  lookFor: MessageKey[];
  sourceLabel: string;
  sourceUrl: string;
  citation: string;
  config: AuditConfig;
}

export const DEMOS: Demo[] = [
  {
    id: 'adult',
    file: '/data/adult.csv',
    rows: 12000,
    nameKey: 'demo.adultName',
    descriptionKey: 'demo.adultDescription',
    lookFor: ['demo.adultLook1', 'demo.adultLook2', 'demo.adultLook3'],
    sourceLabel: 'UCI Machine Learning Repository: Adult',
    sourceUrl: 'https://archive.ics.uci.edu/dataset/2/adult',
    citation: 'Becker, B. & Kohavi, R. (1996). Adult. UCI Machine Learning Repository. CC BY 4.0.',
    config: {
      decisionColumn: 'model_decision',
      favorableValues: ['>50K'],
      groundTruthColumn: 'income',
      groundTruthFavorableValues: ['>50K'],
      sensitive: [{ column: 'sex' }, { column: 'age', binEdges: [25, 40, 60], integer: true }],
    },
  },
  {
    id: 'german',
    file: '/data/german-credit.csv',
    rows: 1000,
    nameKey: 'demo.germanName',
    descriptionKey: 'demo.germanDescription',
    lookFor: ['demo.germanLook1', 'demo.germanLook2', 'demo.germanLook3'],
    sourceLabel: 'UCI Machine Learning Repository: Statlog (German Credit Data)',
    sourceUrl: 'https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data',
    citation:
      'Hofmann, H. (1994). Statlog (German Credit Data). UCI Machine Learning Repository. CC BY 4.0.',
    config: {
      decisionColumn: 'model_decision',
      favorableValues: ['approve'],
      groundTruthColumn: 'credit_risk',
      groundTruthFavorableValues: ['good'],
      sensitive: [{ column: 'age', binEdges: [25], integer: true }, { column: 'sex' }],
    },
  },
];
