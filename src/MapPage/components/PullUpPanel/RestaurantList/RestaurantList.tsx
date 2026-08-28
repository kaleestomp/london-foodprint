import { useCallback, useRef, useState, type FC } from 'react';

import { usePullUpPanelSnapState } from '../SnapHooks/PullUpPanelSnapContext';
import usePullUpPanelListQuery from './InputHook/usePullUpPanelListQuery';
import ListLoading from './AltState/ListLoading';
import NoResults from './AltState/NoResult';
import ListItem from './ListItem/ListItem';
import RefreshButton from './RefreshButton/RefreshButton';
import useSelectedItemKey, { getListItemKey } from './useSelectedItemKey';

import './RestaurantList.css';

const NEAR_BOTTOM_THRESHOLD = 180;

const RestaurantList: FC = () => {

  // PARENT PULL-UP PANEL STATES
  const { handleContentPointerDown, handleContentPointerMove, handleContentPointerUp,
    handleContentPointerCancel, isPanelOpen } = usePullUpPanelSnapState();

  // SCROLL STATES
  const [hasScrolledSinceLastRefresh, setHasScrolledSinceLastRefresh] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const shouldAutoRefresh = isAtTop && !hasScrolledSinceLastRefresh;

  // NETWORK CALL
  const { status, res, hasNextPage, isFetchingNextPage, fetchNextPage, isListStale
  } = usePullUpPanelListQuery(shouldAutoRefresh);

  // SCROLL HANDLER
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    // DISGARD PROGRAM SCROLLS
    if (isProgrammaticScrollRef.current) {
      if (el.scrollTop <= 0) isProgrammaticScrollRef.current = false;
      return;
    }

    // AT TOP
    setIsAtTop(el.scrollTop <= 0);

    // USER SCROLLED
    const userScrolled = el.scrollTop > 0;
    setHasScrolledSinceLastRefresh((prev) => prev || userScrolled);

    // NEAR BOTTOM
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - NEAR_BOTTOM_THRESHOLD;
    if (nearBottom && hasNextPage && !isFetchingNextPage)
      void fetchNextPage();

  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // REFRESH BUTTON STATES
  // button may disappear mid pan due to matching geo params to last fetch
  // this triggers 'isReady' to true; meaning list is no longer stale
  const refreshAvaliable = isListStale && !shouldAutoRefresh;
  const onListRefresh = useCallback(() => {

    if (!isListStale) return;
    // RESET SCROLL STATES
    setHasScrolledSinceLastRefresh(false);
    setIsAtTop(true);

    // PROGRAMMED SCROLL TO TOP
    const el = scrollRef.current;
    if (el && el.scrollTop > 0) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: 0, behavior: 'smooth' });
        isProgrammaticScrollRef.current = true;
      });
    }
  }, [isListStale]);


  // SELECTION STATE
  const items = res?.data ?? [];
  const [selectedItemKey, setSelectedItemKey] = useSelectedItemKey(items);
  // console.log(items);

  return (
    <div
      ref={scrollRef}
      className="restaurant-panel-scroll-content"
      style={{ overflowY: isPanelOpen ? 'auto' : 'hidden' }}
      onScroll={onScroll}
      onPointerDown={handleContentPointerDown}
      onPointerMove={handleContentPointerMove}
      onPointerUp={handleContentPointerUp}
      onPointerCancel={handleContentPointerCancel}
    >
      <RefreshButton onListRefresh={onListRefresh} isVisible={refreshAvaliable} />
      <div className="restaurant-list-section">
        <ListLoading enabled={status === 'loading' && items.length === 0} />
        <NoResults enabled={status !== 'loading' && items.length === 0} />

        {items.map((row, idx) => {
          const itemKey = getListItemKey(row.id, idx);
          return (<ListItem
            key={itemKey}
            item={row}
            isSelected={selectedItemKey === itemKey}
            onSelect={() => setSelectedItemKey(itemKey)}
            onClose={() => {
              setSelectedItemKey((prev) => (prev === itemKey ? null : prev));
            }}
          />);
        })}

        {isFetchingNextPage && (
          <div className="restaurant-list-pagination">
            <span>Loading more…</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default RestaurantList;
