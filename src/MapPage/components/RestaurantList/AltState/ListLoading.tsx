import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { FC } from 'react';

import '../RestaurantList.css';

const ListLoading: FC<{ enabled: boolean; rowCount?: number }> = ({ enabled, rowCount = 8 }) => {
  if (!enabled) return null;

  return (
    <>
      {Array.from({ length: rowCount }, (_, index) => (
        <Box
          key={index}
          className="list-item-row"
          aria-hidden="true"
          sx={{
            pointerEvents: 'none',
            cursor: 'default',
            maxHeight: '78px',
          }}
        >
          <Box
            className="list-item-icon-column"
            sx={{
              flex: '0 0 42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '5px',
            }}
          >
            <Skeleton variant="circular" width={56} height={56} />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              pt: '2px',
              pr: '52px',
            }}
          >
            <Skeleton
              variant="text"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.3,
                width: `${72 - (index % 3) * 10}%`,
                maxWidth: '420px',
              }}
            />
            <Skeleton
              variant="text"
              sx={{
                mt: 0.3,
                fontSize: '1rem',
                lineHeight: 1.3,
                width: `${58 - (index % 2) * 8}%`,
                maxWidth: '320px',
              }}
            />
          </Box>

          <Skeleton
            variant="rounded"
            width={44}
            height={32}
            sx={{
              position: 'absolute',
              right: '5px',
              bottom: '5px',
              borderRadius: '999px',
            }}
          />
        </Box>
      ))}
    </>
  );
};

export default ListLoading;
