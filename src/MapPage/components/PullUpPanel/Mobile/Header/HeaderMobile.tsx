import type { FC, PointerEvent as ReactPointerEvent } from 'react';

import useResultSummary from '../../HeaderContent/ResultSummary';

import './HeaderMobile.css';

type Props = {
  onHandlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

const HeaderMobile: FC<Props> = ({
  onHandlePointerDown,
}) => {
  const { headline } = useResultSummary();

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
          <div className="restaurant-sheet-title">{headline}</div>
          {/* <div className="restaurant-sheet-subtitle">
            Ranked Top 25% of Metroplitan Area
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default HeaderMobile;
