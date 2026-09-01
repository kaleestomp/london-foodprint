import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FC } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import usePullUpPanelListQuery from './InputHook/usePullUpPanelListQuery';
import ListLoading from './AltState/ListLoading';
import NoResults from './AltState/NoResult';
import ListItem from './ListItem/ListItem';
import RefreshButton from './RefreshButton/RefreshButton';
import useSelectedItemKey, { getListItemKey } from './useSelectedItemKey';

import './RestaurantList.css';

const NEAR_BOTTOM_THRESHOLD = 180;

const RestaurantList: FC<{
  pageSize?: number;
}> = ({ pageSize = 10 }) => {

  // REFRESH STATE
  const [shouldAutoRefresh, setShouldAutoRefresh] = useState(true);

  // NETWORK CALL
  const { status, res, hasNextPage, isFetchingNextPage, fetchNextPage, isListStale, filterKey
  } = usePullUpPanelListQuery(shouldAutoRefresh, pageSize);

  // SELECTION STATE
  const items = res?.data ?? [];
  const [selectedItemKey, setSelectedItemKey] = useSelectedItemKey(items);

  // FILTER CHANGE → AUTO-REFRESH (bypass refresh button)
  useEffect(() => {
    setShouldAutoRefresh(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // SCROLL HANDLER
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    // AT TOP — latch off auto-refresh once user scrolls
    if (el.scrollTop > 0) setShouldAutoRefresh(false);

    // NEAR BOTTOM
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - NEAR_BOTTOM_THRESHOLD;
    if (nearBottom && hasNextPage && !isFetchingNextPage)
      void fetchNextPage();

  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // UPDATE SCROLL CONTAINER WHEN A REFRESHED LIST HAS SETTLED
  const [scrollResetEpoch, setScrollResetEpoch] = useState(0);
  const [shouldFade, setShouldFade] = useState(false);
  const [isRefreshPending, setIsRefreshPending] = useState(false);
  const pendingFadeRef = useRef(false);
  const wasListStaleRef = useRef(false);
  useEffect(() => {
    if (wasListStaleRef.current && !isListStale) { 
      setShouldFade(pendingFadeRef.current);
      pendingFadeRef.current = false;
      setIsRefreshPending(false);
      setScrollResetEpoch((e) => e + 1);
    }
    wasListStaleRef.current = isListStale;
  }, [isListStale]);

  // REFRESH BUTTON STATES
  // button may disappear mid pan due to matching geo params to last fetch
  // this triggers 'isReady' to true; meaning list is no longer stale
  const refreshAvaliable = isListStale && !shouldAutoRefresh;
  const onListRefresh = useCallback(() => {
    if (!isListStale) return;
    pendingFadeRef.current = true;
    setIsRefreshPending(true);
    setShouldAutoRefresh(true);
  }, [isListStale]);

  // VIRTUALIZER
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 86, // estimated height of each list item
    getItemKey: (index) => getListItemKey(items[index].id, index),
    overscan: 5,
  });
  // SYNC VIRTUALIZER OFFSET AFTER A REFRESHED LIST HAS SETTLED
  useLayoutEffect(() => {
    rowVirtualizer.scrollToOffset(0, { behavior: 'auto' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollResetEpoch]);

  return (
    <div ref={scrollRef} className="list-scroll-content"
      // style={{ overflowY: panelUp ? 'auto' : 'hidden' }}
      onScroll={onScroll}
    >
      <RefreshButton onListRefresh={onListRefresh} isVisible={refreshAvaliable || isRefreshPending} isLoading={isRefreshPending} />
      <div className={`list-section${shouldFade ? ' list-fade-in' : ''}`}>
        <ListLoading enabled={status === 'loading' && items.length === 0} />
        <NoResults enabled={status !== 'loading' && items.length === 0} />
        <div className="list-virtualizer" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = items[virtualRow.index];
            const itemKey = getListItemKey(row.id, virtualRow.index);

            return (
              <div
                key={itemKey}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                className="list-virtual-row"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <ListItem
                  item={row}
                  isSelected={selectedItemKey === itemKey}
                  onSelect={() => setSelectedItemKey(itemKey)}
                  onClose={() => { setSelectedItemKey((prev) => (prev === itemKey ? null : prev)); }}
                />
              </div>
            );
          })}
        </div>
        {/* {items.map((row, idx) => {
          const itemKey = getListItemKey(row.id, idx);
          return (<ListItem
            key={itemKey}
            item={row}
            isSelected={selectedItemKey === itemKey}
            onSelect={() => setSelectedItemKey(itemKey)}
            onClose={() => { setSelectedItemKey((prev) => (prev === itemKey ? null : prev))}}
          />);
        })} */}
        {isFetchingNextPage && (
          <div className="list-pagination">
            <span>Loading more…</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default RestaurantList;
