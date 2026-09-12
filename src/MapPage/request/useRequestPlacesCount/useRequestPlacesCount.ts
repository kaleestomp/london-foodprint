import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCityContext } from '../../../context/CityContext';
import { buildQueryKey, request, type PlacesCountParams, type PlacesCountResponse } from './request';
import isViewportOnlyChange from './isViewportOnlyChange';

const useRequestPlacesCount = (params: PlacesCountParams | null): {
  res: PlacesCountResponse | null;
  isFetching: boolean;
} => {
  const { citySlug: city } = useCityContext();
  const queryKey = useMemo(() => (params ? buildQueryKey({ ...params, city }) : ''), [params, city]);
  const query = useQuery({
    queryKey: ['places-count', queryKey],
    queryFn: ({ signal }) => request(queryKey, { signal }),
    enabled: Boolean(queryKey),
    placeholderData: (previousData, previousQuery) => (
      isViewportOnlyChange(queryKey, previousQuery?.queryKey) ? previousData : undefined
    ),
  });

  return { res: query.data ?? null, isFetching: query.isFetching };
};

export default useRequestPlacesCount;