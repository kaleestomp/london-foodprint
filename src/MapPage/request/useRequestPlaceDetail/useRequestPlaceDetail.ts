import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCityContext } from '../../../context/CityContext';
import { type PlaceDetailResponse, request } from './request';

type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

const useRequestPlaceDetail = (placeId: string | null): {
  status: RequestStatus;
  error: Error | null;
  res: PlaceDetailResponse | null;
} => {
  const { citySlug: city } = useCityContext();
  const normalizedPlaceId = useMemo(() => placeId?.trim() ?? '', [placeId]);

  const query = useQuery({
    queryKey: ['place-detail', city, normalizedPlaceId],
    queryFn: ({ signal }) => request(normalizedPlaceId, { signal, city }),
    enabled: Boolean(normalizedPlaceId),
  });

  const status: RequestStatus = !normalizedPlaceId
    ? 'empty'
    : query.isPending || (query.isFetching && !query.data)
      ? 'loading'
      : query.isError
        ? 'error'
        : query.data
          ? 'success'
          : 'empty';

  return {
    status,
    error: query.error as Error | null,
    res: query.data ?? null,
  };
};

export default useRequestPlaceDetail;