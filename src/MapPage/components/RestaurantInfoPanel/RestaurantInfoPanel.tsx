import Typography from '@mui/material/Typography';
import { useRestaurantPanelSnapState } from './RestaurantPanelSnapContext';
import useRequestPlaceDetail from '../../request/useRequestPlaceDetail/useRequestPlaceDetail';
import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import usePanelListQuery from './usePanelListQuery';
import './RestaurantInfoPanel.css';

type Props = {
  desktopTopOffsetPx?: number;
};

type ExternalLinksProps = {
  googleMapsUri?: string | null;
  websiteUri?: string | null;
};

const ExternalLinks: React.FC<ExternalLinksProps> = ({ googleMapsUri, websiteUri }) => (
  <div style={{ display: 'flex', gap: 10 }}>
    {googleMapsUri && (
      <a href={googleMapsUri} target="_blank" rel="noreferrer">Map</a>
    )}
    {websiteUri && (
      <a href={websiteUri} target="_blank" rel="noreferrer">Website</a>
    )}
  </div>
);

const RestaurantInfoPanel: React.FC<Props> = ({ desktopTopOffsetPx = 0 }) => {
  const {
    snapState,
    handlePanelPointerDown,
    handleHandlePointerDown,
    handleContentPointerDown,
    handleContentPointerMove,
    handleContentPointerUp,
    handleContentPointerCancel,
    isDragging,
    isMobile,
    isPanelOpen,
    panelHeight,
    translateY,
  } = useRestaurantPanelSnapState();
  const { selectedPlaceId } = usePlaceSelection();
  const { listStatus, listRes, page, setPage } = usePanelListQuery(isPanelOpen);
  const { status: detailStatus, res: detailRes } = useRequestPlaceDetail(selectedPlaceId);
  const showEmptyList = listStatus !== 'loading' && (!listRes || listRes.data.length === 0);
  const canGoNextPage = Boolean(listRes && listRes.data.length >= 20);
  const scrollOverflowY = snapState === 'full' ? undefined : 'hidden';

  const content = (
    // overflowY is suppressed outside full state so touch drags move the panel, not the list
    <div
      className="restaurant-panel-scroll-content"
      style={{ overflowY: scrollOverflowY }}
      onPointerDown={handleContentPointerDown}
      onPointerMove={handleContentPointerMove}
      onPointerUp={handleContentPointerUp}
      onPointerCancel={handleContentPointerCancel}
    >
      <Typography variant="subtitle2" color="text.secondary">Ranked Restaurants</Typography>
      {listStatus === 'loading' && (
        <Typography variant="body2" color="text.secondary">Loading ranked places...</Typography>
      )}
      {showEmptyList && (
        <Typography variant="body2" color="text.secondary">No places found in current view.</Typography>
      )}
      {listRes?.data.map((row, idx) => (
        <div key={`${row.display_name}-${idx}`} style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography variant="body2">
            {row.ranking != null ? `${Math.round(row.ranking)}%` : '-'} · {row.display_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.cuisine_type ?? 'Unspecified'} · {row.venue_type ?? 'Unspecified'} · {row.is_chain ? 'Chain' : 'Independent'}
          </Typography>
          <ExternalLinks googleMapsUri={row.google_maps_uri} websiteUri={row.website_uri} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!canGoNextPage}>Next</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <Typography variant="subtitle2" color="text.secondary">Selected Pin Details</Typography>
        {!selectedPlaceId && (
          <Typography variant="body2" color="text.secondary">Tap a pin to load details.</Typography>
        )}
        {selectedPlaceId && detailStatus === 'loading' && (
          <Typography variant="body2" color="text.secondary">Loading place details...</Typography>
        )}
        {detailRes && (
          <div style={{ paddingTop: 6 }}>
            <Typography variant="body2">{detailRes.display_name}</Typography>
            <Typography variant="caption" color="text.secondary">
              Ranking: {detailRes.ranking ?? '-'} · Cuisine: {detailRes.cuisine_type ?? 'Unspecified'} · Venue: {detailRes.venue_type ?? 'Unspecified'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Address: {detailRes.short_formatted_address ?? 'N/A'} · Postcode: {detailRes.pcd ?? 'N/A'}
            </Typography>
            <ExternalLinks googleMapsUri={detailRes.google_maps_uri} websiteUri={detailRes.website_uri} />
          </div>
        )}
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <aside
        className="restaurant-panel-desktop"
        style={{ top: desktopTopOffsetPx }}
        aria-label="Area restaurants panel"
      >
        <div className="restaurant-panel-header-desktop">Restaurants in this area</div>
        <div className="restaurant-panel-content">
          {content}
        </div>
      </aside>
    );
  }

  return (
    <section
      className="restaurant-sheet-mobile"
      style={{
        height: panelHeight,
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      aria-label="Area restaurants panel"
      onPointerDownCapture={handlePanelPointerDown}
    >
      <div
        className="restaurant-sheet-header"
        onPointerDown={handleHandlePointerDown}
      >
        <div className="restaurant-sheet-handle-wrap">
          <div className="restaurant-sheet-handle" />
        </div>
        <div className="restaurant-sheet-title">Restaurants in this area</div>
      </div>
      <div className="restaurant-panel-content">
        {content}
      </div>
    </section>
  );
};

export default RestaurantInfoPanel;
