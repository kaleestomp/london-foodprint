import { useEffect, useState, type FC } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useCityContext } from '../../../context/CityContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
// import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import useFetchInfinitePlacesList from './InputHook/useFetchInfinitePlacesList';
import useReportUnmatchedSelection from './PlaceholderListItem/useReportUnmatchedSelection';
import ListLoading from './SkeletonCard/ListLoading';
import NoResults from './SkeletonCard/NoResult';
import RefreshButton from './RefreshButton/RefreshButton';
import useScrollState from './Virtualizer/useScrollState';
import useRefreshState from './RefreshButton/useRefreshState';
import Virtualizer from './Virtualizer/Virtualizer';
import PlaceholderListItem from '../RestaurantList/PlaceholderListItem/PlaceholderListItem';

import './RestaurantList.css';

const RestaurantList: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
  pageSize?: number;
  autoUpdate?: boolean;
  enabled?: boolean;
}> = ({ mapRef, pageSize = 10, autoUpdate = false, enabled = true }) => {

  // REFRESH STATE
  const [shouldAutoRefresh, setShouldAutoRefresh] = useState(true);

  // DO NOT RESET OVERRIDE 
  // When the drawer is closed and a place is selected
  const { isClosed, isAtFullHeight } = useDrawerState();
  // const { selectedPlaceId } = usePlaceSelection();
  // const doNotReset = isClosed && selectedPlaceId !== null;

  // NETWORK CALL
  const resetSignal = (autoUpdate) ? autoUpdate : shouldAutoRefresh;
  const { status, res, hasNextPage, isFetchingNextPage, fetchNextPage, isListStale, filterKey
  } = useFetchInfinitePlacesList(resetSignal, pageSize, enabled);
  const items = res?.data ?? [];

  // UNMATCHED SELECTED PLACE ID
  // Selected cluster singleton marker with no matching row in the loaded list.
  const unmatchedPlaceId = useReportUnmatchedSelection(items, status);
  const [fixScroll, setFixScroll] = useState(0);
  useEffect(() => {
    if (unmatchedPlaceId) setFixScroll((epoch) => epoch + 1);
  }, [unmatchedPlaceId]);

  // FILTER OR CITY CHANGE â†’ AUTO-REFRESH (bypass refresh button)
  const { citySlug } = useCityContext();
  useEffect(() => {
    setShouldAutoRefresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, citySlug]);

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
  const showRefreshButton = !isClosed && !isAtFullHeight && (refreshAvaliable || isRefreshPending);

  if (!enabled) {
    return (
      <div className="list-scroll-content">
        <div className="list-section">
          <ListLoading enabled />
        </div>
      </div>
    );
  }

  return (
    <>
      {unmatchedPlaceId && (
        <div className="placeholder-list-item">
          <PlaceholderListItem placeId={unmatchedPlaceId} />
        </div>
      )}
      <div ref={scrollRef} className="list-scroll-content" onScroll={onScroll}>
        <RefreshButton onListRefresh={onListRefresh} isVisible={showRefreshButton} isLoading={isRefreshPending} />
        <div className={`list-section${shouldFade ? ' list-fade-in' : ''}`} onAnimationEnd={shouldFade ? onRefreshAnimationEnd : undefined} >
          <ListLoading enabled={status === 'loading' && items.length === 0} />
          <NoResults enabled={status !== 'loading' && items.length === 0} />
          <Virtualizer mapRef={mapRef} items={items} scrollRef={scrollRef} scrollResetEpoch={scrollResetEpoch} fixScroll={fixScroll} onSelect={() => setShouldAutoRefresh(false)} />
          <ListLoading enabled={isFetchingNextPage} rowCount={3} />
        </div>
      </div>
    </>

  );
};

export default RestaurantList;
