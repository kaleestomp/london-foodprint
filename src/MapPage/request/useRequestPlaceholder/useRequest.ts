import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type dataContract, request } from './request';

type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

const useRequest = (path: string): {
  status: RequestStatus;
  error: Error | null;
  res: dataContract[] | null;
} => {
  const normalizedPath = useMemo(() => path.trim(), [path]);

  const query = useQuery({
    queryKey: ['placeholder', normalizedPath],
    queryFn: ({ signal }) => request(normalizedPath, { signal }),
    enabled: Boolean(normalizedPath),
  });

  const status: RequestStatus = !normalizedPath
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

export default useRequest;