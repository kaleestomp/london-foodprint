import { type FC, useEffect } from 'react';
import RamenDiningIcon from '@mui/icons-material/RamenDining';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';
// import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarRoundedIcon from '@mui/icons-material/StarRounded';

import { useAppUI } from '../../../context/AppUIContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
import PillButton from './PillButton/PillButton';
import getCuisineCountLabel from './getCuisineCountLabel';
import getAbstractPriceRangeLabel from './getAbstractPriceRangeLabel';
// import getRatingLabel from './getRatingLabel';

import './FilterButtons.css';


const FilterButtons: FC = () => {

  const { activeToolbarTab, setActiveToolbarTab } = useAppUI();
  const { openDrawer, isClosed } = useDrawerState();
  useEffect(() => {
    if (isClosed) setActiveToolbarTab(null);
  }, [isClosed]);

  const openFilterTab = (tab: 'rating' | 'cuisine' | 'price') => {
    if (activeToolbarTab === tab) {
      setActiveToolbarTab(null);
      return;
    }
    setActiveToolbarTab(tab);
    if (isClosed) openDrawer();
  };

  // Request Price Info
  const AbstractPriceRangeLabel = getAbstractPriceRangeLabel();
  // const ratingLabel = getRatingLabel();
  // Request Cuisine Info
  const cuisineCountLabel = getCuisineCountLabel();

  return (
    <div className="filter-buttons">
      <PillButton
        icon={<StarRoundedIcon fontSize="small" />}
        text={activeToolbarTab !== 'rating' ? '' : 'Rating'}
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
