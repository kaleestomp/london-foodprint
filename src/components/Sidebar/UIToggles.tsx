import { useLocation } from 'react-router-dom'; 

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip'; 
import Badge from '@mui/material/Badge';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'; 
import FolderIcon from '@mui/icons-material/Folder';
import InboxIcon from '@mui/icons-material/Inbox'; 
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'; 

import { useAppUI } from '../../context/AppUIContext';
import './Sidebar.css';

const UIToggles: React.FC = () => { 
  const location = useLocation();
  const {
    isSidedrawOpen, isSideCardVisible, bookmarkCount,
    toggleSideDraw, toggleSideCard,
  } = useAppUI();

  return (
    <Box className="sidebar-icon-group">
      <Tooltip title="File Drawer" placement='right'>
        <IconButton
          aria-label="toggle-sidedraw"
          onClick={toggleSideDraw}
          color={isSidedrawOpen ? 'primaryBlack' : 'primaryGrey'}
          className={isSidedrawOpen ? 'nav-selected bg-highlight' : ''}
        >
          <FolderIcon fontSize="medium"/>
          {bookmarkCount > 0 && <Badge className="sidebar-button-badge" badgeContent={bookmarkCount} color="primary" />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Traffic Flow Monitor" placement='right'>
        <IconButton
          aria-label="toggle-traffic-flow-monitor"
          onClick={toggleSideCard}
          className={isSideCardVisible && location.pathname === '/' ? 'nav-selected bg-highlight' 
            : location.pathname !== '/' ? 'btn-disabled' : ''}
          disabled={location.pathname !== '/'}
        >
        <AccountTreeRoundedIcon fontSize="medium"/>
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default UIToggles;
