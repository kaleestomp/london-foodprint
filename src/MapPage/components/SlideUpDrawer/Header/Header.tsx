import type { FC } from 'react';

import useResultSummary from '../../HeaderContent/ResultSummary';
import { useGeoSearch } from '../../GeoSearch/GeoSearchContext';
import './Header.css';

const HeaderMobile: FC = () => {
  const { headline } = useResultSummary();
  const { isExpanded } = useGeoSearch();

  return (
    <div className="drawer-header">
      <div className={`drawer-title-row${isExpanded ? ' search-expanded' : ''}`}>
        <div className="drawer-title-block" aria-hidden={isExpanded}>
          <div className="drawer-title">{headline}</div>
          {/* <div className="drawer-subtitle">
            Ranked Top 25% of Metroplitan Area
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default HeaderMobile;
