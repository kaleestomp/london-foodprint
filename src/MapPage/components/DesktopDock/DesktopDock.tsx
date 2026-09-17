import { useEffect, useState, type FC } from 'react';
import type * as maplibregl from 'maplibre-gl';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { useIsMobileCtx } from '../../../context/IsMobileContext';
import { useAppUI } from '../../../context/AppUIContext';
import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import HeaderDesktop from '../SlideUpDrawer/Header/HeaderDesktop';
import AboveDrawer from '../SlideUpDrawer/AboveDrawer/AboveDrawer';
import FilterSection from '../FilterTabs/FilterSection';
import PlaceDetail from '../PlaceDetail/PlaceDetail';

import './DesktopDock.css';

const DesktopDock: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef: _mapRef }) => {
  const isMobile = useIsMobileCtx();
  const [isExpanded, setIsExpanded] = useState(false);
  const { activeToolbarTab } = useAppUI();
  const { selectedPlaceId, selectionSource } = usePlaceSelection();
  const detailPlaceId = selectionSource === 'map' ? selectedPlaceId : null;
  const hasExpandedContent = Boolean(detailPlaceId || activeToolbarTab);

  useEffect(() => {
    // A marker selection is the desktop equivalent of opening the drawer to
    // its middle snap point. Keep the dock mounted so CSS can animate from
    // the compact layout instead of replacing the layout abruptly.
    setIsExpanded(hasExpandedContent);
  }, [hasExpandedContent]);

  if (isMobile) return null;

  const toggleExpanded = () => {
    if (hasExpandedContent) setIsExpanded((expanded) => !expanded);
  };

  return (
    <>
      <section
        className={`desktop-dock${isExpanded ? ' is-expanded' : ''}`}
        aria-label="Selected place"
      >
        <AboveDrawer mapRef={_mapRef} />
        <div
          className="desktop-dock-header"
          role={hasExpandedContent ? 'button' : undefined}
          tabIndex={hasExpandedContent ? 0 : undefined}
          onClick={toggleExpanded}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleExpanded();
            }
          }}
        >
          <HeaderDesktop expanded={isExpanded} />
        </div>

        {isExpanded && activeToolbarTab && (
          <div className="desktop-dock-content">
            <FilterSection />
          </div>
        )}

        {isExpanded && !activeToolbarTab && detailPlaceId && (
          <div className="desktop-dock-content">
            <PlaceDetail placeId={detailPlaceId} showHeader={false} />
          </div>
        )}
      </section>

      {isExpanded && (
        <IconButton
          className="desktop-dock-collapse-button"
          aria-label="Collapse selected place"
          onClick={() => setIsExpanded(false)}
        >
          <CloseIcon />
        </IconButton>
      )}
    </>
  );
};

export default DesktopDock;
