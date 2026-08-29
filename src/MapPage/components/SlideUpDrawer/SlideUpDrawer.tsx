'use client';
import { useState } from 'react';
import { Drawer } from 'vaul';

// import SampleContent from './SampleContent/SampleContent';
import Header from './Header/Header';
// import Content from './Content/Content';
import AboveDrawer from './AboveDrawer/AboveDrawer';
import { useDrawerState } from './DrawerStateContext';

import './SlideUpDrawer.css';

const SNAP_HEIGHTS = ['56px', 0.5, `${window.innerHeight-56}px`];

export default function SlideUpDrawer() {

  const [snap, setSnap] = useState<number | string | null>(SNAP_HEIGHTS[0]);
  const { reportDrawerHeight } = useDrawerState();

  return (
    <Drawer.Root 
      defaultOpen={true} dismissible={false} modal={false}
      snapPoints={SNAP_HEIGHTS} activeSnapPoint={snap} 
      setActiveSnapPoint={setSnap} snapToSequentialPoint={true}
      fadeFromIndex={2}
      onDragPositionChange={(visibleHeight) => reportDrawerHeight(visibleHeight)}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="vaul-overlay" />
        <Drawer.Content data-testid="content" className="vaul-content">
          <AboveDrawer />
          <div className="vaul-drawer-body">
            <Drawer.Handle className="vaul-handle" />
            <Header />
            {/* <SampleContent snap={snap} /> */}
            {/* <Content /> */}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}