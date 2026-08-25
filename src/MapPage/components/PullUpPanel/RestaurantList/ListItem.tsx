import Typography from '@mui/material/Typography';
import type { FC } from 'react';

import { type PlacesListItem } from '../../../request/useRequestPlacesList/request';

import './RestaurantList.css';

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


const ListItem: FC<{
    item: PlacesListItem;
}> = ({ item }) => {

  return (
    <div className="restaurant-list-row" >
        <Typography variant="body2" className="restaurant-list-row-title">
        {item.ranking != null ? `${Math.round(item.ranking)}%` : '-'} · {item.display_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
        {item.cuisine_type ?? 'Unspecified'} · {item.venue_type ?? 'Unspecified'} · {item.is_chain ? 'Chain' : 'Independent'}
        </Typography>
        <ExternalLinks googleMapsUri={item.google_maps_uri} websiteUri={item.website_uri} />
    </div>
  );
};

export default ListItem;
