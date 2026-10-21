import type { SVGProps } from 'react';

export type IconName =
  | 'check'
  | 'alert'
  | 'help'
  | 'minus'
  | 'info'
  | 'lock'
  | 'upload'
  | 'file'
  | 'sun'
  | 'moon'
  | 'download'
  | 'arrowLeft'
  | 'arrowRight'
  | 'refresh'
  | 'x'
  | 'search'
  | 'scale'
  | 'warning';

const PATHS: Record<IconName, string> = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  alert: 'M12 8v5M12 16.5v.5M12 3l9.5 17h-19z',
  warning: 'M12 8v5M12 16.5v.5M12 3l9.5 17h-19z',
  help: 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.5M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
  minus: 'M7 12h10M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
  info: 'M12 11v6M12 7.5V8M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13zM12 15v2',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  refresh: 'M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4',
  x: 'M6 6l12 12M18 6L6 18',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-4-4',
  scale: 'M12 3v18M7 21h10M4 7h16M4 7l-2.5 6h5zM20 7l-2.5 6h5z',
};

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Accessible label; without it the icon is decorative. */
  label?: string;
}

export function Icon({ name, size = 18, label, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
