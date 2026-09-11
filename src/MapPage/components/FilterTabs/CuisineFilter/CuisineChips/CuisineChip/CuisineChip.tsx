import Chip from '@mui/material/Chip';

import CuisineIcon from '../CuisineIcon/CuisineIcon';
import { getCuisineColor } from '../../../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/backdropColors/getCuisineColor';
import brightenColor from '../../../../../../utils/format/brightenColor';
import { CUISINE_DISPLAY } from '../../../../../../utils/format/formatCuisines';
import './CuisineChip.css';

const CuisineChip: React.FC<{
    cuisine: string;
    count: number;
    selected: boolean;
    onClick: () => void;
}> = ({ cuisine, count, selected, onClick }) => {

    const cuisineColor = cuisine ? getCuisineColor(cuisine) : '#ffffff';
    const badgeColor = cuisineColor ? brightenColor(cuisineColor, 0.1) : 'rgba(255, 255, 255, 0.9)';
    // const bgColor = cuisineColor ? brightenColor(cuisineColor, -1) : 'rgba(255, 255, 255, 0.9)';

    return (
        <Chip key={cuisine} label={`${CUISINE_DISPLAY[cuisine].replace(/\s+/g, '')} | ${count}`} clickable
            icon={<CuisineIcon cuisine={cuisine ?? undefined} color={badgeColor} iconSize={36} badgeSize={36}/>}
            color={selected ? 'primaryBlack' : 'default'}
            // sx={{backgroundColor: bgColor,'&:hover': {backgroundColor: bgColor}}}
            onClick={onClick}
        />
    );
};

export default CuisineChip;
