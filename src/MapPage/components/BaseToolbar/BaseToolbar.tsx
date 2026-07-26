import type { FC } from 'react';
import RamenDiningIcon from '@mui/icons-material/RamenDining';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useAppUI } from '../../../context/AppUIContext';
import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import PositioningWrapper from './PositioningWrapper/PositioningWrapper';
import PillButton from './PillButton/PillButton';
import getCuisineCountLabel from './getCuisineCountLabel';

import getPriceHistRequestParams from '../PullUpPanel/OverviewSection/PriceFilter/Input/getPriceHistRequestParams';
import useRequestPriceHistogram from '../../request/useRequestPriceHistogram/useRequestPriceHistogram';
import getAbstractPriceRangeLabel from './getAbstractPriceRangeLabel';

import './BaseToolbar.css';


const BaseToolbar: FC = () => {
  
  const { activeToolbarTab, setActiveToolbarTab } = useAppUI();
  const { openPanel } = usePullUpPanelSnapState();
  const openFilterTab = (tab: 'rating' | 'cuisine' | 'price') => {
    if (activeToolbarTab === tab) {
      setActiveToolbarTab(null);
      return;
    }
    setActiveToolbarTab(tab);
    openPanel();
  };
  

  // Request Price Info
  const priceRequestParams = getPriceHistRequestParams();
  const { res } = useRequestPriceHistogram(priceRequestParams);
  const priceData = res?.cost_histogram ?? [];
  const AbstractPriceRangeLabel = getAbstractPriceRangeLabel(priceData);

  // Request Cuisine Info
  const cuisineCountLabel = getCuisineCountLabel();

  return (
    <PositioningWrapper>
      <div className="restaurant-bottom-toolbar-row">
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
    </PositioningWrapper>
  );
};

export default BaseToolbar;
