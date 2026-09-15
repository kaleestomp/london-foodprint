import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCityContext } from '../../../context/CityContext';
import { type PlaceDetailResponse, request } from './request';
import { getRequestStatus, type RequestStatus } from '../../../utils/requestStatus';


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

  const status = getRequestStatus({ enabled: Boolean(normalizedPlaceId), isPending: query.isPending, isFetching: query.isFetching, isError: query.isError, hasData: Boolean(query.data) });

  return {
    status,
    error: query.error as Error | null,
    res: query.data ?? null,
  };
};

export default useRequestPlaceDetail;