import { useMemo } from 'react';
import { useSearchFilters } from '../../../context/SearchFiltersContext';

const getRatingLabel = (): string => {

    const { scoreTier } = useSearchFilters();
    const tierLabel = useMemo(() => {
        switch (scoreTier) {
            case 1:
                return '50%';
            case 2:
                return '25%';
            case 3:
                return '10%';
            case 4:
                return '5%';
            default:
                return 'all';
        }
    }, [scoreTier]);

    return tierLabel;
};

export default getRatingLabel;
