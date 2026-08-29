import type { FC } from 'react';

import useResultSummary from '../../PullUpPanel/HeaderContent/ResultSummary';
import './Header.css';

const HeaderMobile: FC = () => {
  const { headline } = useResultSummary();

  return (
    <div className="drawer-header">
      <div className="drawer-title-row">
        <div className="drawer-title-block">
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
