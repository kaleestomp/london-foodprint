import Typography from '@mui/material/Typography';
import type { FC } from 'react';

import '../RestaurantList.css';

const NoResult: FC<{ enabled: boolean }> = ({ enabled }) => {
  if (!enabled) return null;

  return <Typography variant="body2" color="text.secondary">No places found in current view.</Typography>;
};

export default NoResult;
