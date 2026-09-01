import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import type { FC } from 'react';

import './CloseButton.css';

const CloseButton: FC<{
    onClose: () => void;
}> = ({ onClose }) => {

    return (
        <IconButton
            size="small"
            className="list-item-close-button"
            aria-label="Close selected restaurant card"
            onClick={(event) => {
                event.stopPropagation();
                onClose();
            }}
        >
            <CloseRoundedIcon fontSize="medium" />
        </IconButton>
    );
};

export default CloseButton;
