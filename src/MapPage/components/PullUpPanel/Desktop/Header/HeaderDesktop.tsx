import type { FC } from 'react';

import useResultSummary from '../../HeaderContent/ResultSummary';

import './HeaderDesktop.css';

type Props = {};
const HeaderDesktop: FC<Props> = () => {
  const headerText = useResultSummary();

  return (
    <div className="restaurant-panel-header-desktop">
      <span>{headerText}</span>
      {/* <DarkModeToggle /> */}
    </div>
  );
};

export default HeaderDesktop;
