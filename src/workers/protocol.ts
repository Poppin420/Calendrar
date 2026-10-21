/**
 * Typed message protocol between the UI and the analysis worker.
 * The dataset itself stays inside the worker; only summaries travel back.
 */

import type {
  AuditConfig,
  AuditResult,
  DatasetSummary,
  DeeperResult,
  SensitiveSpec,
} from '../lib/types';

export interface GroupCount {
  group: string;
  count: number;
}

export interface Requests {
  loadText: { args: { text: string; name: string }; result: DatasetSummary };
  loadFile: { args: { file: File }; result: DatasetSummary };
  groupSizes: { args: { spec: SensitiveSpec }; result: { groups: GroupCount[]; missing: number } };
  suggestBins: { args: { column: string }; result: { edges: number[]; integer: boolean } };
  audit: { args: { config: AuditConfig }; result: AuditResult };
  deeper: { args: { config: AuditConfig; attributeIndex: number }; result: DeeperResult };
}

export type RequestType = keyof Requests;

export type RequestMessage = {
  [K in RequestType]: { id: number; type: K; args: Requests[K]['args'] };
}[RequestType];

export interface WorkerErrorInfo {
  /** Machine-readable code (CsvError / DeeperError codes, or "unknown"). */
  code: string;
  message: string;
}

export type ResponseMessage =
  | { id: number; kind: 'result'; result: unknown }
  | { id: number; kind: 'error'; error: WorkerErrorInfo }
  | { id: number; kind: 'progress'; fraction: number; stage: string };
