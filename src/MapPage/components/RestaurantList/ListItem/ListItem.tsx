import type { FC } from 'react';

import { getCuisineColor } from '../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/backdropColors/getCuisineColor';
import { type PlacesListItem } from '../../../request/useRequestPlacesList/request';
import brightenColor from './formatHelpers/brightenColor';
import ItemContent from './ItemContent/ItemContent';
import ItemSkeleton from './ItemSkeleton/ItemSkeleton';
import CloseButton from './CloseButton/CloseButton';

import './ListItem.css';

const ListItem: FC<{
    item: PlacesListItem | null;
    isSelected: boolean;
    onSelect: () => void;
    onClose: () => void;
    closeButton?: boolean;
}> = ({ item, isSelected, onSelect, onClose, closeButton }) => {

  const cuisineColor = item ? getCuisineColor(item.cuisine_type) : '#ffffff';
  return (
    <div className={`list-item-row ${isSelected ? 'is-selected' : ''}`}
      style={{ background: brightenColor(cuisineColor, isSelected ? 1.00 : 0.94) }}
      onClick={ !item ? undefined : () => (
        closeButton ? (isSelected ? undefined : onSelect())
        : (isSelected ? onClose() : onSelect())
      )}
    >
      {!item ? (
        <ItemSkeleton selected={isSelected} />
      ) : (
        <>
          {closeButton && isSelected && <CloseButton onClose={onClose} />}
          <ItemContent item={item} isSelected={isSelected} color={cuisineColor} />
        </>
      )}
    </div>
  );
};

export default ListItem;
