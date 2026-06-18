import type { MouseEvent } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import './Switch/Switch.css';


const RatingSwitch: React.FC = () => {
  const { ratingSelectionMode, setRatingSelectionMode } = useSearchFilters();

  const handleModeChange = (_event: MouseEvent<HTMLElement>, value: 'tier' | 'tier_d' | 'tier_independent' | null) => {
    if (!value) return;
    setRatingSelectionMode(value);
  };

  return (
    <div className="switch-row">
      <ToggleButtonGroup
        exclusive
        size="small"
        value={ratingSelectionMode}
        onChange={handleModeChange}
        aria-label="Select rating basis"
        className="switch-segmented"
      >
        <ToggleButton value="tier" aria-label="Base tier basis">Base</ToggleButton>
        <ToggleButton value="tier_d" aria-label="Diversity-adjusted basis">Diversity</ToggleButton>
        <ToggleButton value="tier_independent" aria-label="Independent-friendly basis">Independent</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

export default RatingSwitch;
