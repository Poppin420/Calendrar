import { useI18n } from '../../i18n';
import type { Verdict } from '../../lib/types';
import { Icon, type IconName } from './Icon';

const VERDICT_ICON: Record<Verdict, IconName> = {
  ok: 'check',
  concern: 'alert',
  inconclusive: 'help',
  insufficient: 'minus',
  na: 'minus',
};

/** Verdict chip: icon + text, never colour alone. */
export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { t } = useI18n();
  return (
    <span className={`verdict verdict-${verdict}`}>
      <Icon name={VERDICT_ICON[verdict]} size={16} />
      {t(`verdict.${verdict}`)}
    </span>
  );
}
