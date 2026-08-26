import { type FC } from 'react';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';

import './RefreshButton.css';

const RefreshButton: FC<{
    onListRefresh: () => void;
    isVisible: boolean;
}> = ({ onListRefresh, isVisible }) => {

    return (
        <div
            className={[
                'restaurant-list-refresh-wrap',
                isVisible ? 'restaurant-list-refresh-wrap-visible'
                    : 'restaurant-list-refresh-wrap-hidden',
            ].join(' ')}
        >
            <IconButton
                type="button"
                className="restaurant-list-refresh-button"
                onClick={onListRefresh}
                size="small"
                aria-label="Refresh list"
                disabled={!isVisible}
            >
                <RefreshIcon fontSize="small" />
            </IconButton>
        </div>
    );
};

export default RefreshButton;
