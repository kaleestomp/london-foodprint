import type { FC } from 'react';

import './HeaderDesktop.css';

type Props = {};
const HeaderDesktop: FC<Props> = () => {

  return (
    <div className="restaurant-panel-header-desktop">
      <span>Restaurants in this area</span>
      {/* <DarkModeToggle /> */}
    </div>
  );
};

export default HeaderDesktop;
