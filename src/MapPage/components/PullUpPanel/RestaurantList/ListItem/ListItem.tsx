import Typography from '@mui/material/Typography';
import type { FC } from 'react';

import { getCuisineColor } from '../../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/backdropColors/getCuisineColor';
import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request';
import ItemIcon from './itemIcon/itemIcon';
import brightenColor from './brightenColor';
import RankBadge from './RankBadgeSimple/RankBadge';
import ExtendedContent from './ExtendedContent/ExtendedContent';
import CloseButton from './CloseButton/CloseButton';

import './ListItem.css';
const formatPrice = (price: string ): string => {
  if (!price) return '';
  if (price?.startsWith('<')) 
    return `~£${price.slice(1)}`
  else return `£${price}`;
};

const formatDistance = (distanceM: number | null): string => {
  if (typeof distanceM !== 'number' || Number.isNaN(distanceM)) return '';
  if (distanceM < 1000) return `${Math.round(distanceM)}m`;
  return `${(distanceM / 1000).toFixed(1)}km`;
};

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
      onClick={() => {
        if (isSelected) return;
        onSelect();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (isSelected) return;
        onSelect();
      }}
    >
      {isSelected && <CloseButton onClose={onClose} />}

      <ItemIcon item={item} accentColor={cuisineColor} />
      <RankBadge item={item} accentColor={brightenColor(cuisineColor, -0.8)} />{/* -2.4 */}

      <div className="list-item-content">
        <Typography variant="h6" className="list-item-row-title" sx={{fontWeight: 500}}>
          {item.display_name}
        </Typography>
        <Typography variant="subtitle1" className="list-item-row-subtitle" >
          {[
            item.cuisine_type ?? '',
            formatPrice(item.price?.trim() ?? ''),
            formatDistance(item.distance_m),
          ].filter(Boolean).join(' · ')}
        </Typography>

        <ExtendedContent item={item} />
      </div>
    </div>
  );
};

export default ListItem;
