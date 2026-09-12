import type { FC } from 'react';

import './Styling/drawerOverlay.css';

type Props = {
  isVisible: boolean;
};

const DrawerOverlay: FC<Props> = ({ isVisible }) => (
  <div
    aria-hidden="true"
    className={`base-ui-overlay${isVisible ? ' is-visible' : ''}`}
  />
);

export default DrawerOverlay;
