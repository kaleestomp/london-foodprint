import type { FC } from 'react';

import './RatingPillButton.css';

type RatingPillButtonProps = {
  percentile: number;
  text?: string;
  ariaLabel: string;
  isActive?: boolean;
  onClick: () => void;
};

const RatingPillButton: FC<RatingPillButtonProps> = ({
  percentile,
  text,
  ariaLabel,
  isActive = false,
  onClick,
}) => {
  const hasText = !!text?.trim();

  return (
    <button
      type="button"
      className={`rating-filter-pill${isActive ? ' is-active' : ''}`}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      onClick={onClick}
    >
      <span
        className={`rating-filter-pill-prefix${isActive ? ' is-visible' : ''}`}
        aria-hidden="true"
      >
        Top
      </span>
      <span className="rating-pill-number" aria-hidden="true">{percentile}</span>
      {hasText && <span className="rating-filter-pill-text">{text}</span>}
    </button>
  );
};

export default RatingPillButton;
