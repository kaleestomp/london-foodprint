import type { FC } from 'react';

import useFormatPlaceCount from '../usePlacesCount/useFormatPlaceCount';
import './TitleBlock.css';

const TitleBlock: FC = () => {
  const { headline } = useFormatPlaceCount();
  return (
    <div className="overview-title-block">
        <div className="overview-title">{headline}</div>
        <div className="overview-subtitle">
            Ranked Top 25% of Metroplitan Area
        </div>
    </div>
  );
};

export default TitleBlock;
