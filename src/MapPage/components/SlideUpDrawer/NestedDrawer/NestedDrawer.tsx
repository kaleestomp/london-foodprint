import { type FC, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import './NestedDrawer.css';

const NestedDrawer: FC<{
    launch: boolean;
    children: ReactNode;
}> = ({ launch, children }) => {

    const [open, setOpen] = useState(false);
    useEffect(() => {
        setOpen(launch);
    }, [launch]);
    // console.log(show);
    
    return (
        <Drawer.Root open={open} onOpenChange={setOpen}>
            {/* <Drawer.Trigger className="nested-drawer-trigger">
                Open nested drawer
            </Drawer.Trigger> */}
            <Drawer.Portal>
                
                <Drawer.Viewport className="nested-drawer-viewport">
                    <Drawer.Popup className="nested-drawer-popup">
                        <div className="base-ui-handle" aria-hidden="true" />
                        <Drawer.Content className="nested-drawer-content">
                            {children}
                        </Drawer.Content>
                    </Drawer.Popup>
                </Drawer.Viewport>
            </Drawer.Portal>
        </Drawer.Root>
    );
};

export default NestedDrawer;