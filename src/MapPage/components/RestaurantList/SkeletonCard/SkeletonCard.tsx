import Box from '@mui/material/Box';
import type { FC } from 'react';

import ItemSkeleton from '../ListItem/ItemSkeleton/ItemSkeleton';
import '../ListItem/ListItem.css';

const SkeletonCard: FC<{ 
    index: number; 
    selected?: boolean 
}> = ({ index, selected = false }) => {

    return (
        <Box key={index} className={`list-item-row${selected ? ' is-selected' : ''}`} 
            aria-hidden="true"
            sx={{
                pointerEvents: 'none',
                cursor: 'default',
                maxHeight: selected ? '400px' : '78px',
            }}
        >
            <ItemSkeleton index={index} selected={selected} />
        </Box>
    );
};

export default SkeletonCard;
