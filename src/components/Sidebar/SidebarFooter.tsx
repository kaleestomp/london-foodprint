import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; 
import SaveIcon from '@mui/icons-material/Save'; 
import RotateLeftIcon from '@mui/icons-material/RotateLeft';

import './Sidebar.css';

const SidebarFooter: React.FC = () => {
    return (
        <Box className="sidebar-icon-group sidebar-footer"> 
            <Tooltip title="Reset" placement='right'>
                <IconButton aria-label="toggle-reset">
                    <RotateLeftIcon fontSize="medium" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Save" placement='right'>
                <IconButton aria-label="toggle-save">
                    <SaveIcon fontSize="medium" />
                </IconButton>
            </Tooltip>
            <Tooltip title="File Upload" placement='right'>
                <IconButton aria-label="toggle-file-upload">
                    <CloudUploadIcon fontSize="medium" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Account" placement='right'>
                <IconButton aria-label="toggle-account">
                    <AccountCircleIcon fontSize="medium" />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

export default SidebarFooter;
