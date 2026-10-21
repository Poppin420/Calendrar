export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="var(--ink)" />
      <path
        d="M16 6v20M10 26h12M7 11h18"
        stroke="var(--bg)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 11l-3.5 7h7zM25 11l-3.5 7h7z"
        fill="none"
        stroke="var(--seq-2)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
