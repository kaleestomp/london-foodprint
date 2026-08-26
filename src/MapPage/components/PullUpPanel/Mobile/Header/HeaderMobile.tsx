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
      className="pull-up-panel-header"
      onPointerDown={onHandlePointerDown}
    >
      <div className="pull-up-panel-handle-wrap">
        <div className="pull-up-panel-handle" />
      </div>
      <div className="pull-up-panel-title-row">
        <div className="pull-up-panel-title-block">
          <div className="pull-up-panel-title">{headline}</div>
          {/* <div className="pull-up-panel-subtitle">
            Ranked Top 25% of Metroplitan Area
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default HeaderMobile;
