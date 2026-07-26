import type { FC } from 'react';

import useResultSummary from '../../HeaderContent/ResultSummary';

import './HeaderDesktop.css';

type Props = {};
const HeaderDesktop: FC<Props> = () => {
  const { headline } = useResultSummary();

  return (
    <div className="restaurant-panel-header-desktop">
      <span>{headline}</span>
      {/* <DarkModeToggle /> */}
    </div>
  );
};

export default HeaderDesktop;
