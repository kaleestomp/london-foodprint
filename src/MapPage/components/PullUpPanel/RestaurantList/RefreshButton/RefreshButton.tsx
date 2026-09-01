import { type FC } from 'react';
import Fab from '@mui/material/Fab';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';

import './RefreshButton.css';

const RefreshButton: FC<{
    onListRefresh: () => void;
    isVisible: boolean;
    isLoading: boolean;
}> = ({ onListRefresh, isVisible, isLoading }) => {

    return (
        <div className={['list-refresh-wrap', isVisible ? 'list-refresh-wrap-visible' : 'list-refresh-wrap-hidden' ].join(' ')}>
            <Fab className="list-refresh-button"
                onClick={onListRefresh}
                size="medium"
                aria-label="Refresh list"
                disabled={isLoading}
            >
                {isLoading
                    ? <CircularProgress size={20} color="inherit" />
                    : <RefreshIcon fontSize="large" />
                }
            </Fab>
        </div>
    );
};

export default RefreshButton;
