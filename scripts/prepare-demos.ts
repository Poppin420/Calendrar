/**
 * Builds the bundled demo files in public/data from the original UCI files.
 *
 *   npx vite-node scripts/prepare-demos.ts -- <adult-all.csv> <german.csv>
 *
 * Sources (mirrors of the UCI Machine Learning Repository):
 *   Adult:  https://archive.ics.uci.edu/dataset/2/adult
 *   German: https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data
 *
 * Besides decoding the files into readable columns, each file gets a
 * `model_decision` column: out-of-fold predictions (5-fold) of a logistic
 * regression that never sees sex, race or age. That lets the demo show
 * error-based metrics (actual outcome vs. model decision).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import Papa from 'papaparse';
import { summarise } from '../src/lib/csv/profile';
import { encodeFeatures } from '../src/lib/ml/encode';
import { logit, trainLogistic } from '../src/lib/ml/logistic';
import { mulberry32, shuffle } from '../src/lib/ml/random';
import type { Dataset } from '../src/lib/types';

const [adultPath, germanPath] = process.argv.slice(2).filter((a) => a !== '--');
if (!adultPath || !germanPath) throw new Error('usage: prepare-demos <adult.csv> <german.csv>');

function readRows(path: string, delimiter: string): string[][] {
  const res = Papa.parse<string[]>(readFileSync(path, 'utf8'), { delimiter, skipEmptyLines: true });
  return res.data.map((r) => r.map((c) => c.trim()));
}

/** Add out-of-fold model predictions as a new column. */
function addModelDecision(
  ds: Dataset,
  target: string,
  favourable: string,
  exclude: string[],
  labels: [string, string],
): Dataset {
  const t = ds.columns.indexOf(target);
  const y = Uint8Array.from(ds.rows, (r) => (r[t] === favourable ? 1 : 0));
  const profiles = summarise(ds).profiles;
  const all = Int32Array.from({ length: ds.rows.length }, (_, i) => i);
  const rand = mulberry32(2024);
  const order = shuffle(Int32Array.from(all), rand);
  const folds = 5;
  const out = new Array<string>(ds.rows.length);
  for (let f = 0; f < folds; f++) {
    const test = order.filter((_, i) => i % folds === f);
    const train = order.filter((_, i) => i % folds !== f);
    const enc = encodeFeatures(ds, profiles, new Set([target, ...exclude]), all, train);
    const model = trainLogistic(enc.X, y, train, undefined, { epochs: 30 });
    for (const r of test) out[r] = logit(model, enc.X, r) >= 0 ? labels[0] : labels[1];
  }
  return {
    ...ds,
    columns: [...ds.columns, 'model_decision'],
    rows: ds.rows.map((r, i) => [...r, out[i]]),
  };
}

function write(path: string, ds: Dataset) {
  writeFileSync(
    path,
    Papa.unparse({ fields: ds.columns, data: ds.rows }, { newline: '\n' }) + '\n',
  );
  console.log(`wrote ${path}: ${ds.rows.length} rows`);
}

// ---------------------------------------------------------------- Adult
{
  const raw = readRows(adultPath, ',').filter((r) => r.length === 15);
  const rand = mulberry32(7);
  const sample = shuffle([...raw], rand).slice(0, 12000);
  const columns = [
    'age',
    'workclass',
    'education',
    'marital_status',
    'occupation',
    'relationship',
    'race',
    'sex',
    'capital_gain',
    'capital_loss',
    'hours_per_week',
    'native_country',
    'income',
  ];
  const rows = sample.map((r) => [
    r[0],
    r[1],
    r[3],
    r[5],
    r[6],
    r[7],
    r[8],
    r[9],
    r[10],
    r[11],
    r[12],
    r[13],
    r[14].replace('.', ''),
  ]);
  const ds = addModelDecision(
    { name: 'adult', columns, rows },
    'income',
    '>50K',
    ['sex', 'race', 'age', 'native_country'],
    ['>50K', '<=50K'],
  );
  write('public/data/adult.csv', ds);
}

// ---------------------------------------------------------------- German
{
  const code: Record<string, string> = {
    A11: '< 0 DM',
    A12: '0–200 DM',
    A13: '≥ 200 DM',
    A14: 'no checking account',
    A30: 'no credits / all paid',
    A31: 'all paid at this bank',
    A32: 'existing paid duly',
    A33: 'delays in the past',
    A34: 'critical account',
    A40: 'car (new)',
    A41: 'car (used)',
    A42: 'furniture / equipment',
    A43: 'radio / TV',
    A44: 'appliances',
    A45: 'repairs',
    A46: 'education',
    A47: 'vacation',
    A48: 'retraining',
    A49: 'business',
    A410: 'other',
    A61: '< 100 DM',
    A62: '100–500 DM',
    A63: '500–1000 DM',
    A64: '≥ 1000 DM',
    A65: 'unknown / none',
    A71: 'unemployed',
    A72: '< 1 year',
    A73: '1–4 years',
    A74: '4–7 years',
    A75: '≥ 7 years',
    A101: 'none',
    A102: 'co-applicant',
    A103: 'guarantor',
    A121: 'real estate',
    A122: 'savings / insurance',
    A123: 'car or other',
    A124: 'unknown / none',
    A141: 'bank',
    A142: 'stores',
    A143: 'none',
    A151: 'rent',
    A152: 'own',
    A153: 'for free',
    A171: 'unskilled non-resident',
    A172: 'unskilled resident',
    A173: 'skilled employee',
    A174: 'management / highly qualified',
    A191: 'no',
    A192: 'yes',
    A201: 'yes',
    A202: 'no',
  };
  const sex: Record<string, string> = {
    A91: 'male',
    A92: 'female',
    A93: 'male',
    A94: 'male',
    A95: 'female',
  };
  const marital: Record<string, string> = {
    A91: 'divorced / separated',
    A92: 'divorced / separated / married',
    A93: 'single',
    A94: 'married / widowed',
    A95: 'single',
  };
  const raw = readRows(germanPath, ',').filter((r) => r.length === 21);
  const columns = [
    'checking_account',
    'duration_months',
    'credit_history',
    'purpose',
    'credit_amount',
    'savings',
    'employment_since',
    'installment_rate',
    'sex',
    'marital_status',
    'other_debtors',
    'residence_since',
    'property',
    'age',
    'other_installment_plans',
    'housing',
    'existing_credits',
    'job',
    'dependents',
    'telephone',
    'foreign_worker',
    'credit_risk',
  ];
  const d = (v: string) => code[v] ?? v;
  const rows = raw.map((r) => [
    d(r[0]),
    r[1],
    d(r[2]),
    d(r[3]),
    r[4],
    d(r[5]),
    d(r[6]),
    r[7],
    sex[r[8]],
    marital[r[8]],
    d(r[9]),
    r[10],
    d(r[11]),
    r[12],
    d(r[13]),
    d(r[14]),
    r[15],
    d(r[16]),
    r[17],
    d(r[18]),
    d(r[19]),
    r[20] === '1' ? 'good' : 'bad',
  ]);
  const ds = addModelDecision(
    { name: 'german', columns, rows },
    'credit_risk',
    'good',
    ['sex', 'age', 'marital_status', 'foreign_worker'],
    ['approve', 'reject'],
  );
  write('public/data/german-credit.csv', ds);
}
