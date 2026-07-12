import type { FC, PointerEvent as ReactPointerEvent } from 'react';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import useRestaurantCount from '../../../../components/PullUpPanel/Desktop/Header/useRestaurantCount';

import './HeaderMobile.css';

type Props = {
  isPanelOpen: boolean;
  onHandlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

const HeaderMobile: FC<Props> = ({
  isPanelOpen,
  onHandlePointerDown,
}) => {
  const { searchMask } = useSearchFilters();
  const { count, isLoading } = useRestaurantCount();

  const getTitleText = () => {
    if (isLoading) {
      return searchMask ? 'Restaurants in search area...' : 'Restaurants in this area...';
    }

    if (count !== null) {
      const countText = count === 1 ? 'restaurant' : 'restaurants';
      if (searchMask) {
        return `${count} ${countText} in search area`;
      }
      return `${count} ${countText} in this area`;
    }

    return searchMask ? 'Restaurants in search area' : 'Restaurants in this area';
  };

  return (
    <div
      className="restaurant-sheet-header"
      onPointerDown={onHandlePointerDown}
    >
      <div className="restaurant-sheet-handle-wrap">
        <div className="restaurant-sheet-handle" />
      </div>
      <div className="restaurant-sheet-title-row">
        <div className="restaurant-sheet-title-main">
          <div className="restaurant-sheet-title">{getTitleText()}</div>
          <div className="restaurant-sheet-subtitle">
            {isPanelOpen ? 'Pull down from top to close' : 'Pull up to open'}
          </div>
        </div>
        {/* <DarkModeToggle /> */}
      </div>
    </div>
  );
};

export default HeaderMobile;
