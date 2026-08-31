import type { FC } from 'react';
import Typography from '@mui/material/Typography';

import { getCuisineColor } from '../../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/backdropColors/getCuisineColor';
import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request';
import ItemIcon from './itemIcon/itemIcon';
import brightenColor from './brightenColor';
import RankBadge from './RankBadgeSimple/RankBadge';
import ExtendedContent from './ExtendedContent/ExtendedContent';
import { formatDistance, formatPrice } from './formatMetrics';

import './ListItem.css';

const ListItem: FC<{
    item: PlacesListItem;
    isSelected: boolean;
    onSelect: () => void;
    onClose: () => void;
}> = ({ item, isSelected, onSelect, onClose }) => {

  const cuisineColor = getCuisineColor(item.cuisine_type);
  return (
    <div
      className={`list-item-row ${isSelected ? 'is-selected' : ''}`}
      style={{ background: brightenColor(cuisineColor, isSelected ? 1.00 : 0.94) }}
      role="button"
      tabIndex={0}
      aria-expanded={isSelected}
      onClick={() => isSelected ? onClose() : onSelect()}
      // onKeyDown={(event) => {
      //   if (event.key !== 'Enter' && event.key !== ' ') return;
      //   event.preventDefault();
      //   if (isSelected) return;
      //   onSelect();
      // }}
    >
      <ItemIcon item={item} accentColor={cuisineColor} />
      <RankBadge item={item} accentColor={brightenColor(cuisineColor, -0.8)} />{/* -2.4 */}

      <div className="list-item-content">
        <Typography variant="h6" className="list-item-row-title" sx={{fontWeight: 500}}>
          {item.display_name}
        </Typography>
        <Typography variant="subtitle1" className="list-item-row-subtitle" >
          
          {!isSelected ? [
            item.cuisine_type ?? '',
            formatDistance(item.distance_m), 
            formatPrice(item.price?.trim() ?? ''),
          ].filter(Boolean).join(' · ') 
          : item.cuisine_type ?? ''}
        </Typography>

        <ExtendedContent item={item} />
      </div>
    </div>
  );
};

export default ListItem;
