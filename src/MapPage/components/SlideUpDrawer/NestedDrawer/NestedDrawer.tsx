import { type FC, useState } from 'react';
import { Drawer } from '@base-ui/react/drawer';

import './NestedDrawer.css';

const NestedDrawer: FC<{
    open: boolean
}> = ({ open }) => {
    // const [open, setOpen] = useState(false);
    
    return (
        <Drawer.Root open={open} onOpenChange={setOpen}>
            {/* <Drawer.Trigger className="nested-drawer-trigger">
                Open nested drawer
            </Drawer.Trigger> */}
            <Drawer.Portal>
                
                <Drawer.Viewport className="nested-drawer-viewport">
                    <Drawer.Popup className="nested-drawer-popup">
                        <Drawer.Content className="nested-drawer-content">
                            placehholder text
                        </Drawer.Content>
                    </Drawer.Popup>
                </Drawer.Viewport>
            </Drawer.Portal>
        </Drawer.Root>
    );
};

export default NestedDrawer;