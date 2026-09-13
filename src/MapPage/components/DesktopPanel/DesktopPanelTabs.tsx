import type { FC } from 'react';
import ListIcon from '@mui/icons-material/List';
import RamenDiningIcon from '@mui/icons-material/RamenDining';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import { useAppUI } from '../../../context/AppUIContext';

import './DesktopPanelTabs.css';

const DesktopPanelTabs: FC = () => {
  const { activeToolbarTab, setActiveToolbarTab } = useAppUI();

  return (
    <div className="desktop-panel-tabs" role="tablist" aria-label="Filter settings">
      <button
        className={activeToolbarTab === null ? 'is-active' : ''}
        type="button"
        role="tab"
        aria-selected={activeToolbarTab === null}
        onClick={() => setActiveToolbarTab(null)}
      >
        <ListIcon fontSize="small" />
        List
      </button>
      <button
        className={activeToolbarTab === 'rating' ? 'is-active' : ''}
        type="button"
        role="tab"
        aria-selected={activeToolbarTab === 'rating'}
        onClick={() => setActiveToolbarTab(activeToolbarTab === 'rating' ? null : 'rating')}
      >
        <StarBorderIcon fontSize="small" />
        Rating
      </button>
      <button
        className={activeToolbarTab === 'cuisine' ? 'is-active' : ''}
        type="button"
        role="tab"
        aria-selected={activeToolbarTab === 'cuisine'}
        onClick={() => setActiveToolbarTab(activeToolbarTab === 'cuisine' ? null : 'cuisine')}
      >
        <RamenDiningIcon fontSize="small" />
        Cuisine
      </button>
      <button
        className={activeToolbarTab === 'price' ? 'is-active' : ''}
        type="button"
        role="tab"
        aria-selected={activeToolbarTab === 'price'}
        onClick={() => setActiveToolbarTab(activeToolbarTab === 'price' ? null : 'price')}
      >
        <CurrencyPoundIcon fontSize="small" />
        Budget
      </button>
    </div>
  );
};

export default DesktopPanelTabs;