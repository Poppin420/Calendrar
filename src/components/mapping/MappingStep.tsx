import { useEffect, useId, useMemo, useState } from 'react';
import { useI18n, type MessageKey } from '../../i18n';
import {
  guessDecision,
  guessFavorable,
  guessSensitive,
  guessTruth,
  sensitiveCandidates,
} from '../../lib/guess';
import { MIN_GROUP_SIZE } from '../../lib/metrics/groups';
import type { AuditConfig, ColumnProfile, SensitiveSpec } from '../../lib/types';
import { analysis } from '../../workers/client';
import type { GroupCount } from '../../workers/protocol';
import { useAudit } from '../AuditContext';
import { Callout } from '../ui/Callout';
import { Icon } from '../ui/Icon';

interface SensitiveDraft {
  column: string;
  /** Text the user edits, e.g. "25, 40, 60". */
  binsText?: string;
  integer?: boolean;
}

function parseEdges(text: string): number[] | null {
  const parts = text
    .split(/[;,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const nums = parts.map((p) => Number(p.replace(',', '.')));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return [...new Set(nums)].sort((a, b) => a - b);
}

function toSpec(d: SensitiveDraft, profiles: ColumnProfile[]): SensitiveSpec | null {
  const p = profiles.find((x) => x.name === d.column);
  if (!p) return null;
  if (p.kind !== 'numeric') return { column: d.column };
  const edges = parseEdges(d.binsText ?? '');
  if (!edges) return null;
  return { column: d.column, binEdges: edges, integer: d.integer };
}

/** Checkbox list of values for a column. */
function ValuePicker({
  profile,
  selected,
  onChange,
  legend,
  help,
}: {
  profile: ColumnProfile;
  selected: string[];
  onChange: (v: string[]) => void;
  legend: string;
  help: string;
}) {
  const { f } = useI18n();
  const helpId = useId();
  return (
    <fieldset aria-describedby={helpId}>
      <legend>{legend}</legend>
      <p id={helpId} className="help" style={{ marginBottom: 'var(--space-2)' }}>
        {help}
      </p>
      <div className="checks">
        {profile.topValues.map((v) => (
          <label key={v.value} className="check">
            <input
              type="checkbox"
              checked={selected.includes(v.value)}
              onChange={(e) =>
                onChange(
                  e.target.checked ? [...selected, v.value] : selected.filter((s) => s !== v.value),
                )
              }
            />
            {v.value}
            <span className="count">{f.int(v.count)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GroupSizes({ spec }: { spec: SensitiveSpec | null }) {
  const { t, f } = useI18n();
  const [groups, setGroups] = useState<GroupCount[] | null>(null);
  const key = JSON.stringify(spec);

  useEffect(() => {
    if (!spec) {
      setGroups(null);
      return;
    }
    let live = true;
    setGroups(null);
    const timer = setTimeout(() => {
      void analysis()
        .request('groupSizes', { spec })
        .then((r) => {
          if (!live) return;
          const sorted = spec.binEdges ? r.groups : [...r.groups].sort((a, b) => b.count - a.count);
          if (spec.binEdges) {
            // Keep the natural order of ranges ("< 25" first).
            sorted.sort((a, b) => order(a.group) - order(b.group));
          }
          setGroups(sorted);
        });
    }, 200);
    return () => {
      live = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function order(label: string) {
    const m = label.match(/-?\d+(\.\d+)?/);
    const v = m ? Number(m[0]) : 0;
    return label.startsWith('<') ? -Infinity : label.startsWith('≥') ? v + 1e9 : v;
  }

  if (!spec) return null;
  if (!groups) return <p className="help">{t('mapping.loadingGroups')}</p>;
  const shown = groups.slice(0, 12);
  const max = Math.max(...shown.map((g) => g.count), 1);
  return (
    <div>
      <p className="label" style={{ margin: '0 0 var(--space-2)' }}>
        {t('mapping.groupsPreview')}
      </p>
      <ul className="group-sizes">
        {shown.map((g) => {
          const small = g.count < MIN_GROUP_SIZE;
          return (
            <li key={g.group} className={small ? 'small-group' : undefined}>
              <span className="name">{g.group}</span>
              <span
                className="bar"
                style={{ width: `${(g.count / max) * 100}%` }}
                aria-hidden="true"
              />
              <span className="n">
                {f.int(g.count)}
                {small && (
                  <>
                    {' '}
                    <Icon
                      name="warning"
                      size={14}
                      label={t('mapping.groupSmall')}
                      style={{ verticalAlign: '-2px' }}
                    />
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {groups.length > shown.length && <p className="help">+{groups.length - shown.length}</p>}
    </div>
  );
}

function SensitiveField({
  index,
  draft,
  profiles,
  candidates,
  onChange,
  onRemove,
  taken,
}: {
  index: number;
  draft: SensitiveDraft;
  profiles: ColumnProfile[];
  candidates: ColumnProfile[];
  onChange: (d: SensitiveDraft) => void;
  onRemove?: () => void;
  taken: string[];
}) {
  const { t } = useI18n();
  const selectId = useId();
  const binsId = useId();
  const binsHelpId = useId();
  const profile = profiles.find((p) => p.name === draft.column);
  const numeric = profile?.kind === 'numeric';
  const edgesValid = !numeric || parseEdges(draft.binsText ?? '') !== null;

  // Fetch suggested ranges when a numeric column is picked.
  useEffect(() => {
    if (!numeric || draft.binsText !== undefined) return;
    let live = true;
    void analysis()
      .request('suggestBins', { column: draft.column })
      .then((r) => {
        if (live) onChange({ ...draft, binsText: r.edges.join(', '), integer: r.integer });
      });
    return () => {
      live = false;
    };
    // Only re-run when the column changes or the ranges are reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeric, draft.column, draft.binsText === undefined]);

  return (
    <div className="card-flat">
      <div className="field">
        <label htmlFor={selectId}>{t('mapping.sensitiveLabel', { n: index + 1 })}</label>
        <div className="row">
          <select
            id={selectId}
            value={draft.column}
            onChange={(e) => onChange({ column: e.target.value })}
            style={{ flex: 1 }}
          >
            {index > 0 && <option value="">{t('mapping.sensitiveNone')}</option>}
            {candidates.map((c) => (
              <option key={c.name} value={c.name} disabled={taken.includes(c.name)}>
                {c.name} ({t(`kinds.${c.kind}`)})
              </option>
            ))}
          </select>
          {onRemove && (
            <button type="button" className="btn btn-ghost btn-small" onClick={onRemove}>
              <Icon name="x" size={16} />
              {t('mapping.removeSecond')}
            </button>
          )}
        </div>
      </div>
      {numeric && (
        <div className="field">
          <label htmlFor={binsId}>{t('mapping.binsLabel', { column: draft.column })}</label>
          <p id={binsHelpId} className="help">
            {t('mapping.binsHelp')}
          </p>
          <input
            id={binsId}
            type="text"
            inputMode="decimal"
            value={draft.binsText ?? ''}
            onChange={(e) => onChange({ ...draft, binsText: e.target.value })}
            aria-invalid={!edgesValid}
            aria-describedby={binsHelpId}
          />
          {!edgesValid && (
            <p className="field-error" role="alert">
              <Icon name="alert" size={16} />
              {t('mapping.binsInvalid')}
            </p>
          )}
        </div>
      )}
      {draft.column && (
        <div className="field">
          <GroupSizes spec={toSpec(draft, profiles)} />
        </div>
      )}
    </div>
  );
}

export function MappingStep() {
  const { t } = useI18n();
  const { summary, config, run, goTo } = useAudit();
  const profiles = useMemo(() => summary?.profiles ?? [], [summary]);

  const decisionOptions = useMemo(
    () =>
      profiles.filter(
        (p) =>
          (p.kind === 'binary' || p.kind === 'categorical' || p.kind === 'numeric') &&
          p.unique <= 12,
      ),
    [profiles],
  );
  const candidates = useMemo(() => sensitiveCandidates(profiles), [profiles]);

  const [decision, setDecision] = useState<string>(
    () => config?.decisionColumn ?? guessDecision(profiles) ?? decisionOptions[0]?.name ?? '',
  );
  const [favorable, setFavorable] = useState<string[]>(
    () => config?.favorableValues ?? guessFavorable(profiles.find((p) => p.name === decision)),
  );
  const [sensitive, setSensitive] = useState<SensitiveDraft[]>(() => {
    if (config) {
      return config.sensitive.map((s) => ({
        column: s.column,
        binsText: s.binEdges?.join(', '),
        integer: s.integer,
      }));
    }
    const guess = guessSensitive(profiles, [decision]);
    const first = guess[0] ?? candidates.find((c) => c.name !== decision)?.name ?? '';
    return [{ column: first }];
  });
  const [truth, setTruth] = useState<string>(
    () => config?.groundTruthColumn ?? guessTruth(profiles, [decision]) ?? '',
  );
  const [truthFavorable, setTruthFavorable] = useState<string[]>(
    () =>
      config?.groundTruthFavorableValues ?? guessFavorable(profiles.find((p) => p.name === truth)),
  );
  const [errors, setErrors] = useState<MessageKey[]>([]);

  const decisionProfile = profiles.find((p) => p.name === decision);
  const truthProfile = profiles.find((p) => p.name === truth);
  const decisionId = useId();
  const truthId = useId();

  const updateSensitive = (i: number) => (d: SensitiveDraft) =>
    setSensitive((list) => list.map((x, j) => (j === i ? d : x)));

  const submit = () => {
    const errs: MessageKey[] = [];
    if (!decisionProfile) errs.push('mapping.errNoDecision');
    if (favorable.length === 0) errs.push('mapping.errNoFavorable');
    if (
      decisionProfile &&
      favorable.length >= decisionProfile.topValues.length &&
      decisionProfile.unique <= 12
    )
      errs.push('mapping.errAllFavorable');
    const chosen = sensitive.filter((s) => s.column);
    const specs = chosen.map((s) => toSpec(s, profiles));
    if (chosen.length === 0) errs.push('mapping.errNoSensitive');
    if (specs.some((s) => s === null)) errs.push('mapping.binsInvalid');
    const cols = [decision, ...chosen.map((s) => s.column), ...(truth ? [truth] : [])];
    if (new Set(cols).size !== cols.length) errs.push('mapping.errSameColumn');
    if (truth && truthFavorable.length === 0) errs.push('mapping.errTruthFavorable');
    setErrors(errs);
    if (errs.length > 0) return;
    const cfg: AuditConfig = {
      decisionColumn: decision,
      favorableValues: favorable,
      sensitive: specs as SensitiveSpec[],
      ...(truth ? { groundTruthColumn: truth, groundTruthFavorableValues: truthFavorable } : {}),
    };
    void run(cfg);
  };

  if (!summary) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <h2>{t('mapping.title')}</h2>
      <p className="muted">{t('mapping.intro')}</p>

      <section className="card mapping-section" aria-labelledby="map-decision">
        <div>
          <h3 id="map-decision">{t('mapping.decisionTitle')}</h3>
          <p className="help">{t('mapping.decisionHelp')}</p>
        </div>
        <div>
          <div className="field">
            <label htmlFor={decisionId}>{t('mapping.decisionLabel')}</label>
            <select
              id={decisionId}
              value={decision}
              onChange={(e) => {
                setDecision(e.target.value);
                setFavorable(guessFavorable(profiles.find((p) => p.name === e.target.value)));
              }}
            >
              {decisionOptions.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {decisionProfile && (
            <div className="field">
              <ValuePicker
                profile={decisionProfile}
                selected={favorable}
                onChange={setFavorable}
                legend={t('mapping.favorableLabel')}
                help={t('mapping.favorableHelp')}
              />
            </div>
          )}
        </div>
      </section>

      <section className="card mapping-section" aria-labelledby="map-sensitive">
        <div>
          <h3 id="map-sensitive">{t('mapping.sensitiveTitle')}</h3>
          <p className="help">{t('mapping.sensitiveHelp')}</p>
        </div>
        <div className="stack">
          {sensitive.map((d, i) => (
            <SensitiveField
              key={i}
              index={i}
              draft={d}
              profiles={profiles}
              candidates={candidates}
              onChange={updateSensitive(i)}
              onRemove={i > 0 ? () => setSensitive((l) => l.slice(0, 1)) : undefined}
              taken={[
                decision,
                truth,
                ...sensitive.filter((_, j) => j !== i).map((s) => s.column),
              ].filter(Boolean)}
            />
          ))}
          {sensitive.length < 2 && (
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                const used = [decision, truth, sensitive[0]?.column];
                const next = candidates.find((c) => !used.includes(c.name));
                setSensitive((l) => [...l, { column: next?.name ?? '' }]);
              }}
            >
              + {t('mapping.addSecond')}
            </button>
          )}
        </div>
      </section>

      <section className="card mapping-section" aria-labelledby="map-truth">
        <div>
          <h3 id="map-truth">{t('mapping.truthTitle')}</h3>
          <p className="help">{t('mapping.truthHelp')}</p>
        </div>
        <div>
          <div className="field">
            <label htmlFor={truthId}>{t('mapping.truthLabel')}</label>
            <select
              id={truthId}
              value={truth}
              onChange={(e) => {
                setTruth(e.target.value);
                setTruthFavorable(guessFavorable(profiles.find((p) => p.name === e.target.value)));
              }}
            >
              <option value="">{t('mapping.truthNone')}</option>
              {decisionOptions
                .filter((p) => p.name !== decision)
                .map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          {truthProfile && (
            <div className="field">
              <ValuePicker
                profile={truthProfile}
                selected={truthFavorable}
                onChange={setTruthFavorable}
                legend={t('mapping.truthFavorableLabel')}
                help={t('mapping.favorableHelp')}
              />
            </div>
          )}
        </div>
      </section>

      {errors.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Callout tone="error" role="alert">
            {errors.map((e) => (
              <p key={e}>{t(e)}</p>
            ))}
          </Callout>
        </div>
      )}

      <div className="row section" style={{ paddingTop: 'var(--space-5)' }}>
        <button type="button" className="btn btn-ghost" onClick={() => goTo('upload')}>
          <Icon name="arrowLeft" />
          {t('mapping.back')}
        </button>
        <div className="spacer" />
        <button type="submit" className="btn btn-primary">
          {t('mapping.run')}
          <Icon name="arrowRight" />
        </button>
      </div>
    </form>
  );
}
