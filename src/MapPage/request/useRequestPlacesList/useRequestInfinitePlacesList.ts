import { useMemo } from 'react';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import buildQueryKey from './buildQueryKey';
import { type PlacesListResponse, request } from './request';
type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

export interface PlacesListParams {
    sw_lat: number;
    sw_lng: number;
    ne_lat: number;
    ne_lng: number;
    center_lat?: number;
    center_lng?: number;
    radius_m?: number;
    cuisines?: string[];
    cost?: string[];
    venue_type?: string;
    score_basis?: 0 | 1 | 2;
    score_tier?: 0 | 1 | 2 | 3 | 4;
    page?: number;
    enabled?: boolean;
}

const useRequestInfinitePlacesList = (
    params: PlacesListParams | null,
    enabled: boolean = true,
): {
    status: RequestStatus;
    error: Error | null;
    res: PlacesListResponse | null;
    isReady: boolean;
    isFetching: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
} => {

    const queryKey = useMemo(() => buildQueryKey(params), [params]);

    const query = useInfiniteQuery<
        PlacesListResponse, Error,
        InfiniteData<PlacesListResponse>,
        readonly [string, string], // query key type
        number
    >({
        queryKey: ['places-list', queryKey],
        enabled: enabled && Boolean(queryKey),
        placeholderData: (previousData) => previousData,
        initialPageParam: 1,
        queryFn: async ({ pageParam, signal }) => {
            const requestParams = params ? { ...params, page: Number(pageParam) } : null;
            return request(buildQueryKey(requestParams), { signal });
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.data.length < 20) return undefined;
            return allPages.length + 1;
        },
    });

    const res = useMemo<PlacesListResponse | null>(() => {
        const pages = query.data?.pages ?? [];
        if (pages.length === 0) return null;

        return {
            page: pages[pages.length - 1]?.page ?? 1,
            page_size: pages[0]?.page_size ?? 20,
            data: pages.flatMap((pageData) => pageData.data),
        };
    }, [query.data]);

    const status: RequestStatus = !queryKey ? 'empty' 
        : query.isPending ? 'loading' 
        : query.isError ? 'error' 
        : query.data ? 'success' : 'empty';

    const error = query.error as Error | null;
    const isReady = query.isFetched && !query.isFetching; 
    const hasNextPage = Boolean(query.hasNextPage);
    const isFetchingNextPage = query.isFetchingNextPage;
    const isFetching = query.isFetching;
    const fetchNextPage = () => { void query.fetchNextPage(); };
    

    return { 
        status, error, res, isReady, isFetching, 
        hasNextPage, isFetchingNextPage, fetchNextPage 
    };
};

export default useRequestInfinitePlacesList;
