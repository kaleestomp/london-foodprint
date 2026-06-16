import React from 'react'; 

import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import './Placeholder.css';

const Placeholder:React.FC = () => {
	return (
		<section className="placeholder" aria-label="File Directory placeholder">
			<div className="placeholder-content">
				<ConstructionOutlinedIcon className="placeholder-icon" fontSize="large" />
				<p className="placeholder-text">Under Construction</p>
			</div>
		</section>
	);
};

export default Placeholder;
