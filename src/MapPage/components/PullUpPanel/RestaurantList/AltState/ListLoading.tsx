import Typography from '@mui/material/Typography';
import type { FC } from 'react';

import '../RestaurantList.css';

const ListLoading: FC<{ enabled: boolean }> = ({ enabled }) => {
  if (!enabled) return null;

  return <Typography variant="body2" color="text.secondary">Loading ranked places...</Typography>;
};

export default ListLoading;
