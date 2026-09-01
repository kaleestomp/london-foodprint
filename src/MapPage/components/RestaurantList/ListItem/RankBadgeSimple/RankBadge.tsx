import type { FC } from 'react';

import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request';
import './RankBadge.css';

const RankBadge: FC<{
  item: PlacesListItem;
  accentColor: string;
}> = ({ item, accentColor }) => {

  const rankValue = typeof item.ranking === 'number'
    ? Math.floor((1 - item.ranking) * 1000)/10 + 0.1
    : null;

  return (rankValue != null && (
    <span
      className="list-item-rank-badge"
      style={{ ['--badge-fill' as any]: accentColor }}
    >
      <span className="list-item-rank-badge-label">
        <span className="list-item-rank-value">{rankValue.toFixed(1)}</span>
        <span className="list-item-rank-percent">%</span>
      </span>
    </span>
  ))
};

export default RankBadge;
