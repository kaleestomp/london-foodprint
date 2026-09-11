import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import './ResetButton.css';

const CuisineFilterResetButton: React.FC = () => {

    const { clearCuisines } = useSearchFilters();

    return (
        <IconButton
            className="cuisine-filter-reset-button"
            aria-label="Reset cuisine selection"
            onClick={clearCuisines}
        >
            <RefreshIcon />
        </IconButton>
    );
};

export default CuisineFilterResetButton;
