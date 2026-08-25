import type { FC } from 'react';

import { usePullUpPanelSnapState } from '../SnapHooks/PullUpPanelSnapContext';
import usePullUpPanelListQuery from './InputHook/usePullUpPanelListQuery';
import ListLoading from './AltState/ListLoading';
import NoResults from './AltState/NoResult';
import ListItem from './ListItem';
import './RestaurantList.css';

const RestaurantList: FC = () => {

  const { status: listStatus, res: listRes, page, setPage } = usePullUpPanelListQuery();

  const loadMore = Boolean(listRes && listRes.data.length >= 20);

  const { handleContentPointerDown, handleContentPointerMove, handleContentPointerUp, 
    handleContentPointerCancel, isPanelOpen } = usePullUpPanelSnapState();

  return (
    <div
      className="restaurant-panel-scroll-content"
      style={{ overflowY: isPanelOpen ? 'auto' : 'hidden' }} //alow scroll?
      onPointerDown={handleContentPointerDown}
      onPointerMove={handleContentPointerMove}
      onPointerUp={handleContentPointerUp}
      onPointerCancel={handleContentPointerCancel}
    >
      <div className="restaurant-list-section">
        <ListLoading enabled={listStatus === 'loading'} />
        <NoResults enabled={listStatus !== 'loading' && (!listRes || listRes.data.length === 0)} />

        {listRes?.data.map((row, idx) => 
          <ListItem key={`${row.display_name}-${idx}`} item={row} />
        )}

        <div className="restaurant-list-pagination">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!loadMore}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantList;
