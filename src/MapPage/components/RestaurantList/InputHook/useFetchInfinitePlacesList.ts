import { useEffect, useMemo, useState } from 'react';

import useGetSearchBounds from './useGetSearchBounds';
import useGetFilterParams from './useGetFilterParams';
import useActiveParams from './useActiveParams';
import useRequestInfinitePlacesList, { type PlacesListParams } from '../../../request/useRequestPlacesList/useRequestInfinitePlacesList';
import { type PlacesListResponse } from '../../../request/useRequestPlacesList/request';

type ListQueryResult = {
  status: 'empty' | 'loading' | 'success' | 'error';
  res: PlacesListResponse | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isListStale: boolean;
  filterKey: string;
};

const useFetchInfinitePlacesList = (
  shouldReset: boolean = true,
  pageSize: number = 10,
): ListQueryResult => {


  const { geoBounds, geoKey } = useGetSearchBounds();
  const { filterParams, filterKey } = useGetFilterParams();
  const liveParams = useMemo<PlacesListParams | null>(() => (
    geoBounds ? { ...geoBounds, ...filterParams, page_size: pageSize } : null
  ), [geoBounds, filterParams, pageSize]);
  const liveParamKey = `${geoKey}||${filterKey}||${pageSize}`;
  const activeParams = useActiveParams(liveParams, liveParamKey, shouldReset);
  
  const [isListStale, setIsListStale] = useState(false);
  useEffect(() => {
    setIsListStale(true);
  }, [geoKey, filterKey]);

  const { status, res, isReady, // isFetching,
    hasNextPage, isFetchingNextPage, fetchNextPage
  } = useRequestInfinitePlacesList(activeParams, shouldReset);

  useEffect(() => {
    if (isReady) setIsListStale(false);
  }, [isReady]);

  return {
    status, res, 
    hasNextPage, isFetchingNextPage,
    isListStale, fetchNextPage,
    filterKey,
  };
};

export default useFetchInfinitePlacesList;
