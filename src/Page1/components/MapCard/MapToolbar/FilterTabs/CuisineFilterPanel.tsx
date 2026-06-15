import { useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import {
  CUISINE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../../context/SearchFiltersContext';
import FilterTabPanel from './FilterTabPanel';
import MaterialUISwitch from './MaterialUISwitch';
import './CuisineFilterPanel.css';

const COLLAPSED_COUNT = 8;

const CuisineFilterPanel: React.FC = () => {
  const {
    cuisines,
    cuisineSelectionMode,
    toggleCuisine,
    clearCuisines,
    setCuisineSelectionMode,
  } = useSearchFilters();
  const [expanded, setExpanded] = useState(false);

  const selectedSet = useMemo(() => new Set(cuisines), [cuisines]);
  const visibleOptions = useMemo(() => {
    if (expanded) return CUISINE_FILTER_OPTIONS;
    const selectedFirst = CUISINE_FILTER_OPTIONS.filter((opt) => selectedSet.has(opt));
    const rest = CUISINE_FILTER_OPTIONS.filter((opt) => !selectedSet.has(opt));
    return [...selectedFirst, ...rest].slice(0, COLLAPSED_COUNT);
  }, [expanded, selectedSet]);

  const hasHidden = !expanded && visibleOptions.length < CUISINE_FILTER_OPTIONS.length;

  return (
    <FilterTabPanel
      title="Cuisine"
      headerContent={(
        <div className="cuisine-filter-panel__mode-row">
          <Typography variant="caption" className="cuisine-filter-panel__mode-label cuisine-filter-panel__mode-label--left">
            Incl.
          </Typography>
          <MaterialUISwitch
            checked={cuisineSelectionMode === 'exclude'}
            onChange={(event) => setCuisineSelectionMode(event.target.checked ? 'exclude' : 'include')}
            slotProps={{ input: { 'aria-label': 'Cuisine include or exclude mode' } }}
          />
          <Typography variant="caption" className="cuisine-filter-panel__mode-label cuisine-filter-panel__mode-label--right">
            Excl.
          </Typography>
        </div>
      )}
    >
      <>
        <Chip
          label="Any"
          clickable
          color={cuisines.length === 0 ? 'primary' : 'default'}
          variant={cuisines.length === 0 ? 'filled' : 'outlined'}
          onClick={clearCuisines}
        />
        {visibleOptions.map((option) => {
          const selected = selectedSet.has(option);
          return (
            <Chip
              key={option}
              label={option}
              clickable
              color={selected ? (cuisineSelectionMode === 'exclude' ? 'warning' : 'primary') : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => toggleCuisine(option)}
            />
          );
        })}
        {hasHidden ? (
          <Chip
            label="+"
            clickable
            variant="outlined"
            className="cuisine-filter-panel__toggle-chip"
            onClick={() => setExpanded(true)}
            aria-label="Expand cuisines"
          />
        ) : null}
        {!hasHidden && expanded ? (
          <Chip
            label="-"
            clickable
            variant="outlined"
            className="cuisine-filter-panel__toggle-chip"
            onClick={() => setExpanded(false)}
            aria-label="Collapse cuisines"
          />
        ) : null}
      </>
    </FilterTabPanel>
  );
};

export default CuisineFilterPanel;
