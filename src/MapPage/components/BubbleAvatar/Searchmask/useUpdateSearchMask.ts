import { useEffect, useMemo } from 'react'; 
import { type LatLng, SEARCH_RADIUS } from '../config';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';

const useUpdateSearchMask = (droppedPos: LatLng | null) => { 

    const { setSearchMask } = useSearchFilters();

    const searchMask = useMemo(
        () => (droppedPos ? { center: droppedPos, radiusM: SEARCH_RADIUS } : null),
        [droppedPos],
    );
    useEffect(() => {
        setSearchMask(searchMask);
    }, [searchMask, setSearchMask]);

}

export default useUpdateSearchMask;
