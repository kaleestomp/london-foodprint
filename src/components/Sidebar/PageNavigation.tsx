import { useNavigate, useLocation } from 'react-router-dom'; 

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt'; 

import './Sidebar.css';

const PageNavigation: React.FC = () => { 
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <Box className="sidebar-icon-group">
        {/* <Tooltip title="File Directory" placement='right'>
            <IconButton 
                aria-label="go-to-file-directory" 
                // disabled={true} 
                onClick={() => navigate('/file-directory')} 
                className={location.pathname === '/file-directory' ? 'nav-selected bg-highlight' : ''}
            ><FormatListBulletedIcon fontSize="medium"/>
            </IconButton>
        </Tooltip> */}
        <Tooltip title="Main Dashboard" placement='right'>
            <IconButton
                aria-label="go-to-main-dashboard" 
                onClick={() => navigate('/')}
                className={location.pathname === '/' ? 'nav-selected bg-highlight' : ''}
            >
            <ViewQuiltIcon fontSize="medium"/>
            </IconButton>
        </Tooltip>
    </Box>
  );
}

export default PageNavigation;
