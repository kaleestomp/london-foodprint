import Skeleton from '@mui/material/Skeleton';
import type { FC } from 'react';

const PlacePieSkeleton: FC = () => (
  <Skeleton
    variant="circular"
    animation="wave"
    width="100%"
    height="100%"
  />
);

export default PlacePieSkeleton;
