import './Badge.css';

type Props = {
  count: number | null;
  isLoading: boolean;
};

const formatCompactCount = (value: number): string => {
  if (!Number.isFinite(value)) return '0';

  const abs = Math.abs(value);
  if (abs < 1000) return String(Math.round(value));

  if (abs < 1_000_000) {
    const n = value / 1000;
    return `${n >= 10 ? Math.round(n) : n.toFixed(1).replace(/\.0$/, '')}K`;
  }

  const n = value / 1_000_000;
  return `${n >= 10 ? Math.round(n) : n.toFixed(1).replace(/\.0$/, '')}M`;
};

const Badge: React.FC<Props> = ({ count, isLoading }) => {
  const text = isLoading ? '...' : formatCompactCount(count ?? 0);

  return (
    <div className="bubble-drag-badge" role="status" aria-live="polite">
      {count ? `×${text}` : "?"}
    </div>
  );
};

export default Badge;