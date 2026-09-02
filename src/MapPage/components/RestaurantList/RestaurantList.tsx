import { useEffect, useState, type FC } from 'react';
import type maplibregl from 'maplibre-gl';

import useFetchInfinitePlacesList from './InputHook/useFetchInfinitePlacesList';
import ListLoading from './AltState/ListLoading';
import NoResults from './AltState/NoResult';
import RefreshButton from './RefreshButton/RefreshButton';
import useScrollState from './Virtualizer/useScrollState';
import useRefreshState from './RefreshButton/useRefreshState';
import Virtualizer from './Virtualizer/Virtualizer';

import './RestaurantList.css';

const RestaurantList: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
  pageSize?: number;
  autoUpdate?: boolean;
}> = ({ mapRef, pageSize = 10, autoUpdate = false }) => {
  
  // REFRESH STATE
  const [shouldAutoRefresh, setShouldAutoRefresh] = useState(true);

  // NETWORK CALL
  const resetSignal = autoUpdate ? autoUpdate : shouldAutoRefresh;
  const { status, res, hasNextPage, isFetchingNextPage, fetchNextPage, isListStale, filterKey
  } = useFetchInfinitePlacesList(resetSignal, pageSize);
  const items = res?.data ?? [];

  // FILTER CHANGE → AUTO-REFRESH (bypass refresh button)
  useEffect(() => {
    setShouldAutoRefresh(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // SCROLL HANDLER
  const readToFetchNext = hasNextPage && !isFetchingNextPage;
  const { scrollRef, onScroll } = useScrollState(readToFetchNext, fetchNextPage, setShouldAutoRefresh);

  // RESET SCROLL CONTAINER WHEN A REFRESHED LIST HAS SETTLED
  const { scrollResetEpoch, shouldFade, isRefreshPending, onListRefresh, onRefreshAnimationEnd 
    } = useRefreshState(isListStale, setShouldAutoRefresh);
    
  // REFRESH BUTTON STATES
  // button may disappear mid pan due to matching geo params to last fetch
  // this triggers 'isReady' to true; meaning list is no longer stale
  const refreshAvaliable = isListStale && !shouldAutoRefresh;
  const showRefreshButton = refreshAvaliable || isRefreshPending;
  
  return (
    <div ref={scrollRef} className="list-scroll-content" onScroll={onScroll}>
      <RefreshButton onListRefresh={onListRefresh} isVisible={showRefreshButton} isLoading={isRefreshPending} />
      <div className={`list-section${shouldFade ? ' list-fade-in' : ''}`} onAnimationEnd={shouldFade ? onRefreshAnimationEnd : undefined} >
        <ListLoading enabled={status === 'loading' && items.length === 0} />
        <NoResults enabled={status !== 'loading' && items.length === 0} />
        <Virtualizer mapRef={mapRef} items={items} scrollRef={scrollRef} scrollResetEpoch={scrollResetEpoch} onSelect={() => setShouldAutoRefresh(false)} />
        <ListLoading enabled={isFetchingNextPage} rowCount={3} />
      </div>
    </div>
  );
};

export default RestaurantList;
