import PageNavigation from './PageNavigation'; 
import UIToggles from './UIToggles'; 
import SidebarFooter from './SidebarFooter'; 

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import iconUrl from '/icon-explorer.png?url';

import './Sidebar.css';

const Sidebar: React.FC = () => { 
  return (
    <aside className="sidebar" aria-label="Primary navigation sidebar">
      <Box className="sidebar-logo"> 
        <img src={iconUrl} alt="EPD-Portal-icon" width={28} height={28} />
      </Box>

      <Divider />
      <PageNavigation />

      <Divider />
      <UIToggles />

      <SidebarFooter />
    </aside>
  );
}

export default Sidebar;
