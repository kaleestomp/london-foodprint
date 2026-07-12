import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type PlaceDetailResponse, request } from './request';

type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

const useRequestPlaceDetail = (placeId: string | null): {
  status: RequestStatus;
  error: Error | null;
  res: PlaceDetailResponse | null;
} => {
  const normalizedPlaceId = useMemo(() => placeId?.trim() ?? '', [placeId]);

  const query = useQuery({
    queryKey: ['place-detail', normalizedPlaceId],
    queryFn: ({ signal }) => request(normalizedPlaceId, { signal }),
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