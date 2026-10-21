import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Demo } from '../data/demos';
import type { MessageKey } from '../i18n';
import type { AuditConfig, AuditResult, DatasetSummary, DeeperResult } from '../lib/types';
import { analysis, WorkerError } from '../workers/client';

export type Step = 'landing' | 'upload' | 'mapping' | 'results';

export interface UiError {
  key: MessageKey;
  params?: Record<string, string>;
}

export interface DeeperState {
  attributeIndex: number;
  running: boolean;
  progress: number;
  stage: string;
  result?: DeeperResult;
  error?: UiError;
}

interface AuditState {
  step: Step;
  summary?: DatasetSummary;
  demo?: Demo;
  parsing?: string;
  auditing: boolean;
  error?: UiError;
  config?: AuditConfig;
  result?: AuditResult;
  deeper?: DeeperState;
}

interface AuditActions {
  goTo: (step: Step) => void;
  loadFile: (file: File) => Promise<void>;
  loadDemo: (demo: Demo) => Promise<void>;
  run: (config: AuditConfig) => Promise<void>;
  runDeeper: (attributeIndex: number) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

const CSV_CODES = new Set(['empty', 'noHeader', 'oneColumn', 'tooLarge', 'malformed']);
const DEEPER_CODES: Record<string, MessageKey> = {
  noFeatures: 'deeper.errNoFeatures',
  singleClass: 'deeper.errSingleClass',
  tooFewRows: 'deeper.errTooFewRows',
};

function toUiError(err: unknown): UiError {
  if (err instanceof WorkerError) {
    if (CSV_CODES.has(err.info.code)) return { key: `errors.${err.info.code}` as MessageKey };
    if (DEEPER_CODES[err.info.code]) return { key: DEEPER_CODES[err.info.code] };
  }
  return {
    key: 'errors.worker',
    params: { message: err instanceof Error ? err.message : String(err) },
  };
}

const Ctx = createContext<(AuditState & AuditActions) | null>(null);

const initial: AuditState = { step: 'landing', auditing: false };

export function AuditProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuditState>(initial);
  // Guards against out-of-order responses when the user acts quickly.
  const generation = useRef(0);

  const goTo = useCallback((step: Step) => {
    setState((s) => ({ ...s, step, error: undefined }));
    window.scrollTo({ top: 0 });
  }, []);

  const ingest = useCallback(
    async (load: () => Promise<DatasetSummary>, name: string, demo?: Demo) => {
      const gen = ++generation.current;
      setState((s) => ({ ...s, step: 'upload', parsing: name, error: undefined }));
      try {
        const summary = await load();
        if (gen !== generation.current) return;
        setState({
          step: 'upload',
          summary,
          demo,
          auditing: false,
          config: demo?.config,
        });
      } catch (err) {
        if (gen !== generation.current) return;
        setState((s) => ({ ...s, parsing: undefined, summary: undefined, error: toUiError(err) }));
      }
    },
    [],
  );

  const loadFile = useCallback(
    (file: File) => ingest(() => analysis().request('loadFile', { file }), file.name),
    [ingest],
  );

  const loadDemo = useCallback(
    (demo: Demo) =>
      ingest(
        async () => {
          const res = await fetch(demo.file);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          return analysis().request('loadText', {
            text,
            name: demo.file.split('/').pop() ?? demo.id,
          });
        },
        demo.file.split('/').pop() ?? demo.id,
        demo,
      ).then(() => undefined),
    [ingest],
  );

  const run = useCallback(async (config: AuditConfig) => {
    const gen = ++generation.current;
    setState((s) => ({
      ...s,
      step: 'results',
      config,
      auditing: true,
      error: undefined,
      result: undefined,
      deeper: undefined,
    }));
    window.scrollTo({ top: 0 });
    try {
      const result = await analysis().request('audit', { config });
      if (gen !== generation.current) return;
      setState((s) => ({ ...s, result, auditing: false }));
    } catch (err) {
      if (gen !== generation.current) return;
      setState((s) => ({ ...s, auditing: false, error: toUiError(err) }));
    }
  }, []);

  const runDeeper = useCallback(
    async (attributeIndex: number) => {
      const config = state.config;
      if (!config) return;
      setState((s) => ({
        ...s,
        deeper: { attributeIndex, running: true, progress: 0, stage: 'prepare' },
      }));
      try {
        const result = await analysis().request(
          'deeper',
          { config, attributeIndex },
          (progress, stage) =>
            setState((s) =>
              s.deeper?.running ? { ...s, deeper: { ...s.deeper, progress, stage } } : s,
            ),
        );
        setState((s) => ({
          ...s,
          deeper: { attributeIndex, running: false, progress: 1, stage: 'done', result },
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          deeper: {
            attributeIndex,
            running: false,
            progress: 0,
            stage: 'prepare',
            error: toUiError(err),
          },
        }));
      }
    },
    [state.config],
  );

  const reset = useCallback(() => {
    generation.current++;
    setState({ ...initial, step: 'upload' });
    window.scrollTo({ top: 0 });
  }, []);

  const clearError = useCallback(() => setState((s) => ({ ...s, error: undefined })), []);

  const value = useMemo(
    () => ({ ...state, goTo, loadFile, loadDemo, run, runDeeper, reset, clearError }),
    [state, goTo, loadFile, loadDemo, run, runDeeper, reset, clearError],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAudit() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudit must be used inside AuditProvider');
  return ctx;
}
