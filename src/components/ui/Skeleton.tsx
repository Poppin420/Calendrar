export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton skeleton-line" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function SkeletonBlock({ height = 220 }: { height?: number }) {
  return <div className="skeleton skeleton-block" style={{ height }} aria-hidden="true" />;
}

export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
    >
      <span style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
