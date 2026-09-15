import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import requestFeatureGeometry from './requestFeatureGeometry';

const useMaptilerFeatureRequestCall = () => {

    const queryClient = useQueryClient();

    const requestCall = useCallback(async (featureId: string) => {
        await queryClient.cancelQueries({ queryKey: ['maptiler-feature'] });

        const feature = await queryClient.fetchQuery({
            queryKey: ['maptiler-feature', featureId],
            queryFn: ({ signal }) => requestFeatureGeometry(featureId, signal),
            staleTime: 5 * 60_000,
            gcTime: 10 * 60_000,
            retry: false,
        });

        return feature;
    }, [queryClient]);

    return requestCall;
};

export default useMaptilerFeatureRequestCall;