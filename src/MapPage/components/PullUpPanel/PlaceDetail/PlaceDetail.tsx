import Typography from '@mui/material/Typography';
import type { FC, PointerEvent as ReactPointerEvent } from 'react';

import useRequestPlaceDetail from '../../../request/useRequestPlaceDetail/useRequestPlaceDetail';
import usePullUpPanelListQuery from '../RestaurantList/InputHook/usePullUpPanelListQuery';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import './PlaceDetail.css';

type ExternalLinksProps = {
  googleMapsUri?: string | null;
  websiteUri?: string | null;
};

const ExternalLinks: FC<ExternalLinksProps> = ({ googleMapsUri, websiteUri }) => (
  <div className="restaurant-list-links">
    {googleMapsUri && (
      <a href={googleMapsUri} target="_blank" rel="noreferrer">Map</a>
    )}
    {websiteUri && (
      <a href={websiteUri} target="_blank" rel="noreferrer">Website</a>
    )}
  </div>
);

type Props = {
  // isPanelOpen: boolean;
  allowScroll: boolean;
  onContentPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onContentPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onContentPointerUp: () => void;
  onContentPointerCancel: () => void;
};
const RestaurantList: FC<Props> = ({
  // isPanelOpen,
  allowScroll,
  onContentPointerDown,
  onContentPointerMove,
  onContentPointerUp,
  onContentPointerCancel,
}) => {
  const { selectedPlaceId } = usePlaceSelection();
  const { status: listStatus, res: listRes, page, setPage } = usePullUpPanelListQuery();
  const { status: detailStatus, res: detailRes } = useRequestPlaceDetail(selectedPlaceId);
  console.log(listRes);
  const showEmptyList = listStatus !== 'loading' && (!listRes || listRes.data.length === 0);
  const canGoNextPage = Boolean(listRes && listRes.data.length >= 20);

  return (
    <div
      className="restaurant-panel-scroll-content"
      style={{ overflowY: allowScroll ? 'auto' : 'hidden' }}
      onPointerDown={onContentPointerDown}
      onPointerMove={onContentPointerMove}
      onPointerUp={onContentPointerUp}
      onPointerCancel={onContentPointerCancel}
    >
      <div className="restaurant-list-section">
        {listStatus === 'loading' && (
          <Typography variant="body2" color="text.secondary">Loading ranked places...</Typography>
        )}
        {showEmptyList && (
          <Typography variant="body2" color="text.secondary">No places found in current view.</Typography>
        )}
        {listRes?.data.map((row, idx) => {
          const key = `${row.display_name}-${idx}`;
          return (
            <div
              key={key}
              className="restaurant-list-row"
            >
              <Typography variant="body2" className="restaurant-list-row-title">
                {row.ranking != null ? `${Math.round(row.ranking)}%` : '-'} · {row.display_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.cuisine_type ?? 'Unspecified'} · {row.venue_type ?? 'Unspecified'} · {row.is_chain ? 'Chain' : 'Independent'}
              </Typography>
              <ExternalLinks googleMapsUri={row.google_maps_uri} websiteUri={row.website_uri} />
            </div>
          );
        })}

        <div className="restaurant-list-pagination">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!canGoNextPage}>Next</button>
        </div>
      </div>

      <div className="restaurant-list-section restaurant-list-detail">
        <Typography variant="subtitle2" color="text.secondary">Selected Pin Details</Typography>
        {!selectedPlaceId && (
          <Typography variant="body2" color="text.secondary">Tap a pin to load details.</Typography>
        )}
        {selectedPlaceId && detailStatus === 'loading' && (
          <Typography variant="body2" color="text.secondary">Loading place details...</Typography>
        )}
        {detailRes && (
          <div className="restaurant-list-detail-body">
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
};

export default RestaurantList;
