import type { FC } from 'react';
import RamenDiningIcon from '@mui/icons-material/RamenDining';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useAppUI } from '../../../context/AppUIContext';
// import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
import PillButton from './PillButton/PillButton';
import getCuisineCountLabel from './getCuisineCountLabel';
import getAbstractPriceRangeLabel from './getAbstractPriceRangeLabel';

import './FilterButtons.css';


const FilterButtons: FC = () => {

  const { activeToolbarTab, setActiveToolbarTab } = useAppUI();
  // const { openPanel } = usePullUpPanelSnapState();
  const { openDrawer } = useDrawerState();
  const openFilterTab = (tab: 'rating' | 'cuisine' | 'price') => {
    if (activeToolbarTab === tab) {
      setActiveToolbarTab(null);
      return;
    }
    setActiveToolbarTab(tab);
    openDrawer();
  };

  // Request Price Info
  const AbstractPriceRangeLabel = getAbstractPriceRangeLabel();
  // Request Cuisine Info
  const cuisineCountLabel = getCuisineCountLabel();

  return (
    <div className="filter-buttons">
      <PillButton
        icon={<StarBorderIcon fontSize="small" />}
        text="5%"
        ariaLabel="Open rating filters"
        isActive={activeToolbarTab === 'rating'}
        onClick={() => openFilterTab('rating')}
      />
      <PillButton
        icon={<RamenDiningIcon fontSize="small" />}
        text={activeToolbarTab !== 'cuisine' ? cuisineCountLabel : 'Cuisine'}
        ariaLabel="Open cuisine filters"
        isActive={activeToolbarTab === 'cuisine'}
        onClick={() => openFilterTab('cuisine')}
      />
      <PillButton
        icon={<CurrencyPoundIcon fontSize="small" />}
        text={activeToolbarTab !== 'price' ? AbstractPriceRangeLabel : 'Budget'}
        ariaLabel="Open budget filters"
        isActive={activeToolbarTab === 'price'}
        onClick={() => openFilterTab('price')}
      />
    </div>
  );
};

export default FilterButtons;
