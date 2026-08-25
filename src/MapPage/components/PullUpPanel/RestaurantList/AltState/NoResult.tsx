import Typography from '@mui/material/Typography';
import type { FC } from 'react';

import '../RestaurantList.css';

const NoResult: FC<{ enabled: boolean }> = ({ enabled }) => {
  return (
    <div>
      {enabled && (
        <Typography variant="body2" color="text.secondary">No places found in current view.</Typography>
      )}
    </div>
  );
};

export default NoResult;
