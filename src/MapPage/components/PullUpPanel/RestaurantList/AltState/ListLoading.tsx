import Typography from '@mui/material/Typography';
import type { FC } from 'react';

import '../RestaurantList.css';

const ListLoading: FC<{ enabled: boolean }> = ({ enabled }) => {
  return (
    <div>
      {enabled && (
        <Typography variant="body2" color="text.secondary">Loading ranked places...</Typography>
      )}
    </div>
  );
};

export default ListLoading;
