import type { FC } from 'react';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import useRestaurantCount from './useRestaurantCount';

import './HeaderDesktop.css';

type Props = {};
const HeaderDesktop: FC<Props> = () => {
  const { searchMask } = useSearchFilters();
  const { count, isLoading } = useRestaurantCount();

  const getHeaderText = () => {
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
    <div className="restaurant-panel-header-desktop">
      <span>{getHeaderText()}</span>
      {/* <DarkModeToggle /> */}
    </div>
  );
};

export default HeaderDesktop;
