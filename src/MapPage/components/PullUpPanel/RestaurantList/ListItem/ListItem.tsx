import Typography from '@mui/material/Typography';
import type { FC } from 'react';

import { getCuisineColor } from '../../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/backdropColors/getCuisineColor';
import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request';
import ItemIcon from './itemIcon/itemIcon';
import brightenColor from './brightenColor';
import RankBadge from './RankBadgeSimple/RankBadge';
// import ExtendedContent from './ExtendedContent/ExtendedContent';

import './ListItem.css';

const ListItem: FC<{
    item: PlacesListItem;
}> = ({ item }) => {

  const cuisineColor = getCuisineColor(item.cuisine_type);
  
  return (
    <div className="list-item-row" style={{ background: brightenColor(cuisineColor, 0.94) }}>

      <ItemIcon item={item} accentColor={cuisineColor} />
      <RankBadge item={item} accentColor={brightenColor(cuisineColor, -0.8)} />{/* -2.4 */}

      <div className="list-item-content">
        <Typography variant="h6" className="list-item-row-title" sx={{fontWeight: 600}}>
          {item.display_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.cuisine_type ?? 'Unspecified'} · {item.price?.trim() ? item.price : 'Unspecified'} · {item.venue_type ?? 'Unspecified'} · {item.is_chain ? 'Chain' : 'Independent'}
        </Typography>
        {/* <ExtendedContent googleMapsUri={item.google_maps_uri} websiteUri={item.website_uri} /> */}
      </div>
    </div>
  );
};

export default ListItem;
