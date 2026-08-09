// import { useEffect, useMemo } from 'react'; 
// import { type LatLng, SEARCH_RADIUS } from '../config';
// import { useSearchFilters } from '../../../../context/SearchFiltersContext';

// const useUpdateSearchMask = (dropLatLng: LatLng | null) => { 

//     const { setSearchMask } = useSearchFilters();

//     const searchMask = useMemo(
//         () => (dropLatLng ? { center: dropLatLng, radiusM: SEARCH_RADIUS } : null),
//         [dropLatLng],
//     );
//     useEffect(() => {
//         setSearchMask(searchMask);
//     }, [searchMask, setSearchMask]);

// }

// export default useUpdateSearchMask;
