import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type dataContract, request } from './request';
import { getRequestStatus, type RequestStatus } from '../../../utils/requestStatus';


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

  const status = getRequestStatus({ enabled: Boolean(normalizedPath), isPending: query.isPending, isFetching: query.isFetching, isError: query.isError, hasData: Boolean(query.data) });

  return {
    status,
    error: query.error as Error | null,
    res: query.data ?? null,
  };
};

export default useRequest;