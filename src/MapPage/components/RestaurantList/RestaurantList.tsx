import { useEffect, useState, type FC } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useCityContext } from '../../../context/CityContext';
import { useIsMobileCtx } from '../../../context/IsMobileContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
import useFetchInfinitePlacesList from './InputHook/useFetchInfinitePlacesList';
import ListLoading from './SkeletonCard/ListLoading';
import NoResults from './SkeletonCard/NoResult';
import RefreshButton from './RefreshButton/RefreshButton';
import useScrollState from './Virtualizer/useScrollState';
import useRefreshState from './RefreshButton/useRefreshState';
import Virtualizer from './Virtualizer/Virtualizer';
import useClearOnDrawerClose from './useClearOnClose';

import './RestaurantList.css';

const RestaurantList: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
  pageSize: number;
  resetOverride?: boolean;
  enabled?: boolean;
  // hidden?: boolean; 
  // CANNOT UNMOUNT FOR NOW 
  // DUE TO useReportSelectionNotInList
  // REQUIRED TO UPDATE RENDERED LIST CONTEXT
}> = ({ mapRef, pageSize, resetOverride = false, enabled = true }) => {

  // REFRESH STATE
  const [liveRefresh, setLiveRefresh] = useState(true);
  const isMobile = useIsMobileCtx();

  // DO NOT RESET OVERRIDE 
  // When the drawer is closed, remove the cached places list 
  // and reset auto-refresh
  const { isClosed, isAtFullHeight } = useDrawerState();
  useClearOnDrawerClose(isClosed, setLiveRefresh);

  // NETWORK CALL
  const reset = resetOverride || liveRefresh;
  const enableCall = enabled && !(isMobile && isClosed);
  const { status, res, hasNextPage, isFetchingNextPage, fetchNextPage, isListStale, filterKey
  } = useFetchInfinitePlacesList(reset, pageSize, enableCall);
  const items = enableCall ? (res?.data ?? []) : [];

  // FILTER OR CITY CHANGE STARTS LIVE-REFRESH
  const { citySlug } = useCityContext();
  useEffect(() => {
    setLiveRefresh(true);
  }, [filterKey, citySlug]);

  // SCROLL HANDLER
  const nextPageFetchReady = hasNextPage && !isFetchingNextPage;
  const { scrollRef, onScroll } = useScrollState(nextPageFetchReady, fetchNextPage, setLiveRefresh);

  // RESET SCROLL CONTAINER WHEN A REFRESHED LIST HAS SETTLED
  const { scrollResetEpoch, fadeRefreshBtn, isRefreshPending, onListRefresh, onRefreshAnimationEnd
  } = useRefreshState(isListStale, setLiveRefresh);

  // REFRESH BUTTON STATES
  const refreshAvaliable = isListStale && !liveRefresh;
  const uiAvaliable = (isMobile && !isClosed && !isAtFullHeight) || !isMobile;
  const showRefreshButton = uiAvaliable && (refreshAvaliable || isRefreshPending);
  const wrapperClass = "list-scroll-content"; //`list-scroll-content${hidden ? ' is-hidden' : ''}`;

  // DEFAULT STATE
  return enabled ? (
    <div ref={scrollRef} className={wrapperClass} onScroll={onScroll}>
      <RefreshButton onListRefresh={onListRefresh} isVisible={showRefreshButton} isLoading={isRefreshPending} />
      <div className={`list-section${fadeRefreshBtn ? ' list-fade-in' : ''}`} onAnimationEnd={fadeRefreshBtn ? onRefreshAnimationEnd : undefined} >
        <ListLoading enabled={status === 'loading' && items.length === 0} rowCount={isMobile ? 6 : 12} />
        <NoResults enabled={status !== 'loading' && items.length === 0} />
        <Virtualizer mapRef={mapRef} items={items} scrollRef={scrollRef} scrollResetEpoch={scrollResetEpoch} onSelect={() => setLiveRefresh(false)} />
        <ListLoading enabled={isFetchingNextPage} rowCount={3} />
      </div>
    </div>

  ) : ( // SKELETON STATE
    <div className={wrapperClass}>
      <div className="list-section">
        <ListLoading enabled rowCount={isMobile ? 8 : 20} />
      </div>
    </div>
  );
};

export default RestaurantList;
