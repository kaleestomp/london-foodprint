import React from 'react'; 

import Divider from '@mui/material/Divider';
import './ParrallelSpan.css';

const ParrallelSpan:React.FC = () => {
    
    return (  
        <div className="parrallel-span">
            <div className="parrallel-span-chart">
            </div>
            {false && <>
                <Divider orientation="vertical" style={{ paddingLeft: 8}}/>
                <div className="parrallel-span-kpi-placeholder">
                </div>
            </>}
        </div>
    );
}

export default ParrallelSpan; 
//React.memo(ParrallelSpan);
// memo isolates ParrallelSpan from processing when states/props in parent change
 
