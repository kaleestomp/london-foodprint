import React from 'react'; 
import { useAppUI } from '../../../context/AppUIContext'; 
import useResizeWidth from './useResizeWidth'; 

import Skeleton from '@mui/material/Skeleton'; 
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade'; 
import './SideCard.css';

const SideCard: React.FC = () => {
    
    const { isSideCardVisible: isOpen } = useAppUI(); 
    const isLoading = false; // Placeholder for loading state, can be connected to context or local state
    const { cardWidth, isResizing, onResizeStart } = useResizeWidth(); 
    
    return (
        <aside
            className={`side-card${isOpen ? ' is-open' : ''}${isResizing ? ' is-resizing' : ''}`}
            aria-label="Page 1 secondary sidebar"
            aria-hidden={!isOpen}
            style={{ width: cardWidth }} 
        >
            {isOpen && <>
                <div className="side-card-resize-handle" onMouseDown={onResizeStart} />
                <Fade in={isLoading} unmountOnExit>
                    <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none'}}>
                        <Skeleton variant="rounded" animation="wave" sx={{ width: '100%', height: '100%' }} />
                    </Box>
                </Fade>
                {/* <div className="side-card-header-block"/>
                <Divider /> */}
                <div className="side-card-content-block">
                </div>
                {/* <Divider />
                <div className="side-card-footer-block"/> */}
            </>}

        </aside>
    );
}

export default SideCard;