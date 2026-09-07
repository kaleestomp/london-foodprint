import { type FC, useState, type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { useDrawerState } from '../DrawerStateContext';

import './InsetPortal.css';

export const SNAP_HEIGHTS = ['94px', 0.4, `${window.innerHeight - 28}px`];//200px 94px 320px 104px
const InsetPortal: FC<{
  children: ReactNode;
}> = ({ children }) => {

  const [drawerContainer, setDrawerContainer] = useState<HTMLDivElement | null>(null);
  const { snap, updateSnap, isAtFullHeight, isClosed } = useDrawerState();
  
  return (
    <Drawer.Root
      defaultOpen={true} dismissible={false} modal={false}
      snapPoints={SNAP_HEIGHTS} activeSnapPoint={snap}
      setActiveSnapPoint={updateSnap} snapToSequentialPoint={false}
      fadeFromIndex={2} handleOnly={true} repositionInputs={false}
      container={drawerContainer}
    //onDragPositionChange={(visibleHeight) => void}
    >
      <div ref={setDrawerContainer} className={`vaul-container${isAtFullHeight ? ' is-full-height' : isClosed ? '' : ' is-open'}`}>
        {drawerContainer && <Drawer.Portal container={drawerContainer}>
          {children}
        </Drawer.Portal>}
      </div>

    </Drawer.Root>
  );
};

export default InsetPortal;