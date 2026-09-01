import type { CSSProperties, FC, ReactNode } from 'react';
import { useIsMobileCtx } from '../../../../context/IsMobileContext';
// import { usePullUpPanelMetrics } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import { useDrawerState } from '../../SlideUpDrawer/DrawerStateContext';

import './PositioningWrapper.css';

type PositioningWrapperProps = { children: ReactNode };
const PositioningWrapper: FC<PositioningWrapperProps> = ({ children }) => {
  const isMobile = useIsMobileCtx();
  // const { panelHeight, translateY } = usePullUpPanelMetrics();
  // const toolbarOffset = isMobile ? Math.max(16, panelHeight - translateY + 10) : 30;
  
  const { snapPX } = useDrawerState();
  const toolbarOffset = isMobile ? Math.max(16, (snapPX ?? 0) + 10) : 30;

  const toolbarStyle: CSSProperties & Record<string, string | number> = {
    bottom: 0,
    '--bottom-toolbar-offset': `${toolbarOffset}px`,
  };

  if (!isMobile) return null;

  return (
    <div
      className="restaurant-bottom-toolbar"
      style={toolbarStyle}
      aria-label="Map toolbar"
    >
      {children}
    </div>
  );
};

export default PositioningWrapper;
