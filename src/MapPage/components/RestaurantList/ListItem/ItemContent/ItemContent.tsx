import type { FC } from 'react';
import Typography from '@mui/material/Typography';

import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request';
import ItemIcon from './ItemIcon/ItemIcon';
import RankBadge from './RankBadgeSimple/RankBadge';
import ExtendedContent from './ExtendedContent/ExtendedContent';
import brightenColor from '../../../../../utils/format/brightenColor';
import { formatDistance, formatPrice } from '../../../../../utils/format/formatMetrics';

import '../ListItem.css';

const ItemContent: FC<{
    item: PlacesListItem;
    isSelected: boolean;
    color: string;
}> = ({ item, isSelected, color }) => {

  return (
    <>
      <ItemIcon item={item} accentColor={color} />
      <RankBadge item={item} accentColor={brightenColor(color, -0.8)} />{/* -2.4 */}

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
    </>
  );
};

export default ItemContent;
