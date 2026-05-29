import { useAppUI } from '../../../context/AppUIContext'; 

import Searchbar from './Searchbar/Searchbar';

import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography'; 
import ExpandCircleDownOutlinedIcon from '@mui/icons-material/ExpandCircleDownOutlined';
import './SidedrawHeader.css';

const SidedrawHeader = () => {
  const { toggleSideDraw } = useAppUI(); 
  return (
    <div className="sidedraw-header-block">
      <div className="sidedraw-header-title-block">
        <Typography variant="caption">
        </Typography>
        <Typography variant="subtitle1">
          
        </Typography>
      </div> 
      <div className="sidedraw-header-toolbar">
        <Searchbar />
        <IconButton className="sidedraw-header-icon-btn" 
        size="small" aria-label="info" sx={{ transform: 'rotate(90deg)' }} 
        onClick={ toggleSideDraw }
        > 
          <ExpandCircleDownOutlinedIcon />
        </IconButton>
      </div>
    </div>
  );
}

export default SidedrawHeader;
