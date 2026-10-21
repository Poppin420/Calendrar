import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Tone = 'info' | 'warn' | 'error' | 'ok';

const ICONS: Record<Tone, IconName> = {
  info: 'info',
  warn: 'warning',
  error: 'alert',
  ok: 'check',
};

export function Callout({
  tone = 'info',
  children,
  role,
}: {
  tone?: Tone;
  children: ReactNode;
  role?: 'alert' | 'status';
}) {
  return (
    <div className={`callout callout-${tone}`} role={role}>
      <Icon name={ICONS[tone]} />
      <div>{children}</div>
    </div>
  );
}
