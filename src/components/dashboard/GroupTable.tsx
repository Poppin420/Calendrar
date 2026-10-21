import { useI18n } from '../../i18n';
import { MIN_GROUP_SIZE } from '../../lib/metrics/groups';
import type { GroupStats, Proportion } from '../../lib/types';
import { Icon } from '../ui/Icon';

function RateCell({ p }: { p?: Proportion }) {
  const { f } = useI18n();
  if (!p || p.value === null) return <td className="num">–</td>;
  return (
    <td className="num">
      {f.pct(p.value)}
      <span className="ci">
        {f.pct(p.lower)}–{f.pct(p.upper)}
      </span>
    </td>
  );
}

export function GroupTable({
  groups,
  hasTruth,
  caption,
}: {
  groups: GroupStats[];
  hasTruth: boolean;
  caption: string;
}) {
  const { t, f } = useI18n();
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table>
        <caption>
          {caption}. {t('dashboard.tableCaption')}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t('dashboard.colGroup')}</th>
            <th scope="col" className="num">
              {t('dashboard.colN')}
            </th>
            <th scope="col" className="num">
              {t('dashboard.colRate')}
            </th>
            {hasTruth && (
              <>
                <th scope="col" className="num">
                  {t('dashboard.colTpr')}
                </th>
                <th scope="col" className="num">
                  {t('dashboard.colFpr')}
                </th>
                <th scope="col" className="num">
                  {t('dashboard.colPrecision')}
                </th>
                <th scope="col" className="num">
                  {t('dashboard.colAccuracy')}
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.group}>
              <th scope="row" style={{ fontWeight: 600 }}>
                {g.group}
                {g.n < MIN_GROUP_SIZE && (
                  <span className="ci" style={{ color: 'var(--inconclusive)' }}>
                    <Icon name="warning" size={13} style={{ verticalAlign: '-2px' }} />{' '}
                    {t('dashboard.smallGroup')}
                  </span>
                )}
              </th>
              <td className="num">{f.int(g.n)}</td>
              <RateCell p={g.selectionRate} />
              {hasTruth && (
                <>
                  <RateCell p={g.tpr} />
                  <RateCell p={g.fpr} />
                  <RateCell p={g.precision} />
                  <RateCell p={g.accuracy} />
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
