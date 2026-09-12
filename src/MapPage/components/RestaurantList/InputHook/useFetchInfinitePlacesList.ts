import { useEffect, useMemo, useState } from 'react';

import { useCityContext } from '../../../../context/CityContext';
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
  enabled: boolean = true,
): ListQueryResult => {


  const { geoBounds, geoKey } = useGetSearchBounds();
  const { filterParams, filterKey } = useGetFilterParams();
  const { citySlug: city } = useCityContext();
  const liveParams = useMemo<PlacesListParams | null>(() => (
    geoBounds ? { ...geoBounds, ...filterParams, city, page_size: pageSize } : null
  ), [geoBounds, filterParams, city, pageSize]);
  const liveParamKey = `${city}||${geoKey}||${filterKey}||${pageSize}`;
  const activeParams = useActiveParams(liveParams, liveParamKey, shouldReset);

  const [isListStale, setIsListStale] = useState(false);
  useEffect(() => {
    setIsListStale(true);
  }, [city, geoKey, filterKey]);

  const { status, res, isReady, // isFetching,
    hasNextPage, isFetchingNextPage, fetchNextPage
  } = useRequestInfinitePlacesList(activeParams, enabled && shouldReset);

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
