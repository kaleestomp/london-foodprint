import { useEffect, useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { createPortal } from 'react-dom';
import { useAppUI } from '../../../../context/AppUIContext';
import {
  CUISINE_FILTER_OPTIONS,
  PRICE_RANGE_FILTER_OPTIONS,
  SCORE_TIER_FILTER_OPTIONS,
  SCORE_TIER_THRESHOLD_MAP,
  VENUE_TYPE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../context/SearchFiltersContext';
import useRestaurantPanelSnap from './useRestaurantPanelSnap';
import './RestaurantInfoPanel.css';

type FilterSectionProps = {
  title: string;
  options: readonly string[];
  selected: string[];
  isMulti: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSelectAny: () => void;
  onToggleOption: (option: string) => void;
  collapsedCount: number;
};

const sectionTitleSx = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'text.secondary',
};

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  options,
  selected,
  isMulti,
  isExpanded,
  onToggleExpanded,
  onSelectAny,
  onToggleOption,
  collapsedCount,
}) => {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const collapsedOptions = useMemo(() => {
    const selectedFirst = options.filter((opt) => selectedSet.has(opt));
    const rest = options.filter((opt) => !selectedSet.has(opt));
    return [...selectedFirst, ...rest].slice(0, collapsedCount);
  }, [collapsedCount, options, selectedSet]);

  const visibleOptions = isExpanded ? options : collapsedOptions;
  const hasHidden = !isExpanded && options.length > visibleOptions.length;

  return (
    <Stack spacing={1.25}>
      <Typography sx={sectionTitleSx}>{title}</Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label="Any"
          clickable
          color={selected.length === 0 ? 'primary' : 'default'}
          variant={selected.length === 0 ? 'filled' : 'outlined'}
          onClick={onSelectAny}
        />
        {visibleOptions.map((option) => {
          const isSelected = selectedSet.has(option);
          return (
            <Chip
              key={option}
              label={option}
              clickable
              color={isSelected ? 'primary' : 'default'}
              variant={isSelected ? 'filled' : 'outlined'}
              onClick={() => onToggleOption(option)}
            />
          );
        })}
        {hasHidden ? (
          <Chip
            label="+"
            clickable
            variant="outlined"
            onClick={onToggleExpanded}
            aria-label={`Expand ${title}`}
          />
        ) : null}
        {!hasHidden && isExpanded ? (
          <Chip
            label="−"
            clickable
            variant="outlined"
            onClick={onToggleExpanded}
            aria-label={`Collapse ${title}`}
          />
        ) : null}
      </Stack>
      {!isMulti && selected.length > 1 ? (
        <Typography variant="caption" color="text.secondary">
          Single select enabled.
        </Typography>
      ) : null}
    </Stack>
  );
};

