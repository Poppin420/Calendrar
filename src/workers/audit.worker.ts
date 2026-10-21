/// <reference lib="webworker" />
/**
 * Analysis worker: parses the CSV and runs every computation off the main
 * thread so the UI stays responsive with large files.
 */

import { groupOf, suggestBins, toNumber } from '../lib/binning';
import { CsvError, parseCsvText } from '../lib/csv/parse';
import { column, isIntegerColumn, summarise } from '../lib/csv/profile';
import { runAudit } from '../lib/metrics/audit';
import { DeeperError, runDeeper } from '../lib/ml/deeper';
import type { Dataset, DatasetSummary } from '../lib/types';
import type { RequestMessage, Requests, RequestType, ResponseMessage } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

let dataset: Dataset | null = null;
let summary: DatasetSummary | null = null;

function load(text: string, name: string): DatasetSummary {
  const { dataset: ds, raggedRows } = parseCsvText(text, name);
  dataset = ds;
  summary = summarise(ds, raggedRows);
  return summary;
}

function requireData(): Dataset {
  if (!dataset) throw new Error('No dataset loaded');
  return dataset;
}

type Handlers = {
  [K in RequestType]: (args: Requests[K]['args'], id: number) => Requests[K]['result'];
};

function readFile(file: File): string {
  return new FileReaderSync().readAsText(file);
}

const handlers: Handlers = {
  loadText: ({ text, name }) => load(text, name),
  loadFile: ({ file }) => load(readFile(file), file.name),
  groupSizes: ({ spec }) => {
    const values = column(requireData(), spec.column);
    const counts = new Map<string, number>();
    let missing = 0;
    for (const v of values) {
      const g = groupOf(v, spec);
      if (g === null) missing++;
      else counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return { groups: [...counts].map(([group, count]) => ({ group, count })), missing };
  },
  suggestBins: ({ column: name }) => {
    const values = column(requireData(), name);
    const nums = values.map(toNumber).filter((v): v is number => v !== null);
    return { edges: suggestBins(name, nums), integer: isIntegerColumn(values) };
  },
  audit: ({ config }) => runAudit(requireData(), config),
  deeper: ({ config, attributeIndex }, id) =>
    runDeeper(requireData(), summary!.profiles, config, attributeIndex, (fraction, stage) =>
      post({ id, kind: 'progress', fraction, stage }),
    ),
};

function post(msg: ResponseMessage) {
  self.postMessage(msg);
}

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  const msg = event.data;
  try {
    const handler = handlers[msg.type] as (args: unknown, id: number) => unknown;
    const result = handler(msg.args, msg.id);
    post({ id: msg.id, kind: 'result', result });
  } catch (err) {
    const code = err instanceof CsvError || err instanceof DeeperError ? err.code : 'unknown';
    post({
      id: msg.id,
      kind: 'error',
      error: { code, message: err instanceof Error ? err.message : String(err) },
    });
  }
};
