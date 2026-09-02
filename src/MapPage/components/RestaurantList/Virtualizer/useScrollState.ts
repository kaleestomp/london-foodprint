import { useCallback, useRef } from 'react';

const NEAR_BOTTOM_THRESHOLD = 180;

const useScrollState = (
    readyToFetchNextPage: boolean,
    fetchNextPage: () => void,
    setShouldAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>
) => {

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const onScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        // AT TOP — latch off auto-refresh once user scrolls
        if (el.scrollTop > 0) setShouldAutoRefresh(false);

        // NEAR BOTTOM
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - NEAR_BOTTOM_THRESHOLD;
        if (nearBottom && readyToFetchNextPage)
            void fetchNextPage();

    }, [fetchNextPage, readyToFetchNextPage]);
    
    return { scrollRef, onScroll };
};

export default useScrollState;