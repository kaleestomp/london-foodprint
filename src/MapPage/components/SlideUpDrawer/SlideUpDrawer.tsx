'use client';
import { useState } from 'react';
import { Drawer } from 'vaul';

import SampleContent from './SampleContent/SampleContent';

import './SlideUpDrawer.css';

const snapPoints = ['148px', '355px', 1];

export default function SlideUpDrawer() {

  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  return (
    <Drawer.Root 
      defaultOpen={true} dismissible={false} modal={true}
      snapPoints={snapPoints} activeSnapPoint={snap} 
      setActiveSnapPoint={setSnap} snapToSequentialPoint={true}
      fadeFromIndex={2}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="vaul-overlay" />
        <Drawer.Content data-testid="content" className="vaul-content">
          <Drawer.Handle className="vaul-handle" />
          <SampleContent snap={snap} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}