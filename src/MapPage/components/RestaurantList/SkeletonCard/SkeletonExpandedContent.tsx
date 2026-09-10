import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { FC } from 'react';

const ExpandedContentSkeleton: FC = () => (
  <Box className="list-item-extra" aria-hidden="true">
    <Box className="list-item-extended-row">
      <Skeleton variant="text" width={58} height={22} />
      <Skeleton variant="text" width={76} height={22} />
      <Skeleton variant="text" width={86} height={22} />
    </Box>
    <Box className="list-item-links">
      <Skeleton variant="rounded" width={34} height={32} />
      <Skeleton variant="rounded" width={72} height={32} />
    </Box>
  </Box>
);

export default ExpandedContentSkeleton;
