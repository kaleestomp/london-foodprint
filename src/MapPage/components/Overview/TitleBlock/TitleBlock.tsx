import type { FC } from 'react';
import Typography from '@mui/material/Typography';

import useFormatSubfix from '../useTitle/useFormatSubfix';
// import useFormatSubtitle from '../useTitle/useFormatSubtitle';
import useFormatVerdict from '../useTitle/useFormatVerdict';
import './TitleBlock.css';

const TitleBlock: FC<{
  count: number | null
  tierRep: number 
}> = ({ count, tierRep }) => {

  const subfix = useFormatSubfix(count);
  // const subtitle = useFormatSubtitle();
  const verdict = useFormatVerdict(tierRep);
  return (
    <div className="overview-title-block">
      <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
        {count !== null && <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {count} 
        </Typography>}
        
        <Typography variant="caption" sx={{ ml: 0.5 }}>
            {subfix}
        </Typography>
      </span>
      <Typography variant="caption" className="place-detail-subtitle" sx={{ lineHeight: 1.0 }}>
        {verdict}
      </Typography>
    </div>
  );
};

export default TitleBlock;
