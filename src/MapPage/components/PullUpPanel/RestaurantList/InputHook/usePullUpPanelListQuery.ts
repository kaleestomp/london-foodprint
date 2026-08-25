import { useEffect, useState } from 'react';

import useRequestPlacesList from '../../../../request/useRequestPlacesList/useRequestPlacesList';
import useGetSearchBounds from './useGetSearchBounds';
import useGetFilterParams from './useGetFilterParams';
import type { PlacesListParams } from '../../../../request/useRequestPlacesList/useRequestPlacesList';
import type { PlacesListResponse } from '../../../../request/useRequestPlacesList/request';

/**
 * Owns all logic for the restaurant list query:
 * - resolves spatial bounds from bubble mask or viewport
 * - derives stable scope/filter keys for page resets
 * - manages pagination state
 * - calls useRequestPlacesList
 */
const usePullUpPanelListQuery = (
  enabled: boolean =  true
): {
  status: 'empty' | 'loading' | 'success' | 'error';
  res: PlacesListResponse | null;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
} => {

  const { geoBounds, geoKey } = useGetSearchBounds();
  const { filterParams, filterKey } = useGetFilterParams();
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [geoKey, filterKey]);

  const placeListQueryParams : PlacesListParams | null = geoBounds 
    ? { ...geoBounds, ...filterParams, page, enabled } : null;
  const { status, res } = useRequestPlacesList( placeListQueryParams );

  return { status, res, page, setPage };
};

export default usePullUpPanelListQuery;
