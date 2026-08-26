import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import useGetSearchBounds from './useGetSearchBounds';
import useGetFilterParams from './useGetFilterParams';
import { buildQueryKey } from '../../../../request/useRequestPlacesList/useRequestPlacesList';
import { request, type PlacesListResponse } from '../../../../request/useRequestPlacesList/request';

type ListQueryResult = {
  listStatus: 'empty' | 'loading' | 'success' | 'error';
  status: 'empty' | 'loading' | 'success' | 'error';
  listRes: PlacesListResponse | null;
  res: PlacesListResponse | null;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isListStale: boolean;
};

const usePullUpPanelListQuery = (
  enabled: boolean = true,
): ListQueryResult => {
  const { geoBounds, geoKey } = useGetSearchBounds();
  const { filterParams, filterKey } = useGetFilterParams();
  const [page, setPage] = useState(1);
  const [isListStale, setIsListStale] = useState(false);

  useEffect(() => {
    setIsListStale(true);
  }, [geoKey, filterKey]);

  const query = useInfiniteQuery<
    PlacesListResponse, Error,
    InfiniteData<PlacesListResponse>,
    readonly [string, string, string, boolean], // query key type
    number
  >({
    queryKey: ['places-list', geoKey, filterKey, enabled],
    enabled: Boolean(geoBounds) && enabled,
    placeholderData: (previousData) => previousData,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      // avoid errors when no bounds are available yet 
      if (!geoBounds) {
        return {
          page: Number(pageParam),
          page_size: 20,
          data: [],
        } satisfies PlacesListResponse;
      }

      const params = {
        ...geoBounds,
        ...filterParams,
        page: Number(pageParam),
        enabled: true,
      };

      return request(buildQueryKey(params), { signal });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.data.length < 20) return undefined;
      return allPages.length + 1;
    },
  });

  const listRes = useMemo<PlacesListResponse | null>(() => {
    const pages = query.data?.pages ?? [];
    if (pages.length === 0) return null;

    return {
      page: pages[pages.length - 1]?.page ?? 1,
      page_size: pages[0]?.page_size ?? 20,
      data: pages.flatMap((pageData) => pageData.data),
    };
  }, [query.data]);

  const listStatus: ListQueryResult['listStatus'] =
    !geoBounds || !enabled
      ? 'empty'
      : query.isPending
        ? 'loading'
        : query.isError
          ? 'error'
          : query.data
            ? 'success'
            : 'empty';

  useEffect(() => {
    if (!query.isFetching && query.isFetched) {
      setIsListStale(false);
    }
  }, [query.isFetching, query.isFetched]);

  return {
    listStatus,
    status: listStatus,
    listRes,
    res: listRes,
    page,
    setPage,
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
    hasNextPage: Boolean(query.hasNextPage),
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isListStale,
  };
};

export default usePullUpPanelListQuery;
