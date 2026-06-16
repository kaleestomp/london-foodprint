import React from 'react'; 

import Placeholder from '../Placeholder/Placeholder';
import '../Page1.css';

const PlaceholderViewport: React.FC = () => { 
    
    return (  
        <div className='map-card-viewport'>
            <Placeholder />
        </div>
    );
}

export default PlaceholderViewport
//React.memo(MapCard);
// memo isolates Component from processing when states/props in parent change

