import { useId, useRef, useState, type DragEvent } from 'react';
import { useI18n } from '../../i18n';
import type { DataWarning, DatasetSummary } from '../../lib/types';
import { useAudit } from '../AuditContext';
import { DemoPicker } from '../DemoPicker';
import { Callout } from '../ui/Callout';
import { Icon } from '../ui/Icon';
import { SkeletonBlock, SkeletonLines } from '../ui/Skeleton';

function isCsv(file: File) {
  return (
    /\.(csv|txt|tsv)$/i.test(file.name) || file.type === 'text/csv' || file.type === 'text/plain'
  );
}

function Dropzone() {
  const { t } = useI18n();
  const { loadFile } = useAudit();
  const [active, setActive] = useState(false);
  const [typeError, setTypeError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();

  const handle = (file: File | undefined) => {
    if (!file) return;
    if (!isCsv(file)) {
      setTypeError(true);
      return;
    }
    setTypeError(false);
    void loadFile(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setActive(false);
    handle(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`dropzone${active ? ' active' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={onDrop}
    >
      <Icon name="upload" size={36} />
      <h3>{active ? t('upload.dropActive') : t('upload.dropTitle')}</h3>
      <p className="muted">{t('upload.dropOr')}</p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => input.current?.click()}
        aria-describedby={hintId}
      >
        <Icon name="file" />
        {t('upload.browse')}
      </button>
      <input
        ref={input}
        type="file"
        accept=".csv,.txt,.tsv,text/csv,text/plain"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <p id={hintId} className="help">
        {t('upload.dropHint')}
      </p>
      {typeError && (
        <p className="field-error" role="alert">
          <Icon name="alert" size={16} />
          {t('errors.notCsv')}
        </p>
      )}
    </div>
  );
}

function WarningItem({ w }: { w: DataWarning }) {
  const { t } = useI18n();
  const tone = w.code === 'identifierColumn' ? 'info' : 'warn';
  return (
    <li>
      <Callout tone={tone}>
        <p>
          {t(`warnings.${w.code}`, {
            column: w.column ?? '',
            value: w.value ?? '',
            detail:
              w.detail && w.detail.length > 80 ? `${w.detail.slice(0, 80)}…` : (w.detail ?? ''),
          })}
        </p>
      </Callout>
    </li>
  );
}

function Preview({ summary }: { summary: DatasetSummary }) {
  const { t, f } = useI18n();
  return (
    <>
      <section
        className="section"
        aria-labelledby="preview-title"
        style={{ paddingTop: 'var(--space-5)' }}
      >
        <h3 id="preview-title">{t('upload.previewTitle')}</h3>
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="preview-title">
          <table className="preview-table">
            <caption>{t('upload.previewCaption', { name: summary.name })}</caption>
            <thead>
              <tr>
                {summary.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.preview.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={cell === null ? 'missing-cell' : undefined}
                      title={cell ?? undefined}
                    >
                      {cell ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="section"
        aria-labelledby="quality-title"
        style={{ paddingTop: 'var(--space-5)' }}
      >
        <h3 id="quality-title">{t('upload.qualityTitle')}</h3>
        {summary.warnings.length === 0 ? (
          <Callout tone="ok">
            <p>{t('upload.qualityNone')}</p>
          </Callout>
        ) : (
          <ul className="warning-list">
            {summary.warnings.map((w, i) => (
              <WarningItem key={`${w.code}-${w.column ?? i}`} w={w} />
            ))}
          </ul>
        )}
      </section>

      <section
        className="section"
        aria-labelledby="columns-title"
        style={{ paddingTop: 'var(--space-5)' }}
      >
        <h3 id="columns-title">{t('upload.columnsTitle')}</h3>
        <ul className="column-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {summary.profiles.map((p) => (
            <li key={p.name} className="column-chip">
              <strong>{p.name}</strong>
              <span className="kind-tag">{t(`kinds.${p.kind}`)}</span>
              <span className="muted">
                {p.kind === 'numeric' && p.min !== undefined
                  ? t('upload.range', { min: f.num(p.min, 0), max: f.num(p.max ?? p.min, 0) })
                  : t('upload.uniqueShort', { n: f.int(p.unique) })}
                {p.missing > 0 && ` · ${t('upload.missingShort', { n: f.int(p.missing) })}`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function UploadStep() {
  const { t, f } = useI18n();
  const { summary, parsing, error, goTo, reset, clearError } = useAudit();

  if (parsing && !summary) {
    return (
      <div aria-busy="true">
        <h2>{t('upload.title')}</h2>
        <p role="status">{t('upload.reading', { name: parsing })}</p>
        <SkeletonLines lines={2} />
        <SkeletonBlock height={260} />
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <h2>{t('upload.title')}</h2>
        <p className="muted">{t('upload.intro')}</p>
        {error && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Callout tone="error" role="alert">
              <p>
                <strong>{t('errors.title')}.</strong> {t(error.key, error.params)}
              </p>
              <p>
                <button type="button" className="btn btn-small" onClick={clearError}>
                  {t('errors.tryAgain')}
                </button>
              </p>
            </Callout>
          </div>
        )}
        <Dropzone />
        <p className="privacy-ribbon" style={{ marginTop: 'var(--space-4)' }}>
          <Icon name="lock" size={16} />
          {t('privacy.badge')}
        </p>
        <div className="section">
          <DemoPicker headingLevel={3} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--space-1)' }}>{t('upload.title')}</h2>
          <p className="muted" role="status" style={{ margin: 0 }}>
            <Icon name="check" size={16} style={{ verticalAlign: '-3px', marginRight: 4 }} />
            {t('upload.loaded', {
              name: summary.name,
              rows: f.int(summary.rowCount),
              cols: f.int(summary.columns.length),
            })}
          </p>
        </div>
        <div className="spacer" />
        <button type="button" className="btn btn-ghost" onClick={reset}>
          <Icon name="refresh" size={16} />
          {t('upload.another')}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => goTo('mapping')}>
          {t('upload.continue')}
          <Icon name="arrowRight" />
        </button>
      </div>
      <Preview summary={summary} />
      <div className="row section">
        <div className="spacer" />
        <button type="button" className="btn btn-primary" onClick={() => goTo('mapping')}>
          {t('upload.continue')}
          <Icon name="arrowRight" />
        </button>
      </div>
    </div>
  );
}
