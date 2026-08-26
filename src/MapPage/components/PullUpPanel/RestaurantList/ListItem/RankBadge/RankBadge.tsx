import type { FC } from 'react';

import { type PlacesListItem } from '../../../../../request/useRequestPlacesList/request';
import './RankBadge.css';

const RankBadge: FC<{
  item: PlacesListItem;
  accentColor: string;
}> = ({ item, accentColor }) => {

  const rankValue = typeof item.ranking === 'number'
    ? Math.floor((1 - item.ranking) * 100) + 1
    : null;

  return (rankValue != null && (
    <span
      className="list-item-rank-badge"
      style={{ ['--badge-fill' as any]: accentColor }}
    >
      <svg className="list-item-rank-badge-backdrop" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
        <path d="M12 0l2.139 2.629 3.068-1.441.786 3.297 3.389.033-.722 3.312 3.039 1.5-2.088 2.67 2.088 2.67-3.039 1.5.722 3.312-3.389.033-.786 3.297-3.068-1.441-2.139 2.629-2.139-2.629-3.068 1.441-.786-3.297-3.389-.033.722-3.312-3.039-1.5 2.088-2.67-2.088-2.67 3.039-1.5-.722-3.312 3.389-.033.786-3.297 3.068 1.441z" />
      </svg>
      <span className="list-item-rank-badge-label">
        <span className="list-item-rank-value">{rankValue}</span>
        <span className="list-item-rank-percent">%</span>
      </span>
    </span>
  ))
};

export default RankBadge;
