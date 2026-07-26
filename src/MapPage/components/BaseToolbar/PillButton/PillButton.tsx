import type { FC, ReactNode } from 'react';

import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import './PillButton.css';

type PillButtonProps = {
  icon: ReactNode;
  text?: string;
  ariaLabel: string;
  isActive?: boolean;
  onClick: () => void;
};

const PillButton: FC<PillButtonProps> = ({
  icon,
  text,
  ariaLabel,
  isActive = false,
  onClick,
}) => {
  const hasText = !!text?.trim();

  const { cuisineSelectionMode } = useSearchFilters();
  const excludeCuisineMode = ariaLabel === 'Open cuisine filters' && isActive && cuisineSelectionMode === 'exclude';
  
  return (
    <button
      type="button"
      className={`restaurant-bottom-toolbar-pill${hasText ? '' : ' restaurant-bottom-toolbar-pill-circle'}${isActive ? ' is-active' : ''}`}
      style={ excludeCuisineMode ? { background: '#ef6c00' } : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span className="restaurant-bottom-toolbar-pill-icon" aria-hidden="true">{icon}</span>
      {hasText && <span className="restaurant-bottom-toolbar-pill-text">{text}</span>}
    </button>
  );
};

export default PillButton;
