/**
 * Promise-based client for the analysis worker.
 */

import type {
  RequestMessage,
  Requests,
  RequestType,
  ResponseMessage,
  WorkerErrorInfo,
} from './protocol';

export class WorkerError extends Error {
  constructor(public readonly info: WorkerErrorInfo) {
    super(info.message);
  }
}

interface Pending {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  onProgress?: (fraction: number, stage: string) => void;
}

export class AnalysisClient {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  constructor() {
    this.worker = new Worker(new URL('./audit.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<ResponseMessage>) => this.handle(e.data);
    this.worker.onerror = (e) => {
      const err = new WorkerError({ code: 'unknown', message: e.message || 'Worker crashed' });
      for (const p of this.pending.values()) p.reject(err);
      this.pending.clear();
    };
  }

  private handle(msg: ResponseMessage) {
    const p = this.pending.get(msg.id);
    if (!p) return;
    if (msg.kind === 'progress') {
      p.onProgress?.(msg.fraction, msg.stage);
      return;
    }
    this.pending.delete(msg.id);
    if (msg.kind === 'result') p.resolve(msg.result);
    else p.reject(new WorkerError(msg.error));
  }

  request<K extends RequestType>(
    type: K,
    args: Requests[K]['args'],
    onProgress?: (fraction: number, stage: string) => void,
  ): Promise<Requests[K]['result']> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress });
      this.worker.postMessage({ id, type, args } as RequestMessage);
    });
  }
}

let client: AnalysisClient | null = null;

/** Lazily created singleton. */
export function analysis(): AnalysisClient {
  client ??= new AnalysisClient();
  return client;
}
