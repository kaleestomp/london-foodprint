import { useMemo } from 'react';
import { useSearchFilters, type CuisineFilterOption } from '../../../context/SearchFiltersContext';
import getCuisineHistRequestParams from '../PullUpPanel/OverviewSection/CuisineFilter/Input/getCuisineHistRequestParams';
import useRequestCuisineHistogram from '../../request/useRequestCuisineHistogram/useRequestCuisineHistogram';


const getCuisineCountLabel = (): string => {

    

    const cuisineRequestParams = getCuisineHistRequestParams();
    const { res: cuisineRes } = useRequestCuisineHistogram(cuisineRequestParams); 
    const cuisineData = cuisineRes?.cuisine_histogram ?? [];
    const availableCuisines = cuisineData.map((entry) => entry.cuisine);
    
    const { cuisines, cuisineSelectionMode } = useSearchFilters();
    
    const cuisineCount = useMemo(() => {
        if (cuisines?.length === 0) {
            return availableCuisines ? availableCuisines.length : 0;
        } else if (cuisineSelectionMode === 'include') {
            const eligibleCuisines = cuisines.filter((cuisine) => availableCuisines.includes(cuisine));
            return eligibleCuisines ? eligibleCuisines.length : 0;
        } else {
            const eligibleCuisines = availableCuisines.filter((cuisine) => !(cuisines.includes(cuisine)));
            return eligibleCuisines ? eligibleCuisines.length : 0;
        }
    }, [cuisines, availableCuisines]);

    const cuisineCountLabel = useMemo(() => {
        if (cuisineCount === 0) return 'NA';
        else if (cuisineCount === availableCuisines.length) return `${cuisineCount}`;
        else {
            return `${cuisineCount}/${availableCuisines.length}`;
        }
    }, [cuisineCount, availableCuisines.length]);

    return cuisineCountLabel;
};

export default getCuisineCountLabel;
