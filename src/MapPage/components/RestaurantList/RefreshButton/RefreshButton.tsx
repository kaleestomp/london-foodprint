import { type FC } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';

import './RefreshButton.css';

const RefreshButton: FC<{
    onListRefresh: () => void;
    isVisible: boolean;
    isLoading: boolean;
}> = ({ onListRefresh, isVisible, isLoading }) => {
    
    return (
        <div className={['list-refresh-wrap', isVisible ? 'list-refresh-wrap-visible' : 'list-refresh-wrap-hidden' ].join(' ')}>
            <Button className="list-refresh-button"
                onClick={onListRefresh}
                size="small"
                startIcon={
                    isLoading
                        ? <CircularProgress size={16} color="inherit" />
                        : <RefreshIcon fontSize="small" />
                }
                aria-label="Refresh list"
                disabled={isLoading}
            >
                <Typography component="span" variant="caption">
                    scan new area
                </Typography>
            </Button>
        </div>
    );
};

export default RefreshButton;
