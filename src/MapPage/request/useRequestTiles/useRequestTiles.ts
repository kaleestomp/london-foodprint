import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import buildQueryKey from './buildQueryKey';
import { type TilesResponse, request } from './request';
export type RequestStatus = 'empty' | 'loading' | 'success' | 'error';
export type { TilesResponse };
export interface TilesParams {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
  /**
   * H3 resolution resolved on the frontend (7–10). Sent directly to the API.
   */
  res: number;
  /**
   * When true, the backend skips the density table and returns up to 100 places
   * directly. Only valid (and only sent) when res === 10.
   */
  places_only?: boolean;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
}

const useRequestTiles = (params: TilesParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: TilesResponse | null;
  queryKey: string;
  responseKey: string;
  isFetching: boolean;
} => {
  const queryKey = useMemo(() => (params ? buildQueryKey(params) : ''), [params]);
  const query = useQuery({
    queryKey: ['tiles', queryKey],
    queryFn: ({ signal }) => request(queryKey, { signal }),
    enabled: Boolean(queryKey),
    placeholderData: (previousData) => previousData,
  });

  const status: RequestStatus = !queryKey
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
    queryKey,
    responseKey: query.data ? queryKey : '',
    isFetching: query.isFetching,
  };
};

export default useRequestTiles;
