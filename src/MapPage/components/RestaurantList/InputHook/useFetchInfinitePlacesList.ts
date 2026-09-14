import { useEffect, useMemo, useState } from 'react';

import { useCityContext } from '../../../../context/CityContext';
import useGetSearchBounds from './useGetSearchBounds';
import useGetFilterParams from './useGetFilterParams';
import useActiveParams from './useActiveParams';
import useRequestInfinitePlacesList, { type PlacesListParams } from '../../../request/useRequestPlacesList/useRequestInfinitePlacesList';
import { type PlacesListResponse } from '../../../request/useRequestPlacesList/request';

const useFetchInfinitePlacesList = (
  reset: boolean = true,
  pageSize: number = 10,
  enabled: boolean = true,
): {
  status: 'empty' | 'loading' | 'success' | 'error';
  res: PlacesListResponse | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isListStale: boolean;
  filterKey: string;
} => {


  const { geoBounds, geoKey } = useGetSearchBounds();
  const { filterParams, filterKey } = useGetFilterParams();
  const { citySlug: city } = useCityContext();
  const liveParams = useMemo<PlacesListParams | null>(() => (
    geoBounds ? { ...geoBounds, ...filterParams, city, page_size: pageSize } : null
  ), [geoBounds, filterParams, city, pageSize]);
  const liveParamKey = `${city}||${geoKey}||${filterKey}||${pageSize}`;
  const activeParams = useActiveParams(liveParams, liveParamKey, reset);

  const [isListStale, setIsListStale] = useState(false);
  useEffect(() => {
    setIsListStale(true);
  }, [city, geoKey, filterKey]);

  const { status, res, isReady, // isFetching,
    hasNextPage, isFetchingNextPage, fetchNextPage
  } = useRequestInfinitePlacesList(activeParams, enabled && reset);
  
  useEffect(() => {
    if (isReady) setIsListStale(false);
  }, [isReady]);
  // isListStale STUCK ON TRUE AFTER SELECT FIRST ITEM ON LINE - REFRESH - SELECT SECOND ITEM ON LIST - REFRESH - SELECT FIRST ITEM ONE LIST - REFRESH
  // because isReady does not flip
  // console.log(isReady);
  return {
    status, res, 
    hasNextPage, isFetchingNextPage,
    isListStale, fetchNextPage,
    filterKey,
  };
};

export default useFetchInfinitePlacesList;
