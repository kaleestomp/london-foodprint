import { useEffect, useState } from 'react';

import useGetSearchBounds from './useGetSearchBounds';
import useGetFilterParams from './useGetFilterParams';
import useRequestInfinitePlacesList, { type PlacesListParams } from '../../../../request/useRequestPlacesList/useRequestInfinitePlacesList';
import { type PlacesListResponse } from '../../../../request/useRequestPlacesList/request';

type ListQueryResult = {
  status: 'empty' | 'loading' | 'success' | 'error';
  res: PlacesListResponse | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isListStale: boolean;
  filterKey: string;
};

const usePullUpPanelListQuery = (
  enabled: boolean = true,
  page_size: number = 10,
): ListQueryResult => {


  const { geoBounds, geoKey } = useGetSearchBounds();
  const { filterParams, filterKey } = useGetFilterParams();
  const [isListStale, setIsListStale] = useState(false);
  

  useEffect(() => { 
    setIsListStale(true); 
  }, [geoKey, filterKey]);

  const placeListQueryParams : PlacesListParams | null = geoBounds
    ? { ...geoBounds, ...filterParams, page_size }
    : null;
  const { status, res, isReady, isFetching,
    hasNextPage, isFetchingNextPage, fetchNextPage
  } = useRequestInfinitePlacesList(placeListQueryParams, enabled);

  useEffect(() => {
    if (isReady) setIsListStale(false);
  }, [isReady]);

  return {
    status, res, isFetching,
    hasNextPage, isFetchingNextPage,
    isListStale, fetchNextPage,
    filterKey,
  };
};

export default usePullUpPanelListQuery;
