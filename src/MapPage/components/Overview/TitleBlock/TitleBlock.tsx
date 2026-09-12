import type { FC } from 'react';

import useFormatPlaceCount from '../usePlaceCount/useFormatPlaceCount';
import './TitleBlock.css';

const TitleBlock: FC<{ 
  count: number | null
}> = ({ count }) => {

  const { subfix, subline } = useFormatPlaceCount(count);
  return (
    <div className="overview-title-block">
        {count !== null && <div className="overview-title">
          {count}
        </div>}
        <div className="overview-subtitle-1">
          {subfix}
        </div>
        <div className="overview-subtitle-2">
            {subline}
        </div>
    </div>
  );
};

export default TitleBlock;
