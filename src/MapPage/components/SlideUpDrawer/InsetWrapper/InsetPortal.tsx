import { type FC, useState, type ReactNode } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { useDrawerState } from '../DrawerStateContext';

import './InsetWrapper.css';

export const SNAP_HEIGHTS = ['94px', 0.4, `${window.innerHeight - 28}px`];//200px 94px 320px 104px
const InsetPortal: FC<{
  children: ReactNode;
}> = ({ children }) => {

  const [drawerContainer, setDrawerContainer] = useState<HTMLDivElement | null>(null);
  const { snap, updateSnap, isAtFullHeight, isClosed } = useDrawerState();
  
  return (
    <Drawer.Root
      open={true}
      onOpenChange={() => undefined}
      disablePointerDismissal
      modal={false}
      snapPoints={SNAP_HEIGHTS}
      snapPoint={snap}
      onSnapPointChange={updateSnap}
      snapToSequentialPoints
    >
      <div ref={setDrawerContainer} className={`base-ui-container${isAtFullHeight ? ' is-full-height' : isClosed ? '' : ' is-open'}`}>
        {drawerContainer && <Drawer.Portal container={drawerContainer}>
          <Drawer.Viewport>
            <Drawer.Popup>{children}</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>}
      </div>

    </Drawer.Root>
  );
};

export default InsetPortal;