const RestaurantInfoPanel: React.FC = () => {
  const {
    debug,
    isMobile,
    panelHeight,
    setSnapIndex,
    snapIndex,
  } = useRestaurantPanelSnap();
  const {
    restaurantPanelCommandToken,
    restaurantPanelTargetSnapIndex,
    restaurantPanelTargetTab,
  } = useAppUI();
  const {
    cuisines,
    venueType,
    priceRange,
    scoreTier,
    toggleCuisine,
    clearCuisines,
    setVenueType,
    setPriceRange,
    setScoreTier,
    resetFilters,
  } = useSearchFilters();

  const [activeTab, setActiveTab] = useState<'results' | 'filters'>('results');
  const [isCuisineExpanded, setIsCuisineExpanded] = useState(false);
  const [isVenueExpanded, setIsVenueExpanded] = useState(false);
  const [isPriceExpanded, setIsPriceExpanded] = useState(false);

  useEffect(() => {
    setActiveTab(restaurantPanelTargetTab);
    setSnapIndex(restaurantPanelTargetSnapIndex);
  }, [restaurantPanelCommandToken, restaurantPanelTargetSnapIndex, restaurantPanelTargetTab, setSnapIndex]);

  const showTabs = !isMobile || snapIndex > 0;

  const debugOverlay = debug.enabled && typeof document !== 'undefined'
    ? createPortal(
      <div className="restaurant-panel-debug-overlay" aria-label="Panel debug overlay">
        <div>mode: {debug.isMobile ? 'mobile' : 'desktop'} | coarse: {String(debug.isCoarsePointer)}</div>
        <div>w: {debug.width} h: {Math.round(debug.height)} vvH: {debug.visualViewportHeight ? Math.round(debug.visualViewportHeight) : 'n/a'} iH: {debug.innerHeight ?? 'n/a'}</div>
        <div>snap: {debug.snapIndex} y: {debug.y}</div>
        {debug.events.map((event) => (
          <div key={event}>{event}</div>
        ))}
      </div>,
      document.body,
    )
    : null;

  const filterContent = (
    <div className="restaurant-panel-scroll-content">
      <Stack spacing={2.25} sx={{ p: 2.25 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700 }}>
            Search Filters
          </Typography>
          <Chip label="Reset" clickable variant="outlined" onClick={resetFilters} />
        </Stack>

        <FilterSection
          title="Score Tier Filter"
          options={SCORE_TIER_FILTER_OPTIONS.map((value) => `Tier ${value} (>= ${SCORE_TIER_THRESHOLD_MAP[value]})`)}
          selected={scoreTier === 0 ? [] : [`Tier ${scoreTier} (>= ${SCORE_TIER_THRESHOLD_MAP[scoreTier]})`]}
          isMulti={false}
          isExpanded={false}
          onToggleExpanded={() => {}}
          onSelectAny={() => setScoreTier(0)}
          onToggleOption={(label) => {
            const match = SCORE_TIER_FILTER_OPTIONS.find((value) => label.startsWith(`Tier ${value} `));
            if (!match) return;
            setScoreTier(scoreTier === match ? 0 : match);
          }}
          collapsedCount={4}
        />

        <FilterSection
          title="Cuisine Filter"
          options={CUISINE_FILTER_OPTIONS}
          selected={cuisines}
          isMulti
          isExpanded={isCuisineExpanded}
          onToggleExpanded={() => setIsCuisineExpanded((prev) => !prev)}
          onSelectAny={clearCuisines}
          onToggleOption={(value) => toggleCuisine(value as (typeof CUISINE_FILTER_OPTIONS)[number])}
          collapsedCount={8}
        />

        <FilterSection
          title="Venue Type Filter"
          options={VENUE_TYPE_FILTER_OPTIONS}
          selected={venueType ? [venueType] : []}
          isMulti={false}
          isExpanded={isVenueExpanded}
          onToggleExpanded={() => setIsVenueExpanded((prev) => !prev)}
          onSelectAny={() => setVenueType(null)}
          onToggleOption={(value) => setVenueType(value === venueType ? null : value as typeof venueType)}
          collapsedCount={4}
        />

        <FilterSection
          title="Price Range"
          options={PRICE_RANGE_FILTER_OPTIONS}
          selected={priceRange ? [priceRange] : []}
          isMulti={false}
          isExpanded={isPriceExpanded}
          onToggleExpanded={() => setIsPriceExpanded((prev) => !prev)}
          onSelectAny={() => setPriceRange(null)}
          onToggleOption={(value) => setPriceRange(value === priceRange ? null : value as typeof priceRange)}
          collapsedCount={4}
        />

      </Stack>
    </div>
  );

  const resultsContent = (
    <div className="restaurant-panel-scroll-content restaurant-panel-results-empty">
      <Typography variant="body2" color="text.secondary">
        Pull up the panel and drop the avatar to load nearby restaurants.
      </Typography>
    </div>
  );

  if (!isMobile) {
    return (
      <>
        <aside className="restaurant-panel-desktop" aria-label="Area restaurants panel">
          <div className="restaurant-panel-header-desktop">Restaurants in this area</div>
          <Tabs
            value={activeTab}
            onChange={(_, next) => setActiveTab(next)}
            variant="fullWidth"
            className="restaurant-panel-tabs"
          >
            <Tab value="results" label="Results" />
            <Tab value="filters" label="Filters" />
          </Tabs>
          <div className="restaurant-panel-content">
            {activeTab === 'filters' ? filterContent : resultsContent}
          </div>
        </aside>
        {debugOverlay}
      </>
    );
  } else return (
    <>
      <section
        className="restaurant-sheet-mobile"
        style={{ height: panelHeight }}
        aria-label="Area restaurants panel"
      >
        <div className="restaurant-sheet-header">
          <div className="restaurant-sheet-handle-wrap">
          <div className="restaurant-sheet-handle" />
          </div>
          <div className="restaurant-sheet-title">Restaurants in this area</div>
          {showTabs ? (
            <Tabs
              value={activeTab}
              onChange={(_, next) => setActiveTab(next)}
              variant="fullWidth"
              className="restaurant-panel-tabs"
            >
              <Tab value="results" label="Results" />
              <Tab value="filters" label="Filters" />
            </Tabs>
          ) : null}
        </div>
        <div className="restaurant-panel-content">
          {activeTab === 'filters' ? filterContent : resultsContent}
        </div>
      </section>
      {debugOverlay}
    </>
  );
};

export default RestaurantInfoPanel;
