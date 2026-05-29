import React from 'react';

import useResize from './useResize';
import ParrallelSpan from './ParrallelSpan/ParrallelSpan';
import ParrallelHeader from './ParrallelHeader/ParrallelHeader';
import ParrallelFooter from './ParrallelFooter/ParrallelFooter'; 
import './ParrallelCard.css'; 

const ParrallelCard: React.FC = () => {

    const { cardHeight, isResizing, onResizeStart } = useResize(); 
    
    return (  
        <div
            className={`parrallel-container${isResizing ? ' is-resizing' : ''}`}
            style={{ height: cardHeight }}
        >
            <div className="parrallel-resize-handle" onMouseDown={onResizeStart} />
            <ParrallelHeader />
            <div className="parrallel-content">
                <ParrallelSpan />
            </div>
            <ParrallelFooter/>
        </div>
    );
}

export default ParrallelCard;
// React.memo(ParrallelCard)
// memo isolates ParrallelCard from processing when states/props in parent change
 