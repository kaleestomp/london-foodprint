import type { FC, PointerEvent as ReactPointerEvent } from 'react';
import DarkModeToggle from '../../Toggle/DarkModeToggle';

import './HeaderMobile.css';

type Props = {
  isPanelOpen: boolean;
  onHandlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

const HeaderMobile: FC<Props> = ({
  isPanelOpen,
  onHandlePointerDown,
}) => {

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
          <div className="restaurant-sheet-title">Restaurants in this area</div>
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
