import type { FC } from 'react';
import RamenDiningIcon from '@mui/icons-material/RamenDining';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useAppUI } from '../../../context/AppUIContext';
import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import PositioningWrapper from './PositioningWrapper/PositioningWrapper';
import PillButton from './PillButton/PillButton';
import getPriceRangeLabel from './getPriceRangeLabel';
import getCuisineCountLabel from './getCuisineCountLabel';

import './BaseToolbar.css';

type Props = { };
const BaseToolbar: FC<Props> = () => {
  const { activeFilterTab, setActiveToolbarTab } = useAppUI();
  const { openPanel } = usePullUpPanelSnapState();

  const openFilterTab = (tab: 'rating' | 'cuisine' | 'price') => {
    if (activeFilterTab === tab) {
      setActiveToolbarTab(null);
      return;
    }

    setActiveToolbarTab(tab);
    openPanel();
  };

  const priceRangeLabel = getPriceRangeLabel();
  const cuisineCountLabel = getCuisineCountLabel();

  return (
    <PositioningWrapper>
      <div className="restaurant-bottom-toolbar-row">
        <PillButton
          icon={<StarBorderIcon fontSize="small" />}
          text="5+"
          ariaLabel="Open rating filters"
          isActive={activeFilterTab === 'rating'}
          onClick={() => openFilterTab('rating')}
        />
        <PillButton
          icon={<RamenDiningIcon fontSize="small" />}
          text={cuisineCountLabel}
          ariaLabel="Open cuisine filters"
          isActive={activeFilterTab === 'cuisine'}
          onClick={() => openFilterTab('cuisine')}
        />
        <PillButton
          icon={<CurrencyPoundIcon fontSize="small" />}
          text={priceRangeLabel}
          ariaLabel="Open budget filters"
          isActive={activeFilterTab === 'price'}
          onClick={() => openFilterTab('price')}
        />
      </div>
    </PositioningWrapper>
  );
};

export default BaseToolbar;
