import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const useClearOnDrawerClose = (
    isClosed: boolean,
    setShouldAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>
) => {
    // DO NOT RESET OVERRIDE 
    // When the drawer is closed, remove the cached places list 
    // and reset auto-refresh
    const queryClient = useQueryClient();
    const wasClosedRef = useRef(isClosed);
    useEffect(() => {
        if (isClosed && !wasClosedRef.current) {
            queryClient.removeQueries({ queryKey: ['places-list'] });
            setShouldAutoRefresh(true);
        }
        wasClosedRef.current = isClosed;
    }, [isClosed, queryClient]);
};

export default useClearOnDrawerClose;