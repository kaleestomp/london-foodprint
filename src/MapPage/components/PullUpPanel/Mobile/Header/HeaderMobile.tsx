import type { FC, PointerEvent as ReactPointerEvent } from 'react';

import useResultSummary from '../../HeaderContent/ResultSummary';

import './HeaderMobile.css';

type Props = {
  isPanelOpen: boolean;
  onHandlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

const HeaderMobile: FC<Props> = ({
  isPanelOpen,
  onHandlePointerDown,
}) => {
  const titleText = useResultSummary();

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
          <div className="restaurant-sheet-title">{titleText}</div>
          <div className="restaurant-sheet-subtitle">
            {isPanelOpen ? "256 Top 10% rated restaurants in London" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderMobile;
