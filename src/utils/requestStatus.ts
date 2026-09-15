export type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

type RequestStatusInput = {
  enabled: boolean;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  hasData: boolean;
};

export const getRequestStatus = ({
  enabled,
  isPending,
  isFetching,
  isError,
  hasData,
}: RequestStatusInput): RequestStatus => {
  if (!enabled) {
    return 'empty';
  }
  if (isPending || (isFetching && !hasData)) {
    return 'loading';
  }
  if (isError) {
    return 'error';
  }
  return hasData ? 'success' : 'empty';
};

// const status: RequestStatus = !debouncedQuery
// ? 'empty'
// : queryResult.isPending || (queryResult.isFetching && !queryResult.data)
//     ? 'loading'
//     : queryResult.isError
//     ? 'error'
//     : queryResult.data
//         ? 'success'
//         : 'empty';

// const status: RequestStatus = !queryKey ? 'empty' 
//     : query.isPending ? 'loading' 
//     : query.isError ? 'error' 
//     : query.data ? 'success' : 'empty';